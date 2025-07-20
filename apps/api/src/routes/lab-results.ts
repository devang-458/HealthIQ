import { Router } from 'express';
import { prisma } from '@repo/database';
import { z } from 'zod';

const router = Router();

const labResultSchema = z.object({
  date: z.string().datetime(),
  testType: z.string(),
  value: z.number(),
  unit: z.string(),
  normalRange: z.string().optional()
});

// GET /api/lab-results
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { testType, startDate, endDate } = req.query;

    const labResults = await prisma.labResult.findMany({
      where: {
        userId,
        ...(testType && { testType: testType as string }),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) })
          }
        } : {})
      },
      orderBy: { date: 'desc' }
    });

    // Group by test type
    const groupedResults = labResults.reduce((acc, result) => {
      if (!acc[result.testType]) {
        acc[result.testType] = [];
      }
      acc[result.testType]?.push(result);
      return acc;
    }, {} as Record<string, typeof labResults>);

    res.json({ 
      results: labResults,
      grouped: groupedResults
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/lab-results
router.post('/', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const validatedData = labResultSchema.parse(req.body);

    const labResult = await prisma.labResult.create({
      data: {
        ...validatedData,
        userId,
        date: new Date(validatedData.date)
      }
    });

    // Check if result is abnormal and create notification
    if (validatedData.normalRange) {
      const [min, max] = validatedData.normalRange.split('-').map(Number);
      if (validatedData.value < min! || validatedData.value > max!) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'alert',
            title: 'Abnormal Lab Result',
            message: `Your ${validatedData.testType} result (${validatedData.value} ${validatedData.unit}) is outside the normal range (${validatedData.normalRange})`
          }
        });

        // Emit real-time alert
        req.io.to(`user:${userId}`).emit('lab_result_alert', {
          testType: validatedData.testType,
          value: validatedData.value,
          normalRange: validatedData.normalRange
        });
      }
    }

    res.status(201).json({ labResult });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.issues 
      });
    }
    next(error);
  }
});

// GET /api/lab-results/test-types
router.get('/test-types', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    
    const testTypes = await prisma.labResult.findMany({
      where: { userId },
      select: { testType: true },
      distinct: ['testType']
    });

    res.json({ 
      testTypes: testTypes.map(t => t.testType)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/lab-results/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const labResult = await prisma.labResult.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    res.json({ labResult });
  } catch (error) {
    next(error);
  }
});

// PUT /api/lab-results/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;
    const validatedData = labResultSchema.partial().parse(req.body);

    const result = await prisma.labResult.updateMany({
      where: {
        id,
        userId
      },
      data: validatedData
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    const updatedResult = await prisma.labResult.findUnique({
      where: { id }
    });

    res.json({ labResult: updatedResult });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.issues 
      });
    }
    next(error);
  }
});

// DELETE /api/lab-results/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const deleted = await prisma.labResult.deleteMany({
      where: {
        id,
        userId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    res.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
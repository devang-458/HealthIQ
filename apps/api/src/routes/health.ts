import { Router } from 'express';
import { prisma } from '@health-analytics/database';
import { z } from 'zod';

const router = Router();

// Validation schemas
const healthRecordSchema = z.object({
  date: z.string().datetime(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bloodPressureSystolic: z.number().int().optional(),
  bloodPressureDiastolic: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  sleepHours: z.number().optional()
});

// GET /api/health/records
router.get('/records', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { startDate, endDate, limit = 30 } = req.query;

    const records = await prisma.healthRecord.findMany({
      where: {
        userId,
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) })
          }
        } : {})
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ records });
  } catch (error) {
    next(error);
  }
});

// POST /api/health/records
router.post('/records', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const validatedData = healthRecordSchema.parse(req.body);

    const record = await prisma.healthRecord.create({
      data: {
        ...validatedData,
        userId,
        date: new Date(validatedData.date)
      }
    });

    // Emit real-time update via WebSocket
    req.io.to(`user:${userId}`).emit('health_record_created', record);
    req.io.to(`health:${userId}`).emit('health_update', {
      type: 'record_created',
      data: record
    });

    // Cache latest record in Redis
    await req.redis.set(
      `health:latest:${userId}`,
      JSON.stringify(record),
      'EX',
      3600
    );

    res.status(201).json({ record });
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

// GET /api/health/records/:id
router.get('/records/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const record = await prisma.healthRecord.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ record });
  } catch (error) {
    next(error);
  }
});

// PUT /api/health/records/:id
router.put('/records/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;
    const validatedData = healthRecordSchema.partial().parse(req.body);

    const record = await prisma.healthRecord.updateMany({
      where: {
        id,
        userId
      },
      data: validatedData
    });

    if (record.count === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const updatedRecord = await prisma.healthRecord.findUnique({
      where: { id }
    });

    // Emit update via WebSocket
    req.io.to(`user:${userId}`).emit('health_record_updated', updatedRecord);

    res.json({ record: updatedRecord });
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

// DELETE /api/health/records/:id
router.delete('/records/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const deleted = await prisma.healthRecord.deleteMany({
      where: {
        id,
        userId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Emit deletion via WebSocket
    req.io.to(`user:${userId}`).emit('health_record_deleted', { id });

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
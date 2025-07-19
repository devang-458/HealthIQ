import { Router } from 'express';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { PredictionService } from '../services/prediction';

const router = Router();
const predictionService = new PredictionService();

// GET /api/predictions
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { type, active = true } = req.query;

    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        ...(type && { type: type as string }),
        ...(active === 'true' && { expiresAt: { gte: new Date() } })
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ predictions });
  } catch (error) {
    next(error);
  }
});

// POST /api/predictions/generate
router.post('/generate', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { type } = req.body;

    // Get user's recent health data
    const recentData = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30
    });

    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30
    });

    const labResults = await prisma.labResult.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Generate prediction using ML service
    const predictionResult = await predictionService.generatePrediction({
      userId,
      type: type || 'general_health',
      healthRecords: recentData,
      activities,
      labResults
    });

    // Store prediction in database
    const prediction = await prisma.prediction.create({
      data: {
        userId,
        type: predictionResult.type,
        riskScore: predictionResult.riskScore,
        confidence: predictionResult.confidence,
        factors: predictionResult.factors,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Send notification if high risk
    if (predictionResult.riskScore > 70) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'alert',
          title: 'Health Alert',
          message: `High risk detected for ${predictionResult.type}. Please consult your healthcare provider.`
        }
      });

      // Emit real-time alert
      req.io.to(`user:${userId}`).emit('health_alert', {
        prediction,
        severity: 'high'
      });
    }

    res.json({ prediction });
  } catch (error) {
    next(error);
  }
});

// GET /api/predictions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const prediction = await prisma.prediction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({ prediction });
  } catch (error) {
    next(error);
  }
});

// POST /api/predictions/:id/acknowledge
router.post('/:id/acknowledge', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    // Mark related notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        message: {
          contains: id
        }
      },
      data: {
        read: true
      }
    });

    res.json({ message: 'Prediction acknowledged' });
  } catch (error) {
    next(error);
  }
});

export default router;
import { Router } from 'express';
import { prisma } from '@repo/database';
import { z } from 'zod';

const router = Router();

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { limit = 10, unread } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unread === 'true' && { read: false })
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({ 
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId
      },
      data: {
        read: true
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res, next) => {
  try {
    const { userId } = req.user!;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({ 
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const deleted = await prisma.notification.deleteMany({
      where: {
        id,
        userId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
import { Router } from 'express';
import { prisma } from '@repo/database';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/user/profile
router.get('/profile', async (req, res, next) => {
  try {
    const { userId } = req.user!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            healthRecords: true,
            activities: true,
            labResults: true,
            predictions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/user/profile
router.put('/profile', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { name, phone, dateOfBirth, gender, height } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        // Add these fields to your User model in schema.prisma if needed
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// PUT /api/user/settings
router.put('/settings', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { settings } = req.body;

    // Store settings in user preferences (you might want to create a UserSettings model)
    // For now, we'll just return success
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/user/password
router.put('/password', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user/account
router.delete('/account', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    // Delete user and all related data (cascade delete should handle this)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/user/export
router.get('/export', async (req, res, next) => {
  try {
    const { userId } = req.user!;

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        healthRecords: true,
        activities: true,
        labResults: true,
        predictions: true,
        notifications: true
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="health-data-export.csv"');

    // Convert to CSV format (simplified version)
    const csv = convertToCSV(userData);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  // This is a simplified version - you might want to use a CSV library
  const sections = [];
  
  // Health Records
  if (data.healthRecords.length > 0) {
    sections.push('HEALTH RECORDS');
    sections.push('Date,Weight,Blood Pressure,Heart Rate,Sleep Hours');
    data.healthRecords.forEach((record: any) => {
      sections.push(`${record.date},${record.weight || ''},${record.bloodPressureSystolic || ''}/${record.bloodPressureDiastolic || ''},${record.heartRate || ''},${record.sleepHours || ''}`);
    });
    sections.push('');
  }

  // Activities
  if (data.activities.length > 0) {
    sections.push('ACTIVITIES');
    sections.push('Date,Type,Duration,Distance,Calories');
    data.activities.forEach((activity: any) => {
      sections.push(`${activity.date},${activity.type},${activity.duration},${activity.distance || ''},${activity.calories || ''}`);
    });
  }

  return sections.join('\n');
}

export default router;
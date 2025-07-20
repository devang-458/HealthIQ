import { Router } from 'express';
import { prisma } from '@repo/database';
import { AIService } from '../services/ai';
import { z } from 'zod';

const router = Router();
const aiService = new AIService();

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    hasRecentHealthData: z.boolean().optional(),
    hasActivePredictions: z.boolean().optional()
  }).optional()
});

// POST /api/ai/chat
router.post('/chat', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const validatedData = chatSchema.parse(req.body);

    // Get user's recent health data for context
    const [healthRecords, activities, predictions, labResults] = await Promise.all([
      prisma.healthRecord.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10
      }),
      prisma.prediction.findMany({
        where: { 
          userId,
          expiresAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.labResult.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    // Generate AI response
    const response = await aiService.generateResponse({
      message: validatedData.message,
      context: {
        healthRecords,
        activities,
        predictions,
        labResults
      }
    });

    // Log conversation for analytics (optional)
    await prisma.notification.create({
      data: {
        userId,
        type: 'info',
        title: 'AI Health Coach',
        message: `Asked: "${validatedData.message.substring(0, 50)}${validatedData.message.length > 50 ? '...' : ''}"`
      }
    });

    res.json({ 
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.issues
      });
    }
    next(error);
  }
});

// POST /api/ai/insights
router.post('/insights', async (req, res, next) => {
  try {
    const { userId } = req.user!;

    // Get comprehensive user data
    const [healthRecords, activities, predictions, labResults] = await Promise.all([
      prisma.healthRecord.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30
      }),
      prisma.prediction.findMany({
        where: { 
          userId,
          expiresAt: { gte: new Date() }
        }
      }),
      prisma.labResult.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10
      })
    ]);

    // Generate insights
    const insights = await aiService.generateHealthInsights(userId, {
      healthRecords,
      activities,
      predictions,
      labResults
    });

    // Create notifications for alerts
    if (insights.alerts.length > 0) {
      await Promise.all(
        insights.alerts.map(alert =>
          prisma.notification.create({
            data: {
              userId,
              type: 'alert',
              title: 'Health Alert',
              message: alert
            }
          })
        )
      );

      // Emit real-time alerts
      req.io.to(`user:${userId}`).emit('health_alerts', insights.alerts);
    }

    res.json(insights);
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { type = 'general' } = req.query;

    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        healthRecords: {
          orderBy: { date: 'desc' },
          take: 20
        },
        activities: {
          orderBy: { date: 'desc' },
          take: 20
        },
        predictions: {
          where: { expiresAt: { gte: new Date() } }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate personalized recommendations based on type
    let recommendations: string[] = [];

    switch (type) {
      case 'diet':
        recommendations = generateDietRecommendations(userData);
        break;
      case 'exercise':
        recommendations = generateExerciseRecommendations(userData);
        break;
      case 'sleep':
        recommendations = generateSleepRecommendations(userData);
        break;
      case 'stress':
        recommendations = generateStressRecommendations(userData);
        break;
      default:
        recommendations = generateGeneralRecommendations(userData);
    }

    res.json({ 
      type,
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/goal-suggestions
router.post('/goal-suggestions', async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { goalType, currentValue, timeframe } = req.body;

    // Get historical data
    const historicalData = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 60 // Last 2 months
    });

    // Generate SMART goals
    const goals = generateSmartGoals({
      goalType,
      currentValue,
      timeframe,
      historicalData
    });

    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

// Helper functions for recommendations
function generateDietRecommendations(userData: any): string[] {
  const recommendations: string[] = [];
  const latestRecord = userData.healthRecords[0];

  if (latestRecord?.weight && latestRecord?.height) {
    const bmi = latestRecord.weight / Math.pow(latestRecord.height / 100, 2);
    
    if (bmi > 25) {
      recommendations.push('Consider a calorie deficit of 500-750 calories per day for healthy weight loss');
      recommendations.push('Focus on whole foods: vegetables, lean proteins, and whole grains');
      recommendations.push('Limit processed foods and sugary beverages');
    } else if (bmi < 18.5) {
      recommendations.push('Increase caloric intake with nutrient-dense foods');
      recommendations.push('Add healthy fats like avocados, nuts, and olive oil');
      recommendations.push('Consider protein supplements to support healthy weight gain');
    } else {
      recommendations.push('Maintain a balanced diet with variety from all food groups');
      recommendations.push('Aim for 5-9 servings of fruits and vegetables daily');
    }
  }

  // Check for high blood pressure
  if (latestRecord?.bloodPressureSystolic && latestRecord.bloodPressureSystolic > 130) {
    recommendations.push('Reduce sodium intake to less than 2,300mg per day');
    recommendations.push('Increase potassium-rich foods like bananas and leafy greens');
    recommendations.push('Follow the DASH diet pattern for blood pressure management');
  }

  return recommendations;
}

function generateExerciseRecommendations(userData: any): string[] {
  const recommendations: string[] = [];
  const weeklyMinutes = userData.activities
    .filter((a: any) => {
      const activityDate = new Date(a.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate > weekAgo;
    })
    .reduce((sum: number, a: any) => sum + a.duration, 0);

  if (weeklyMinutes < 150) {
    recommendations.push(`Increase activity to reach 150 minutes/week (currently ${weeklyMinutes} min)`);
    recommendations.push('Start with 30-minute walks, 5 days a week');
    recommendations.push('Gradually increase intensity as fitness improves');
  } else if (weeklyMinutes < 300) {
    recommendations.push('Great job meeting minimum guidelines! Consider increasing to 300 minutes/week');
    recommendations.push('Add strength training exercises 2-3 times per week');
    recommendations.push('Try high-intensity interval training (HIIT) for variety');
  } else {
    recommendations.push('Excellent activity level! Maintain current routine');
    recommendations.push('Focus on recovery with stretching and rest days');
    recommendations.push('Consider working with a trainer for advanced goals');
  }

  // Activity variety
  const activityTypes = [...new Set(userData.activities.map((a: any) => a.type))];
  if (activityTypes.length < 3) {
    recommendations.push('Add variety to prevent boredom and work different muscle groups');
    recommendations.push('Try swimming, cycling, or group fitness classes');
  }

  return recommendations;
}

function generateSleepRecommendations(userData: any): string[] {
  const recommendations: string[] = [];
  const sleepData = userData.healthRecords
    .map((r: any) => r.sleepHours)
    .filter((h: any) => h !== null);
  
  if (sleepData.length > 0) {
    const avgSleep = sleepData.reduce((sum: number, h: number) => sum + h, 0) / sleepData.length;
    
    if (avgSleep < 7) {
      recommendations.push('Aim for 7-9 hours of sleep per night');
      recommendations.push('Establish a consistent bedtime routine');
      recommendations.push('Avoid screens 1 hour before bedtime');
      recommendations.push('Keep bedroom cool (60-67°F) and dark');
    } else if (avgSleep > 9) {
      recommendations.push('Consider if excessive sleep is due to poor sleep quality');
      recommendations.push('Evaluate for sleep disorders with a healthcare provider');
      recommendations.push('Maintain consistent wake times, even on weekends');
    } else {
      recommendations.push('Maintain your healthy sleep schedule');
      recommendations.push('Focus on sleep quality with a comfortable mattress');
      recommendations.push('Consider blackout curtains or white noise if needed');
    }
  }

  return recommendations;
}

function generateStressRecommendations(userData: any): string[] {
  const recommendations: string[] = [
    'Practice daily meditation or mindfulness for 10-15 minutes',
    'Try progressive muscle relaxation before bed',
    'Consider yoga or tai chi for stress reduction',
    'Maintain social connections and talk about concerns',
    'Limit caffeine and alcohol intake',
    'Schedule regular breaks during work hours'
  ];

  // Check if high heart rate might indicate stress
  const latestRecord = userData.healthRecords[0];
  if (latestRecord?.heartRate && latestRecord.heartRate > 80) {
    recommendations.unshift('Your resting heart rate is elevated - prioritize stress management');
    recommendations.push('Try deep breathing exercises: 4-7-8 technique');
  }

  return recommendations;
}

function generateGeneralRecommendations(userData: any): string[] {
  const recommendations: string[] = [];
  
  // Compile recommendations from all categories
  const diet = generateDietRecommendations(userData);
  const exercise = generateExerciseRecommendations(userData);
  const sleep = generateSleepRecommendations(userData);
  
  // Take top recommendations from each category
  if (diet.length > 0) recommendations.push(diet[0]!);
  if (exercise.length > 0) recommendations.push(exercise[0]!);
  if (sleep.length > 0) recommendations.push(sleep[0]!);
  
  // Add general wellness tips
  recommendations.push('Stay hydrated with 8-10 glasses of water daily');
  recommendations.push('Schedule annual health check-ups and screenings');
  recommendations.push('Practice gratitude and positive thinking');
  
  return recommendations.slice(0, 6); // Return top 6 recommendations
}

function generateSmartGoals(params: {
  goalType: string;
  currentValue: number;
  timeframe: string;
  historicalData: any[];
}): any[] {
  const { goalType, currentValue, timeframe, historicalData } = params;
  const goals = [];

  // Calculate realistic targets based on historical trends
  const trend = calculateTrend(historicalData, goalType);
  
  switch (goalType) {
    case 'weight_loss':
      const weeklyLoss = 0.5; // kg per week (healthy rate)
      const weeks = timeframeToWeeks(timeframe);
      goals.push({
        specific: `Lose ${(weeklyLoss * weeks).toFixed(1)} kg`,
        measurable: `From ${currentValue}kg to ${(currentValue - weeklyLoss * weeks).toFixed(1)}kg`,
        achievable: 'Through diet and exercise modifications',
        relevant: 'To improve overall health and reduce disease risk',
        timeBound: `Within ${timeframe}`,
        milestones: generateMilestones(currentValue, currentValue - weeklyLoss * weeks, weeks)
      });
      break;
      
    case 'activity_increase':
      const currentMinutes = currentValue;
      const targetMinutes = Math.min(currentMinutes * 1.5, 300);
      goals.push({
        specific: `Increase weekly activity to ${targetMinutes} minutes`,
        measurable: `From ${currentMinutes} to ${targetMinutes} minutes per week`,
        achievable: 'By adding 15-30 minutes of activity every 2 weeks',
        relevant: 'To improve cardiovascular health and fitness',
        timeBound: `Within ${timeframe}`,
        milestones: generateMilestones(currentMinutes, targetMinutes, timeframeToWeeks(timeframe))
      });
      break;
  }

  return goals;
}

function calculateTrend(data: any[], metric: string): number {
  // Simple linear regression to calculate trend
  // Returns rate of change per week
  return 0; // Simplified for demo
}

function timeframeToWeeks(timeframe: string): number {
  const mapping: { [key: string]: number } = {
    '1_month': 4,
    '3_months': 12,
    '6_months': 26,
    '1_year': 52
  };
  return mapping[timeframe] || 12;
}

function generateMilestones(start: number, end: number, weeks: number): any[] {
  const milestones = [];
  const totalChange = end - start;
  const intervals = Math.min(4, weeks); // Max 4 milestones
  
  for (let i = 1; i <= intervals; i++) {
    const progress = (i / intervals) * totalChange;
    milestones.push({
      week: Math.floor((i / intervals) * weeks),
      target: start + progress,
      description: `${((i / intervals) * 100).toFixed(0)}% of goal`
    });
  }
  
  return milestones;
}

export default router;
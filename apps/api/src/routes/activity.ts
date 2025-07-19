import { Router } from "express";
import { date, string, z } from "zod";
import { prisma } from "@repo/database";

const router = Router();

const activitySchema = z.object({
  date: z.string().datetime(),
  type: z.string(),
  duration: z.number().int().min(1),
  distance: z.number().optional(),
  calories: z.number().int().optional(),
});

// GET /api/activities
router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { startDate, endDate, type, limit = 30 } = req.query;

    const activites = await prisma.activity.findMany({
      where: {
        userId,
        ...(type && { type: type as string }),
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate && { gte: new Date(startDate as string) }),
                ...(endDate && { gte: new Date(endDate as string) }),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      take: parseInt(limit as string),
    });

    // Calculate summary statistic
    const summary = {
      totalActivities: activites.length,
      totalDuration: activites.reduce((sum, a) => sum + a.duration, 0),
      totalDistance: activites.reduce((sum, a) => sum + (a.distance || 0), 0),
      totalCalories: activites.reduce((sum, a) => sum + (a.calories || 0), 0),
    };

    res.json({ activites, summary });
  } catch (error) {
    next(error);
  }
});

// POST /api/activities
router.post("/", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const validatedData = activitySchema.parse(req.body);

    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        userId,
        date: new Date(validatedData.date),
      },
    });

    // Emit real-time update
    req.io.to(`user:${userId}`).emit("activity_created", activity);

    // Update daily summary in Redis
    const dateKey = new Date(validatedData.date).toISOString().split("T")[0];
    await req.redis.hincrby(`activity:daily:${userId}:${dateKey}`, "count", 1);
    await req.redis.hincrby(
      `activity:daily:${userId}:${dateKey}`,
      "duration",
      validatedData.duration
    );
    res.status(201).json({ activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
    }
    next(error);
  }
});

// GET /api/activities/types
router.get("/types", async (req, res, next) => {
  try {
    const { userId } = req.user!;

    const types = await prisma.activity.findMany({
      where: { userId },
      select: { type: true },
      distinct: ["type"],
    });
    res.json({ types: types.map((t) => t.type) });
  } catch (error) {
    next(error);
  }
});

// GET /api/activities/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const activity = await prisma.activity.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!activity) {
      return res.status(404).json({
        error: "Activity not found",
      });
    }
    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;
    const validatedData = activitySchema.partial().parse(req.body);

    const activity = await prisma.activity.updateMany({
      where: {
        id,
        userId,
      },
      data: validatedData,
    });

    if (activity.count === 0) {
      return res.status(404).json({
        error: "Activity not found",
      });
    }

    const updateActivity = await prisma.activity.findUnique({
      where: { id },
    });

    // Emit update
    req.io.to(`user:${userId}`).emit("activity_updated", updateActivity);

    res.json({ activity: updateActivity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
    }
    next(error);
  }
});

// DELETE   /api/activities/:id
router.delete(":id", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const deleted = await prisma.activity.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (deleted.count === 0) {
      res.status(404).json({
        error: "Activity not found",
      });
    }

    // emit deletion
    req.io.to(`user:${userId}`).emit("activity_deleted", { id });

    res.json({ message: "Activity deleted succressdfully" });
  } catch (error) {
    next(error);
  }
});

export default router;

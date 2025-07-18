import { Router } from "express";
import { prisma } from "@repo/database";
import { z } from "zod";

const router = Router();

const healthRecordSchema = z.object({
  date: z.string().datetime(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bloodPressureSystolic: z.number().int().optional(),
  bloodPressureDiastolic: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  sleepHours: z.number().optional(),
});

router.get("/records", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const { startDate, endDate, limit = 30 } = req.query;
    const records = await prisma.healthRecord.findMany({
      where: {
        userId,
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
    res.json({ records });
  } catch (error) {
    next(error);
  }
});

router.post("/records", async (req, res, next) => {
  try {
    const { userId } = req.user!;
    const validatedDate = healthRecordSchema.parse(req.body);

    const record = await prisma.healthRecord.create({
      data: {
        ...validatedDate,
        userId,
        date: new Date(validatedDate.date),
      },
    });

    // Emit real-time update via websocket
    req.io.to(`user:${userId}`).emit("health_record_created", record);
    req.io.to(`health:${userId}`).emit("health_update", {
      type: "record_created",
      date: record,
    });

    // Cache latest record in Redis
    await req.redis.set(
      `health:latest:${userId}`,
      JSON.stringify(record),
      "EX",
      3600
    );
  } catch (err) {}
});

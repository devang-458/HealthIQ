import { HealthRecord, Activity, LabResult, Prediction } from "@repo/database";
import axios from "axios";

interface AIContext {
  healthRecords: HealthRecord[];
  activities: Activity[];
  predictions: Prediction[];
  labResults?: LabResult[];
}

interface AIResponse {
  response: string;
  suggestions?: string[];
  confidence?: number;
}

export class AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.apiUrl = "https://api.openai.com/v1/chat/completions";
  }

  async generateResponse(params: {
    message: string;
    context: AIContext;
  }): Promise<string> {
    try {
      // Prepare context summary
      const contextSummary = this.prepareContextSummary(params.context);

      // For demo purposes, using a mock response
      // In production, replace with actual OpenAI API call
      if (!this.apiKey || this.apiKey === "demo") {
        return this.generateMockResponse(params.message, params.context);
      }

      // Actual OpenAI API call
      const response = await axios.post(
        this.apiUrl,
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a helpful health assistant. You have access to the user's health data and should provide personalized, evidence-based health advice. Always remind users to consult healthcare professionals for medical decisions. Here's the user's health context: ${contextSummary}`,
            },
            {
              role: "user",
              content: params.message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      return this.generateMockResponse(params.message, params.context);
    }
  }

  async generateHealthInsights(
    userId: string,
    data: AIContext
  ): Promise<{
    insights: string[];
    recommendations: string[];
    alerts: string[];
  }> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Analyze health records
    if (data.healthRecords.length > 0) {
      const latestRecord = data.healthRecords[0];
      const avgWeight = this.calculateAverage(
        data.healthRecords.map((r) => r.weight).filter(Boolean) as number[]
      );

      // Weight insights
      if (latestRecord?.weight && avgWeight) {
        const weightChange =
          ((latestRecord?.weight - avgWeight) / avgWeight) * 100;
        if (Math.abs(weightChange) > 5) {
          insights.push(
            `Your weight has ${weightChange > 0 ? "increased" : "decreased"} by ${Math.abs(weightChange).toFixed(1)}% recently.`
          );
        }
      }

      // Blood pressure insights
      if (
        latestRecord?.bloodPressureSystolic &&
        latestRecord?.bloodPressureDiastolic
      ) {
        if (
          latestRecord?.bloodPressureSystolic > 130 ||
          latestRecord?.bloodPressureDiastolic > 80
        ) {
          alerts.push(
            "Your blood pressure is elevated. Consider lifestyle modifications and consult your doctor."
          );
          recommendations.push(
            "Reduce sodium intake, increase physical activity, and practice stress management."
          );
        }
      }

      // Sleep insights
      const avgSleep = this.calculateAverage(
        data.healthRecords.map((r) => r.sleepHours).filter(Boolean) as number[]
      );
      if (avgSleep && avgSleep < 7) {
        insights.push(
          `You're averaging ${avgSleep.toFixed(1)} hours of sleep, which is below the recommended 7-9 hours.`
        );
        recommendations.push(
          "Establish a consistent sleep schedule and create a relaxing bedtime routine."
        );
      }
    }

    // Analyze activities
    if (data.activities.length > 0) {
      const weeklyMinutes = this.calculateWeeklyActivityMinutes(
        data.activities
      );
      if (weeklyMinutes < 150) {
        recommendations.push(
          `Increase your physical activity to reach the recommended 150 minutes per week. You're currently at ${weeklyMinutes} minutes.`
        );
      } else {
        insights.push(
          `Great job! You're meeting the weekly physical activity recommendations with ${weeklyMinutes} minutes.`
        );
      }
    }

    // Analyze predictions
    if (data.predictions.length > 0) {
      const highRiskPredictions = data.predictions.filter(
        (p) => p.riskScore > 70
      );
      highRiskPredictions.forEach((prediction) => {
        alerts.push(
          `High risk detected for ${prediction.type.replace(/_/g, " ")}: ${prediction.riskScore}% risk score.`
        );
      });
    }

    return { insights, recommendations, alerts };
  }

  private prepareContextSummary(context: AIContext): string {
    const summary: string[] = [];

    if (context.healthRecords.length > 0) {
      const latest = context.healthRecords[0];
      summary.push(
        `Latest health metrics: Weight: ${latest?.weight}kg, BP: ${latest?.bloodPressureSystolic}/${latest?.bloodPressureDiastolic}, Heart Rate: ${latest?.heartRate}bpm`
      );
    }

    if (context.activities.length > 0) {
      const weeklyMinutes = this.calculateWeeklyActivityMinutes(
        context.activities
      );
      summary.push(`Weekly activity: ${weeklyMinutes} minutes`);
    }

    if (context.predictions.length > 0) {
      const risks = context.predictions
        .map((p) => `${p.type}: ${p.riskScore}%`)
        .join(", ");
      summary.push(`Current risk assessments: ${risks}`);
    }

    return summary.join(". ");
  }

  private generateMockResponse(message: string, context: AIContext): string {
    const lowerMessage = message.toLowerCase();

    // Health metrics questions
    if (lowerMessage.includes("weight") || lowerMessage.includes("bmi")) {
      if (
        context.healthRecords.length > 0 &&
        context.healthRecords[0]?.weight != null
      ) {
        return `Based on your recent data, your weight is ${context.healthRecords[0].weight}kg. To maintain a healthy weight, focus on balanced nutrition and regular physical activity. Would you like specific recommendations for your situation?`;
      }
      return "I don't have recent weight data for you. Regular weight monitoring can help track your health progress. Would you like to log your current weight?";
    }

    // Blood pressure questions
    if (
      lowerMessage.includes("blood pressure") ||
      lowerMessage.includes("bp")
    ) {
      const record = context.healthRecords?.[0];
      if (
        record?.bloodPressureSystolic != null &&
        record?.bloodPressureDiastolic != null
      ) {
        const systolic = record.bloodPressureSystolic;
        const diastolic = record.bloodPressureDiastolic;

        return `Your latest blood pressure reading is ${systolic}/${diastolic}. ${
          systolic > 130 || diastolic > 80
            ? "This is slightly elevated. Consider reducing sodium intake, managing stress, and increasing physical activity. Please consult your healthcare provider for personalized advice."
            : "This is within the normal range. Keep up the good work with your healthy lifestyle!"
        }`;
      }
      return "I don't have recent blood pressure data. Regular monitoring is important for cardiovascular health. Consider checking your blood pressure and logging it.";
    }

    // Activity questions
    if (
      lowerMessage.includes("exercise") ||
      lowerMessage.includes("activity") ||
      lowerMessage.includes("workout")
    ) {
      const weeklyMinutes =
        context.activities.length > 0
          ? this.calculateWeeklyActivityMinutes(context.activities)
          : 0;

      if (weeklyMinutes >= 150) {
        return `Excellent! You're achieving ${weeklyMinutes} minutes of activity this week, meeting the recommended 150 minutes. Keep up the great work! Consider varying your activities to work different muscle groups.`;
      } else {
        return `You've logged ${weeklyMinutes} minutes of activity this week. The recommendation is 150 minutes of moderate activity. Try adding a 30-minute walk daily or find activities you enjoy to reach this goal.`;
      }
    }

    // Sleep questions
    if (lowerMessage.includes("sleep")) {
      if (context.healthRecords.length > 0) {
        const avgSleep = this.calculateAverage(
          context.healthRecords
            .map((r) => r.sleepHours)
            .filter(Boolean) as number[]
        );
        if (avgSleep) {
          return `You're averaging ${avgSleep.toFixed(1)} hours of sleep. ${
            avgSleep < 7
              ? "This is below the recommended 7-9 hours. Try establishing a consistent bedtime routine, avoiding screens before bed, and creating a comfortable sleep environment."
              : "Great job maintaining healthy sleep habits! Consistent, quality sleep is crucial for overall health."
          }`;
        }
      }
      return "I don't have sleep data to analyze. Tracking your sleep can help identify patterns and improve your rest quality. Aim for 7-9 hours per night.";
    }

    // Risk assessment questions
    if (lowerMessage.includes("risk") || lowerMessage.includes("prediction")) {
      if (context.predictions.length > 0) {
        const highRisk = context.predictions.filter((p) => p.riskScore > 70);
        if (highRisk.length > 0) {
          return `Based on your health data, there are some areas that need attention: ${highRisk
            .map((p) => `${p.type.replace(/_/g, " ")} (${p.riskScore}% risk)`)
            .join(
              ", "
            )}. I recommend discussing these findings with your healthcare provider for a comprehensive evaluation.`;
        }
        return "Your current risk assessments show no immediate concerns. Continue maintaining your healthy habits and regular check-ups.";
      }
      return "I haven't generated any risk predictions yet. Regular health monitoring and data logging will help me provide more accurate assessments.";
    }

    // General health advice
    if (
      lowerMessage.includes("healthy") ||
      lowerMessage.includes("improve") ||
      lowerMessage.includes("tips")
    ) {
      return "Here are key areas to focus on for better health: 1) Aim for 150 minutes of moderate exercise weekly, 2) Maintain a balanced diet with plenty of fruits and vegetables, 3) Get 7-9 hours of quality sleep, 4) Manage stress through meditation or relaxation techniques, 5) Stay hydrated with 8 glasses of water daily. What specific area would you like to improve?";
    }

    // Default response
    return "I'm here to help you understand your health data and provide personalized recommendations. You can ask me about your weight trends, blood pressure, activity levels, sleep patterns, or health risks. What would you like to know?";
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculateWeeklyActivityMinutes(activities: Activity[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return activities
      .filter((a) => new Date(a.date) > oneWeekAgo)
      .reduce((sum, a) => sum + a.duration, 0);
  }
}

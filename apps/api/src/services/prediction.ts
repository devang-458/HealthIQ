import { HealthRecord, Activity, LabResult } from '@repo/database';

interface PredictionInput {
  userId: string;
  type: string;
  healthRecords: HealthRecord[];
  activities: Activity[];
  labResults: LabResult[];
}

interface PredictionResult {
  type: string;
  riskScore: number;
  confidence: number;
  factors: any;
}

export class PredictionService {
  async generatePrediction(input: PredictionInput): Promise<PredictionResult> {
    const { type, healthRecords, activities, labResults } = input;

    // Simple risk calculation (replace with actual ML model)
    let riskScore = 0;
    let confidence = 0.8;
    const factors: any = {};

    switch (type) {
      case 'diabetes_risk':
        riskScore = this.calculateDiabetesRisk(healthRecords, labResults);
        factors.bmi = this.calculateBMI(healthRecords);
        factors.glucoseTrend = this.analyzeGlucoseTrend(labResults);
        break;

      case 'heart_disease_risk':
        riskScore = this.calculateHeartDiseaseRisk(healthRecords, activities);
        factors.bloodPressure = this.analyzeBloodPressure(healthRecords);
        factors.activityLevel = this.analyzeActivityLevel(activities);
        break;

      default:
        riskScore = this.calculateGeneralHealthRisk(healthRecords, activities);
        factors.overall = 'General health assessment';
    }

    return {
      type,
      riskScore: Math.min(100, Math.max(0, riskScore)),
      confidence,
      factors
    };
  }

  private calculateDiabetesRisk(records: HealthRecord[], labs: LabResult[]): number {
    let risk = 0;

    // Check BMI
    const latestRecord = records[0];
    if (latestRecord && latestRecord.weight && latestRecord.height) {
      const bmi = this.calculateBMI(records);
      if (bmi > 30) risk += 30;
      else if (bmi > 25) risk += 15;
    }

    // Check glucose levels
    const glucoseTests = labs.filter(l => l.testType === 'blood_sugar');
    if (glucoseTests.length > 0) {
      const avgGlucose = glucoseTests.reduce((sum, t) => sum + t.value, 0) / glucoseTests.length;
      if (avgGlucose > 126) risk += 40;
      else if (avgGlucose > 100) risk += 20;
    }

    return risk;
  }

  private calculateHeartDiseaseRisk(records: HealthRecord[], activities: Activity[]): number {
    let risk = 0;

    // Check blood pressure
    const recentBP = records.filter(r => r.bloodPressureSystolic && r.bloodPressureDiastolic);
    if (recentBP.length > 0) {
      const avgSystolic = recentBP.reduce((sum, r) => sum + (r.bloodPressureSystolic || 0), 0) / recentBP.length;
      const avgDiastolic = recentBP.reduce((sum, r) => sum + (r.bloodPressureDiastolic || 0), 0) / recentBP.length;
      
      if (avgSystolic > 140 || avgDiastolic > 90) risk += 35;
      else if (avgSystolic > 130 || avgDiastolic > 80) risk += 20;
    }

    // Check activity level
    const weeklyActivities = activities.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return a.date > weekAgo;
    });

    const totalMinutes = weeklyActivities.reduce((sum, a) => sum + a.duration, 0);
    if (totalMinutes < 150) risk += 25;

    return risk;
  }

  private calculateGeneralHealthRisk(records: HealthRecord[], activities: Activity[]): number {
    let risk = 0;
    
    // Basic health metrics
    if (records.length === 0) return 50; 

    const latestRecord = records[0] ;
    if(!latestRecord) return 50;
    
    // Check if data is recent
    const daysSinceLastRecord = (Date.now() - latestRecord.date.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastRecord > 30) risk += 10;

    // Check activity frequency
    const monthlyActivities = activities.filter(a => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return a.date > monthAgo;
    });

    if (monthlyActivities.length < 10) risk += 15;

    return risk;
  }

  private calculateBMI(records: HealthRecord[]): number {
    const record = records.find(r => r.weight && r.height);
    if (!record || !record.weight || !record.height) return 0;
    
    const heightInMeters = record.height / 100;
    return record.weight / (heightInMeters * heightInMeters);
  }

  private analyzeGlucoseTrend(labs: LabResult[]): string {
    const glucoseTests = labs
      .filter(l => l.testType === 'blood_sugar')
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (glucoseTests.length < 2) return 'insufficient_data';

    const first = glucoseTests[0];
    const last = glucoseTests[glucoseTests.length - 1 ]
    const firstValue = first?.value!;
    const lastValue = last?.value!;
    const change = ((lastValue - firstValue) / firstValue) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private analyzeBloodPressure(records: HealthRecord[]): string {
    const bpRecords = records.filter(r => r.bloodPressureSystolic && r.bloodPressureDiastolic);
    if (bpRecords.length === 0) return 'no_data';

    const latest = bpRecords[0]!;
    const systolic = latest.bloodPressureSystolic!;
    const diastolic = latest.bloodPressureDiastolic!;

    if (systolic >= 180 || diastolic >= 120) return 'hypertensive_crisis';
    if (systolic >= 140 || diastolic >= 90) return 'stage_2_hypertension';
    if (systolic >= 130 || diastolic >= 80) return 'stage_1_hypertension';
    if (systolic >= 120) return 'elevated';
    return 'normal';
  }

  private analyzeActivityLevel(activities: Activity[]): string {
    const weeklyMinutes = activities
      .filter(a => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return a.date > weekAgo;
      })
      .reduce((sum, a) => sum + a.duration, 0);

    if (weeklyMinutes >= 300) return 'very_active';
    if (weeklyMinutes >= 150) return 'active';
    if (weeklyMinutes >= 75) return 'moderately_active';
    return 'sedentary';
  }
}
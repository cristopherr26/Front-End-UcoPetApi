export interface HealthPlanCoverage {
  id?: string;
  healthPlanId?: string;
  serviceId: string;
  procedureId: string;
  coveragePercentage: number;
  coverageLimit: number;
}
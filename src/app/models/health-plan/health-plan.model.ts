export interface HealthPlan {
  id?: string;
  name: string;
  insuranceCompany: string;
  description: string;
  status?: string;
  deleted?: boolean;
  coverages?: any[];
}
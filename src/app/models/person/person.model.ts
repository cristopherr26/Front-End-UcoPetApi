export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  active?: boolean;
}
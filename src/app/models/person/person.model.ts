export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  active?: boolean;
}

export type DocumentType = 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'PPT';

export interface DocumentTypeOption {
  value: DocumentType;
  label: string;
}

export interface Person {
  id?: string | null;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  address: string | null;
  phone: string | null;
  admin: boolean;
  active: boolean;
  deactivatedAt?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SetPasswordRequest {
  password: string;
}

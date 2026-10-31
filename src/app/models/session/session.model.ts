export type Role = 'ADMIN' | 'DOCTOR';

export interface LoginResponse {
  token: string;
  personId: string;
  fullName: string;
  roles: Role[];
}

export interface SessionProfile {
  personId: string;
  fullName: string;
  roles: Role[];
}

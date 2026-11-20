// Estados de verificación del certificado de una asignación
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// Asignación médico-especialidad (igual al DTO de /api/v1/specialtiedoctor)
export interface SpecialtieDoctor {
  id: string;
  // Id del médico (no de la persona)
  doctor: string;
  // Id de la especialidad del catálogo
  specialtie: string;
  // Sede de la asignación: debe ser la misma del médico (el backend lo valida)
  headquarterId: string;
  certificateUrl: string | null;
  certificateNotes: string | null;
  status: VerificationStatus;
  // Id de la persona ADMIN que verificó o rechazó
  verifiedBy: string | null;
  // LocalDateTime sin zona, ej. "2026-11-10T09:30:00"
  verifiedAt: string | null;
  rejectionReason: string | null;
  active: boolean;
}

// POST /specialtiedoctor y PUT /specialtiedoctor?id=
export interface SpecialtieDoctorRequest {
  doctor: string;
  specialtie: string;
  headquarterId: string;
  certificateUrl: string;
  certificateNotes?: string | null;
}

// Filtros de GET /specialtiedoctor/filter (la sede va aparte)
export interface SpecialtieDoctorFilters {
  idDoctor?: string | null;
  idSpecialtie?: string | null;
  status?: VerificationStatus | null;
}

// PATCH /specialtiedoctor/{id}/reject
export interface RejectSpecialtieDoctorRequest {
  reason: string;
}

// Etiqueta, clase uc-tag e icono de cada estado
export const VERIFICATION_STATUSES: {
  value: VerificationStatus;
  label: string;
  tag: string;
  icon: string;
}[] = [
  { value: 'PENDING', label: 'Pendiente', tag: 'is-warn', icon: 'bi-hourglass-split' },
  { value: 'VERIFIED', label: 'Verificada', tag: 'is-ok', icon: 'bi-patch-check-fill' },
  { value: 'REJECTED', label: 'Rechazada', tag: 'is-danger', icon: 'bi-x-octagon-fill' },
];

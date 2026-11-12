// La API recibe y devuelve `doctor` y `specialtie` (los ids), no `idDoctor` / `idSpecialtie`.
export interface SpecialtieDoctor {
  id?: string | null;
  doctor: string;
  specialtie: string;
  /** Sede de la relación: debe ser la misma del médico (el backend lo valida). */
  headquarterId: string;
}

export interface SpecialtieDoctorFilters {
  idDoctor?: string | null;
  idSpecialtie?: string | null;
}
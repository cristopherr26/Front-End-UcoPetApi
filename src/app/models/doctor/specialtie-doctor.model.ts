export interface SpecialtieDoctor {
  id?: string | null;
  doctor: string;
  specialtie: string;
}

export interface SpecialtieDoctorFilters {
  idDoctor?: string | null;
  idSpecialtie?: string | null;
}
export interface Doctor {
  id?: string | null;
  idPerson: string;
  licenseNumber: string;
  headquarterId: string;
}

export interface DoctorFilters {
  licenseNumber?: string | null;
}
// Lo que devuelve GET /api/v1/specialties (SpecialtieDTO). `certificate` es el id del certificado.
export interface Specialtie {
  id: string;
  name?: string | null;
  description?: string | null;
  active?: boolean;
  certificate?: string | null;
}
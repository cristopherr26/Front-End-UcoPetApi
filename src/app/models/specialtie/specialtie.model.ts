// Especialidad del catálogo, tal como la devuelve GET /api/v1/specialties.
// El backend también envía `certificate`, pero el front no lo usa.
export interface Specialtie {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

// POST /specialties: `active` es opcional y el backend lo pone en true por defecto
export interface CreateSpecialtieRequest {
  name: string;
  description: string;
  active?: boolean;
}

// PATCH /specialties/{id}: cuerpo parcial, solo se envía lo que cambia
export interface UpdateSpecialtieRequest {
  name?: string;
  description?: string;
  active?: boolean;
}

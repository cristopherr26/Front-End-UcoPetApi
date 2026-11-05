export interface AppointmentType {
  id?: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// Cuerpo del PATCH /appointment-type/{id}/status
export interface AppointmentTypeStatusRequest {
  isActive: boolean;
}

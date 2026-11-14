export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// Lo que responde la API (AppointmentDTO). Los nombres pueden venir en null si el registro
// relacionado ya no existe. La fecha llega como AAAA-MM-DD y la hora como HH:mm:ss.
export interface Appointment {
  id: string;
  tutorId: string;
  tutorName: string | null;
  petId: string;
  petName: string | null;
  doctorId: string;
  doctorName: string | null;
  appointmentTypeId: string;
  appointmentTypeName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
}

// Lo que se envía al crear (POST) o reemplazar (PUT) una cita. La API ignora los nombres.
export interface AppointmentRequest {
  tutorId: string;
  petId: string;
  doctorId: string;
  appointmentTypeId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
}

// Cuerpo del PATCH /{id}/status
export interface AppointmentStatusRequest {
  status: AppointmentStatus;
  cancellationReason: string | null;
}

export interface AppointmentFilters {
  tutorId?: string | null;
}

// Respuesta 202 de la API: validó la solicitud y publicó el mensaje en RabbitMQ.
// La cita todavía no está guardada: el procesador de salud la guarda un momento después.
export interface AcceptedResponse {
  message: string;
  idMessage: string;
  id: string;
}

// El médico de quien tiene la sesión abierta y su sede (GET /appointments/me/doctor).
export interface AppointmentDoctor {
  doctorId: string;
  headquarterId: string | null;
}

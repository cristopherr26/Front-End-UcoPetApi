import { Appointment } from '../../models/appointment/appointment.model';
import { nowTimeIso, todayIso } from './appointment-schedule';

// ¿La fecha y hora de la cita ya quedaron atrás? La de este mismo minuto todavía no (igual que la API).
export function isPastSchedule(appointment: Appointment, now: Date = new Date()): boolean {
  const today = todayIso(now);
  const time = appointment.appointmentTime.slice(0, 5);
  return (
    appointment.appointmentDate < today ||
    (appointment.appointmentDate === today && time < nowTimeIso(now))
  );
}

// ¿Ya llegó la hora de la cita? Sirve para saber si se puede completar.
export function hasStarted(appointment: Appointment, now: Date = new Date()): boolean {
  const today = todayIso(now);
  const time = appointment.appointmentTime.slice(0, 5);
  return (
    appointment.appointmentDate < today ||
    (appointment.appointmentDate === today && time <= nowTimeIso(now))
  );
}

// Pendiente cuya hora ya pasó sin confirmarse: ya no se puede confirmar, solo cancelar.
export function isExpired(appointment: Appointment, now: Date = new Date()): boolean {
  return appointment.status === 'PENDING' && isPastSchedule(appointment, now);
}

export interface AppointmentActions {
  confirm: boolean;
  complete: boolean;
  cancel: boolean;
  reactivate: boolean;
  edit: boolean;
}

// Qué se puede hacer con una cita según su estado y su fecha y hora. Las reglas de verdad las pone la
// API (no se confirma una cita vencida, no se completa antes de su hora, no se cancela una completada);
// aquí solo se ocultan los botones que terminarían en un error.
export function allowedActions(
  appointment: Appointment,
  now: Date = new Date(),
): AppointmentActions {
  const active = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
  const past = isPastSchedule(appointment, now);
  return {
    confirm: appointment.status === 'PENDING' && !past,
    complete: appointment.status === 'CONFIRMED' && hasStarted(appointment, now),
    cancel: active,
    reactivate: appointment.status === 'CANCELLED' && !past,
    // Se puede reprogramar mientras la fecha no haya pasado (hoy incluido)
    edit: active && appointment.appointmentDate >= todayIso(now),
  };
}

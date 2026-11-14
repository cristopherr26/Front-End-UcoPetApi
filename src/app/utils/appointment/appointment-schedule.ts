import { Appointment, AppointmentRequest } from '../../models/appointment/appointment.model';
import { timeLabel } from './appointment-labels';

// ¿La cita guardada ya refleja lo que se pidió? Sirve para saber cuándo el procesador aplicó un
// POST o un PUT (la API solo responde 202; la cita se guarda después).
export function matchesRequest(appointment: Appointment, request: AppointmentRequest): boolean {
  return (
    appointment.tutorId === request.tutorId &&
    appointment.petId === request.petId &&
    appointment.doctorId === request.doctorId &&
    appointment.appointmentTypeId === request.appointmentTypeId &&
    appointment.appointmentDate === request.appointmentDate &&
    timeLabel(appointment.appointmentTime) === timeLabel(request.appointmentTime) &&
    appointment.status === request.status
  );
}

// Fecha de hoy en la zona horaria del navegador, como AAAA-MM-DD.
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Hora actual del navegador, como HH:mm.
export function nowTimeIso(now: Date = new Date()): string {
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ¿Es hoy y la hora elegida ya pasó? La fecha anterior a hoy la cubre notPastDate. Mismo criterio que
// la API, que compara al minuto: la hora de este mismo minuto todavía se acepta.
export function isPastTime(
  date: string | null,
  time: string | null,
  now: Date = new Date(),
): boolean {
  return !!date && !!time && date === todayIso(now) && time.slice(0, 5) < nowTimeIso(now);
}

// Horas (HH:mm) en las que el médico ya tiene una cita ese día. Las canceladas liberan el horario,
// igual que en la API. `excludeId` es la cita que se está editando: no choca consigo misma.
export function busyTimes(
  appointments: Appointment[],
  doctorId: string | null,
  date: string | null,
  excludeId: string | null = null,
): string[] {
  if (!doctorId || !date) {
    return [];
  }
  const taken = appointments
    .filter(
      (appointment) =>
        appointment.doctorId === doctorId &&
        appointment.appointmentDate === date &&
        appointment.status !== 'CANCELLED' &&
        appointment.id !== excludeId,
    )
    .map((appointment) => timeLabel(appointment.appointmentTime));
  return [...new Set(taken)].sort();
}

export function hasClash(
  appointments: Appointment[],
  doctorId: string | null,
  date: string | null,
  time: string | null,
  excludeId: string | null = null,
): boolean {
  return !!time && busyTimes(appointments, doctorId, date, excludeId).includes(time.slice(0, 5));
}

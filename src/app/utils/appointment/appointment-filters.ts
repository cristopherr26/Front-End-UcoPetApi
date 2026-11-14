import { Appointment, AppointmentStatus } from '../../models/appointment/appointment.model';
import { isExpired } from './appointment-actions';

export type AppointmentPeriod = 'upcoming' | 'today' | 'past' | 'all';

export interface AppointmentView {
  period: AppointmentPeriod;
  status: AppointmentStatus | '';
  doctorId: string;
  search: string;
}

export interface AppointmentKpis {
  today: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

// Minúsculas y sin tildes, para que "perez" encuentre "Pérez".
export function normalize(text: string | null | undefined): string {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// La API entrega la lista completa; los filtros se aplican en el navegador (como el resto de listas).
export function filterAppointments(
  appointments: Appointment[],
  view: AppointmentView,
  today: string,
): Appointment[] {
  const term = normalize(view.search.trim());
  return appointments.filter((appointment) => {
    const date = appointment.appointmentDate;
    if (view.period === 'today' && date !== today) {
      return false;
    }
    if (view.period === 'upcoming' && date < today) {
      return false;
    }
    if (view.period === 'past' && date >= today) {
      return false;
    }
    if (view.status !== '' && appointment.status !== view.status) {
      return false;
    }
    if (view.doctorId !== '' && appointment.doctorId !== view.doctorId) {
      return false;
    }
    if (term === '') {
      return true;
    }
    const haystack = normalize(
      [
        appointment.petName,
        appointment.tutorName,
        appointment.doctorName,
        appointment.appointmentTypeName,
      ].join(' '),
    );
    return haystack.includes(term);
  });
}

export function appointmentKpis(
  appointments: Appointment[],
  today: string,
  now: Date = new Date(),
): AppointmentKpis {
  const count = (predicate: (appointment: Appointment) => boolean) =>
    appointments.filter(predicate).length;
  return {
    today: count(
      (appointment) => appointment.appointmentDate === today && appointment.status !== 'CANCELLED',
    ),
    // Las pendientes vencidas ya no esperan confirmación: no se cuentan
    pending: count(
      (appointment) => appointment.status === 'PENDING' && !isExpired(appointment, now),
    ),
    confirmed: count((appointment) => appointment.status === 'CONFIRMED'),
    cancelled: count((appointment) => appointment.status === 'CANCELLED'),
  };
}

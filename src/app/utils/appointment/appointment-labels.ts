import { AppointmentStatus } from '../../models/appointment/appointment.model';

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const TONES: Record<AppointmentStatus, string> = {
  PENDING: 'is-warn',
  CONFIRMED: 'is-info',
  COMPLETED: 'is-ok',
  CANCELLED: 'is-danger',
};

const ICONS: Record<AppointmentStatus, string> = {
  PENDING: 'bi-hourglass-split',
  CONFIRMED: 'bi-check2-circle',
  COMPLETED: 'bi-check2-all',
  CANCELLED: 'bi-x-circle',
};

export function statusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUSES.find((option) => option.value === status)?.label ?? status;
}

// Clase de color del chip de estado (uc-tag is-warn, is-info, is-ok o is-danger)
export function statusTone(status: AppointmentStatus): string {
  return TONES[status] ?? 'is-neutral';
}

export function statusIcon(status: AppointmentStatus): string {
  return ICONS[status] ?? 'bi-question-circle';
}

// La API manda la hora como HH:mm:ss; en pantalla solo se muestra HH:mm.
export function timeLabel(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : '—';
}

// '2026-11-07' -> 'sáb, 7 nov 2026'. Se arma con año, mes y día para que la zona horaria
// del navegador no corra la fecha un día (new Date('2026-11-07') interpreta UTC).
export function dateLabel(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

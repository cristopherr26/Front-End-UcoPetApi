import { Appointment } from '../../models/appointment/appointment.model';
import {
  allowedActions,
  dateLabel,
  statusIcon,
  statusLabel,
  statusTone,
  timeLabel,
} from './appointment-labels';

const base: Appointment = {
  id: 'a1',
  tutorId: 't1',
  tutorName: 'Ana Gómez',
  petId: 'p1',
  petName: 'Luna',
  doctorId: 'd1',
  doctorName: 'Carlos Ruiz',
  appointmentTypeId: 'ty1',
  appointmentTypeName: 'Consulta general',
  appointmentDate: '2026-11-10',
  appointmentTime: '10:30:00',
  status: 'PENDING',
  cancellationReason: null,
};

describe('appointment labels', () => {
  it('names each status in Spanish with its own tone and icon', () => {
    expect(statusLabel('PENDING')).toBe('Pendiente');
    expect(statusLabel('CONFIRMED')).toBe('Confirmada');
    expect(statusLabel('COMPLETED')).toBe('Completada');
    expect(statusLabel('CANCELLED')).toBe('Cancelada');
    expect(statusTone('CANCELLED')).toBe('is-danger');
    expect(statusTone('CONFIRMED')).toBe('is-info');
    expect(statusIcon('COMPLETED')).toBe('bi-check2-all');
  });

  it('shows the time as HH:mm, whether the API sends seconds or not', () => {
    expect(timeLabel('10:30:00')).toBe('10:30');
    expect(timeLabel('08:05')).toBe('08:05');
    expect(timeLabel(null)).toBe('—');
  });

  it('formats a date without shifting the day because of the time zone', () => {
    const label = dateLabel('2026-11-07');
    expect(label).toContain('7');
    expect(label).toContain('2026');
    expect(dateLabel(null)).toBe('—');
  });

  it('only lets pending appointments be confirmed and confirmed ones be completed', () => {
    const today = '2026-11-04';
    expect(allowedActions(base, today)).toEqual({
      confirm: true,
      complete: false,
      cancel: true,
      reactivate: false,
      edit: true,
    });
    const confirmed = allowedActions({ ...base, status: 'CONFIRMED' }, today);
    expect(confirmed.confirm).toBe(false);
    expect(confirmed.complete).toBe(true);
  });

  it('does not allow cancelling or editing a completed appointment, like the API', () => {
    const actions = allowedActions({ ...base, status: 'COMPLETED' }, '2026-11-04');
    expect(actions).toEqual({
      confirm: false,
      complete: false,
      cancel: false,
      reactivate: false,
      edit: false,
    });
  });

  it('hides edit and reactivate once the date has passed', () => {
    const past = '2026-11-20';
    expect(allowedActions(base, past).edit).toBe(false);
    expect(allowedActions({ ...base, status: 'CANCELLED' }, past).reactivate).toBe(false);
    expect(allowedActions({ ...base, status: 'CANCELLED' }, '2026-11-04').reactivate).toBe(true);
  });
});

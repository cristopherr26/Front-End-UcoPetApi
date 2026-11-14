import { Appointment } from '../../models/appointment/appointment.model';
import { allowedActions, hasStarted, isExpired, isPastSchedule } from './appointment-actions';

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

// 4 de noviembre de 2026, 09:00 (el mes de Date empieza en 0)
const now = new Date(2026, 10, 4, 9, 0);
const at = (date: string, time: string): Date => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
};

describe('appointment actions', () => {
  it('only lets pending appointments be confirmed and confirmed ones be completed', () => {
    expect(allowedActions(base, now)).toEqual({
      confirm: true,
      complete: false,
      cancel: true,
      reactivate: false,
      edit: true,
    });
    const confirmed = allowedActions(
      { ...base, status: 'CONFIRMED', appointmentDate: '2026-11-03' },
      now,
    );
    expect(confirmed.confirm).toBe(false);
    expect(confirmed.complete).toBe(true);
  });

  it('does not allow cancelling or editing a completed appointment, like the API', () => {
    expect(allowedActions({ ...base, status: 'COMPLETED' }, now)).toEqual({
      confirm: false,
      complete: false,
      cancel: false,
      reactivate: false,
      edit: false,
    });
  });

  it('an expired pending appointment can only be cancelled', () => {
    const expired = { ...base, appointmentDate: '2026-11-03' };
    expect(isExpired(expired, now)).toBe(true);
    const actions = allowedActions(expired, now);
    expect(actions.confirm).toBe(false);
    expect(actions.edit).toBe(false);
    expect(actions.cancel).toBe(true);
  });

  it('today at an earlier hour is expired; the same minute is not', () => {
    const early = { ...base, appointmentDate: '2026-11-04', appointmentTime: '08:30:00' };
    expect(isPastSchedule(early, now)).toBe(true);
    expect(allowedActions(early, now).confirm).toBe(false);
    // Hoy a una hora pasada todavía se puede reprogramar a otra fecha
    expect(allowedActions(early, now).edit).toBe(true);
    const sameMinute = { ...base, appointmentDate: '2026-11-04', appointmentTime: '09:00:00' };
    expect(isPastSchedule(sameMinute, now)).toBe(false);
    expect(allowedActions(sameMinute, now).confirm).toBe(true);
  });

  it('a confirmed appointment can only be completed once its hour has arrived', () => {
    const confirmed: Appointment = {
      ...base,
      status: 'CONFIRMED',
      appointmentDate: '2026-11-04',
      appointmentTime: '10:00:00',
    };
    expect(hasStarted(confirmed, now)).toBe(false);
    expect(allowedActions(confirmed, now).complete).toBe(false);
    expect(allowedActions(confirmed, at('2026-11-04', '10:00')).complete).toBe(true);
    expect(allowedActions(confirmed, at('2026-11-04', '10:40')).complete).toBe(true);
  });

  it('a pending appointment in the future is not expired', () => {
    expect(isExpired(base, now)).toBe(false);
    expect(isExpired({ ...base, status: 'CONFIRMED', appointmentDate: '2026-11-01' }, now)).toBe(
      false,
    );
  });

  it('hides reactivate once the schedule has passed', () => {
    const cancelled: Appointment = { ...base, status: 'CANCELLED' };
    expect(allowedActions(cancelled, now).reactivate).toBe(true);
    expect(allowedActions(cancelled, at('2026-11-20', '09:00')).reactivate).toBe(false);
  });
});

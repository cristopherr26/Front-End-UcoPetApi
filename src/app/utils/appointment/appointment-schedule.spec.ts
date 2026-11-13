import { Appointment, AppointmentRequest } from '../../models/appointment/appointment.model';
import {
  busyTimes,
  hasClash,
  isPastTime,
  matchesRequest,
  nowTimeIso,
  todayIso,
} from './appointment-schedule';

const make = (overrides: Partial<Appointment>): Appointment => ({
  id: 'a1',
  tutorId: 't1',
  tutorName: 'Ana',
  petId: 'p1',
  petName: 'Luna',
  doctorId: 'd1',
  doctorName: 'Carlos',
  appointmentTypeId: 'ty1',
  appointmentTypeName: 'Consulta',
  appointmentDate: '2026-11-10',
  appointmentTime: '10:30:00',
  status: 'PENDING',
  cancellationReason: null,
  ...overrides,
});

describe('appointment schedule', () => {
  it('builds today as YYYY-MM-DD in local time', () => {
    expect(todayIso(new Date(2026, 10, 4))).toBe('2026-11-04');
    expect(todayIso(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('lists the hours a doctor is busy that day, ignoring cancelled appointments', () => {
    const list = [
      make({ id: 'a1', appointmentTime: '10:30:00' }),
      make({ id: 'a2', appointmentTime: '09:00:00', status: 'CONFIRMED' }),
      make({ id: 'a3', appointmentTime: '11:00:00', status: 'CANCELLED' }),
      make({ id: 'a4', appointmentTime: '12:00:00', doctorId: 'd2' }),
      make({ id: 'a5', appointmentTime: '13:00:00', appointmentDate: '2026-11-11' }),
    ];
    expect(busyTimes(list, 'd1', '2026-11-10')).toEqual(['09:00', '10:30']);
    expect(busyTimes(list, null, '2026-11-10')).toEqual([]);
    expect(busyTimes(list, 'd1', null)).toEqual([]);
  });

  it('does not count the appointment being edited as a clash with itself', () => {
    const list = [make({ id: 'a1', appointmentTime: '10:30:00' })];
    expect(hasClash(list, 'd1', '2026-11-10', '10:30')).toBe(true);
    expect(hasClash(list, 'd1', '2026-11-10', '10:30', 'a1')).toBe(false);
    expect(hasClash(list, 'd1', '2026-11-10', '10:45')).toBe(false);
    expect(hasClash(list, 'd1', '2026-11-10', '')).toBe(false);
  });

  it('recognizes when the saved appointment reflects the request', () => {
    const request: AppointmentRequest = {
      tutorId: 't1',
      petId: 'p1',
      doctorId: 'd1',
      appointmentTypeId: 'ty1',
      appointmentDate: '2026-11-10',
      appointmentTime: '10:30',
      status: 'PENDING',
      cancellationReason: null,
    };
    expect(matchesRequest(make({}), request)).toBe(true);
    expect(matchesRequest(make({ appointmentTime: '11:00:00' }), request)).toBe(false);
    expect(matchesRequest(make({ doctorId: 'd9' }), request)).toBe(false);
  });
});

describe('isPastTime', () => {
  // 4 de noviembre de 2026, 20:45 (hora local del navegador)
  const now = new Date(2026, 10, 4, 20, 45, 30);

  it('formats the current time as HH:mm', () => {
    expect(nowTimeIso(now)).toBe('20:45');
    expect(nowTimeIso(new Date(2026, 10, 4, 7, 5))).toBe('07:05');
  });

  it('is true only when it is today and the time already passed', () => {
    expect(isPastTime('2026-11-04', '19:25', now)).toBe(true);
    expect(isPastTime('2026-11-04', '20:44', now)).toBe(true);
  });

  it('accepts this same minute and later times today', () => {
    expect(isPastTime('2026-11-04', '20:45', now)).toBe(false);
    expect(isPastTime('2026-11-04', '21:00', now)).toBe(false);
  });

  it('ignores other days and incomplete values', () => {
    expect(isPastTime('2026-11-05', '08:00', now)).toBe(false);
    expect(isPastTime('2026-11-04', '', now)).toBe(false);
    expect(isPastTime(null, '19:25', now)).toBe(false);
  });

  it('understands times that come with seconds', () => {
    expect(isPastTime('2026-11-04', '19:25:00', now)).toBe(true);
  });
});

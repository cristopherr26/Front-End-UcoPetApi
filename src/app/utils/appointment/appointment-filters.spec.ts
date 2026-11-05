import { Appointment } from '../../models/appointment/appointment.model';
import {
  AppointmentView,
  appointmentKpis,
  filterAppointments,
  normalize,
} from './appointment-filters';

const make = (overrides: Partial<Appointment>): Appointment => ({
  id: 'a1',
  tutorId: 't1',
  tutorName: 'Ana Pérez',
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
  ...overrides,
});

const view = (overrides: Partial<AppointmentView> = {}): AppointmentView => ({
  period: 'all',
  status: '',
  doctorId: '',
  search: '',
  ...overrides,
});

const today = '2026-11-04';
const list = [
  make({ id: 'past', appointmentDate: '2026-11-01', status: 'COMPLETED' }),
  make({ id: 'today', appointmentDate: today, petName: 'Rocky', doctorId: 'd2' }),
  make({ id: 'next', appointmentDate: '2026-11-10', status: 'CONFIRMED' }),
  make({ id: 'cancelled', appointmentDate: today, status: 'CANCELLED' }),
];
const ids = (items: Appointment[]) => items.map((item) => item.id);

describe('appointment filters', () => {
  it('compares text without accents or capitals', () => {
    expect(normalize('Pérez')).toBe('perez');
    expect(normalize(null)).toBe('');
  });

  it('filters by period around today', () => {
    expect(ids(filterAppointments(list, view({ period: 'today' }), today))).toEqual([
      'today',
      'cancelled',
    ]);
    expect(ids(filterAppointments(list, view({ period: 'upcoming' }), today))).toEqual([
      'today',
      'next',
      'cancelled',
    ]);
    expect(ids(filterAppointments(list, view({ period: 'past' }), today))).toEqual(['past']);
    expect(filterAppointments(list, view(), today)).toHaveLength(4);
  });

  it('filters by status and by doctor', () => {
    expect(ids(filterAppointments(list, view({ status: 'CONFIRMED' }), today))).toEqual(['next']);
    expect(ids(filterAppointments(list, view({ doctorId: 'd2' }), today))).toEqual(['today']);
  });

  it('searches pet, tutor, doctor and type ignoring accents', () => {
    expect(ids(filterAppointments(list, view({ search: 'rocky' }), today))).toEqual(['today']);
    expect(filterAppointments(list, view({ search: 'perez' }), today)).toHaveLength(4);
    expect(filterAppointments(list, view({ search: 'cirugia' }), today)).toHaveLength(0);
  });

  it('counts the cards: today ignores cancelled ones', () => {
    expect(appointmentKpis(list, today)).toEqual({
      today: 1,
      pending: 1,
      confirmed: 1,
      cancelled: 1,
    });
  });
});

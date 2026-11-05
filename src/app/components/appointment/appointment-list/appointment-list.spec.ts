import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Appointment } from '../../../models/appointment/appointment.model';
import { todayIso } from '../../../utils/appointment/appointment-schedule';
import { clearCookies, setSessionCookies } from '../../../utils/session/testing';
import { AppointmentList } from './appointment-list';

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

const make = (overrides: Partial<Appointment>): Appointment => ({
  id: 'a1',
  tutorId: 't1',
  tutorName: 'Ana Gómez',
  petId: 'p1',
  petName: 'Luna',
  doctorId: 'd1',
  doctorName: 'Carlos Ruiz',
  appointmentTypeId: 'ty1',
  appointmentTypeName: 'Consulta general',
  appointmentDate: inDays(3),
  appointmentTime: '10:30:00',
  status: 'PENDING',
  cancellationReason: null,
  ...overrides,
});

describe('AppointmentList', () => {
  let backend: HttpTestingController;

  function open(roles: string[], appointments: Appointment[]) {
    clearCookies();
    setSessionCookies('token', roles);
    const fixture = TestBed.createComponent(AppointmentList);
    fixture.detectChanges();
    backend = TestBed.inject(HttpTestingController);
    backend.expectOne((req) => req.url === '/api/v1/appointments').flush(appointments);
    // El médico de la sesión (personId p1) es el médico d1
    backend.expectOne('/api/v1/doctor').flush([{ id: 'd1', licenseNumber: 'LIC-1', person: 'p1' }]);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    backend.verify();
    clearCookies();
    vi.useRealTimers();
  });

  it('shows the upcoming appointments and the counters', () => {
    const fixture = open(
      ['ADMIN'],
      [
        make({ id: 'a1' }),
        make({ id: 'a2', petName: 'Rocky', status: 'CONFIRMED' }),
        make({ id: 'a3', petName: 'Vieja', appointmentDate: inDays(-5), status: 'COMPLETED' }),
      ],
    );
    const text: string = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(text).toContain('Luna');
    expect(text).toContain('Rocky');
    expect(text).not.toContain('Vieja');
    expect(text).toContain('Pendientes');
    expect(text).toContain('Confirmadas');
  });

  it('shows an empty state with a call to action when there are no appointments', () => {
    const fixture = open(['ADMIN'], []);
    expect(fixture.nativeElement.textContent).toContain('Aún no hay citas');
  });

  it('only offers the actions that make sense for the status', () => {
    const fixture = open(
      ['ADMIN'],
      [
        make({ id: 'a1', status: 'PENDING' }),
        make({ id: 'a2', status: 'COMPLETED', appointmentTime: '11:00:00' }),
      ],
    );
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    const titles = (row: Element) =>
      [...row.querySelectorAll('button')].map((button) => button.getAttribute('title'));
    expect(titles(rows[0])).toEqual(
      expect.arrayContaining(['Confirmar', 'Editar', 'Cancelar cita', 'Eliminar']),
    );
    // Una cita completada no se puede confirmar, editar ni cancelar
    expect(titles(rows[1])).toEqual(['Eliminar']);
  });

  it('asks the API to confirm with PATCH and shows the row as processing (202)', () => {
    const fixture = open(['ADMIN'], [make({ id: 'a1' })]);
    fixture.nativeElement.querySelector('button[title="Confirmar"]').click();

    const patch = backend.expectOne('/api/v1/appointments/a1/status');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'CONFIRMED', cancellationReason: null });
    patch.flush(
      { message: 'ok', idMessage: 'm1', id: 'a1' },
      { status: 202, statusText: 'Accepted' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Procesando');
  });

  it('for a doctor, starts with "solo mis citas" and hides delete', () => {
    const fixture = open(
      ['DOCTOR'],
      [
        make({ id: 'a1' }),
        make({ id: 'a2', doctorId: 'd2', petName: 'Ajena', doctorName: 'Otro' }),
      ],
    );
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Luna');
    expect(text).not.toContain('Ajena');
    expect(fixture.nativeElement.querySelector('button[title="Eliminar"]')).toBeNull();
  });
});

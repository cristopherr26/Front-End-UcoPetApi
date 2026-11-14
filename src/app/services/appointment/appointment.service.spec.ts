import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Appointment, AppointmentRequest } from '../../models/appointment/appointment.model';
import {
  AppointmentService,
  POLL_ATTEMPTS,
  POLL_EVERY_MS,
  POLL_START_MS,
} from './appointment.service';

const stored: Appointment = {
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
};

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

describe('AppointmentService', () => {
  let service: AppointmentService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  it('asks for the doctor of the session', () => {
    let doctor: unknown;
    service.ownDoctor().subscribe((value) => (doctor = value));
    const call = backend.expectOne('/api/v1/appointments/me/doctor');
    expect(call.request.method).toBe('GET');
    call.flush({ doctorId: 'd1', headquarterId: 'h1' });
    expect(doctor).toEqual({ doctorId: 'd1', headquarterId: 'h1' });
  });

  it('lists every appointment, or only the tutor one when a tutorId is given', () => {
    service.list().subscribe();
    const all = backend.expectOne('/api/v1/appointments');
    expect(all.request.method).toBe('GET');
    all.flush([stored]);

    service.list({ tutorId: 't1' }).subscribe();
    const byTutor = backend.expectOne((req) => req.url === '/api/v1/appointments');
    expect(byTutor.request.params.get('tutorId')).toBe('t1');
    byTutor.flush([stored]);
  });

  it('reads one appointment and the pending ones with the id in the query', () => {
    service.getById('a1').subscribe();
    const one = backend.expectOne((req) => req.url === '/api/v1/appointments/appointment');
    expect(one.request.params.get('id')).toBe('a1');
    one.flush(stored);

    service.pendingByTutor('t1').subscribe();
    const pending = backend.expectOne((req) => req.url === '/api/v1/appointments/pending');
    expect(pending.request.params.get('tutorId')).toBe('t1');
    pending.flush([stored]);
  });

  it('creates with POST and reads the 202 answer', () => {
    let accepted: unknown;
    service.create(request).subscribe((response) => (accepted = response));
    const post = backend.expectOne('/api/v1/appointments');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(request);
    post.flush(
      { message: 'La creacion de la cita fue iniciada', idMessage: 'm1', id: 'a1' },
      { status: 202, statusText: 'Accepted' },
    );
    expect(accepted).toEqual({
      message: 'La creacion de la cita fue iniciada',
      idMessage: 'm1',
      id: 'a1',
    });
  });

  it('updates with PUT sending the id as a query param, not in the path', () => {
    service.update('a1', request).subscribe();
    const put = backend.expectOne((req) => req.url === '/api/v1/appointments');
    expect(put.request.method).toBe('PUT');
    expect(put.request.params.get('id')).toBe('a1');
    expect(put.request.body).toEqual(request);
    put.flush({}, { status: 202, statusText: 'Accepted' });
  });

  it('changes the status with PATCH /{id}/status and deletes with the id in the query', () => {
    service
      .changeStatus('a1', { status: 'CANCELLED', cancellationReason: 'Sin transporte' })
      .subscribe();
    const patch = backend.expectOne('/api/v1/appointments/a1/status');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({
      status: 'CANCELLED',
      cancellationReason: 'Sin transporte',
    });
    patch.flush({}, { status: 202, statusText: 'Accepted' });

    service.remove('a1').subscribe();
    const del = backend.expectOne((req) => req.url === '/api/v1/appointments');
    expect(del.request.method).toBe('DELETE');
    expect(del.request.params.get('id')).toBe('a1');
    del.flush(null, { status: 204, statusText: 'No Content' });
  });

  describe('waitUntil', () => {
    const isOneRequest = (req: { url: string }) => req.url === '/api/v1/appointments/appointment';

    it('keeps asking until the processor applied the change (404 means not yet)', () => {
      vi.useFakeTimers();
      let result: Appointment | null | undefined;
      service
        .waitUntil('a1', (appointment) => appointment.status === 'CONFIRMED')
        .subscribe((value) => (result = value));

      vi.advanceTimersByTime(POLL_START_MS);
      backend.expectOne(isOneRequest).flush(null, { status: 404, statusText: 'Not Found' });
      expect(result).toBeUndefined();

      vi.advanceTimersByTime(POLL_EVERY_MS);
      backend.expectOne(isOneRequest).flush(stored);
      expect(result).toBeUndefined();

      vi.advanceTimersByTime(POLL_EVERY_MS);
      backend.expectOne(isOneRequest).flush({ ...stored, status: 'CONFIRMED' });
      expect(result?.status).toBe('CONFIRMED');
    });

    it('gives null when the change is never seen', () => {
      vi.useFakeTimers();
      let result: Appointment | null | undefined;
      service.waitUntil('a1', () => false).subscribe((value) => (result = value));

      vi.advanceTimersByTime(POLL_START_MS);
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        backend.expectOne(isOneRequest).flush(stored);
        vi.advanceTimersByTime(POLL_EVERY_MS);
      }
      expect(result).toBeNull();
    });
  });
});

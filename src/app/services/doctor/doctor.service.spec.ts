import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let backend: HttpTestingController;

  // Así responde la API: la persona viene como `person` y trae la sede.
  const apiDoctor = { id: 'd1', licenseNumber: 'LIC-001', person: 'p1', headquarterId: 'h1' };
  const doctor = { idPerson: 'p1', licenseNumber: 'LIC-001', headquarterId: 'h1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DoctorService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('maps the API `person` field to `idPerson` and keeps the headquarter', () => {
    let result: unknown;
    service.list('h1').subscribe((doctors) => (result = doctors));
    backend.expectOne((req) => req.url === '/api/v1/doctor').flush([apiDoctor]);
    expect(result).toEqual([
      { id: 'd1', idPerson: 'p1', licenseNumber: 'LIC-001', headquarterId: 'h1' },
    ]);
  });

  it('always sends the headquarter, and uses /filter when a license is given', () => {
    service.list('h1').subscribe();
    const all = backend.expectOne((req) => req.url === '/api/v1/doctor');
    expect(all.request.params.get('headquarterId')).toBe('h1');
    all.flush([apiDoctor]);

    service.list('h1', { licenseNumber: 'LIC' }).subscribe();
    const filtered = backend.expectOne((req) => req.url === '/api/v1/doctor/filter');
    expect(filtered.request.params.get('headquarterId')).toBe('h1');
    expect(filtered.request.params.get('licenseNumber')).toBe('LIC');
    filtered.flush([apiDoctor]);
  });

  it('sends the id as a query param on update, with person and headquarter in the body', () => {
    service.update('d1', { ...doctor, licenseNumber: 'LIC-002' }).subscribe();
    const request = backend.expectOne((req) => req.url === '/api/v1/doctor');
    expect(request.request.method).toBe('PUT');
    expect(request.request.params.get('id')).toBe('d1');
    expect(request.request.body.person).toBe('p1');
    expect(request.request.body.licenseNumber).toBe('LIC-002');
    expect(request.request.body.headquarterId).toBe('h1');
    request.flush(apiDoctor);
  });

  it('creates with POST and toggles the state with PATCH', () => {
    service.create(doctor).subscribe();
    const created = backend.expectOne('/api/v1/doctor');
    expect(created.request.method).toBe('POST');
    expect(created.request.body).toEqual({
      person: 'p1',
      licenseNumber: 'LIC-001',
      headquarterId: 'h1',
    });
    created.flush({ ...apiDoctor, id: null });

    service.activate('d1').subscribe();
    expect(backend.expectOne('/api/v1/doctor/d1/activate').request.method).toBe('PATCH');
    service.deactivate('d1').subscribe();
    expect(backend.expectOne('/api/v1/doctor/d1/deactivate').request.method).toBe('PATCH');
  });
});
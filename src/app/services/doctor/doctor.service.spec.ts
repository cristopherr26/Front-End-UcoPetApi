import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let backend: HttpTestingController;
  // Así responde la API: la persona viene como `person`.
  const apiDoctor = { id: 'd1', licenseNumber: 'LIC-001', person: 'p1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DoctorService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('maps the API `person` field to `idPerson`', () => {
    let result: unknown;
    service.list().subscribe((doctors) => (result = doctors));
    backend.expectOne('/api/v1/doctor').flush([apiDoctor]);
    expect(result).toEqual([{ id: 'd1', idPerson: 'p1', licenseNumber: 'LIC-001' }]);
  });

  it('lists all doctors, or uses /filter when a license is given', () => {
    service.list().subscribe();
    backend.expectOne('/api/v1/doctor').flush([apiDoctor]);
    service.list({ licenseNumber: 'LIC' }).subscribe();
    const request = backend.expectOne((req) => req.url === '/api/v1/doctor/filter');
    expect(request.request.params.get('licenseNumber')).toBe('LIC');
    request.flush([apiDoctor]);
  });

  it('sends the id as a query param on update and the person in the body', () => {
    service.update('d1', { idPerson: 'p1', licenseNumber: 'LIC-002' }).subscribe();
    const request = backend.expectOne((req) => req.url === '/api/v1/doctor');
    expect(request.request.method).toBe('PUT');
    expect(request.request.params.get('id')).toBe('d1');
    expect(request.request.body.person).toBe('p1');
    expect(request.request.body.licenseNumber).toBe('LIC-002');
    request.flush(apiDoctor);
  });

  it('creates with POST and toggles the state with PATCH', () => {
    service.create({ idPerson: 'p1', licenseNumber: 'LIC-001' }).subscribe();
    const created = backend.expectOne('/api/v1/doctor');
    expect(created.request.method).toBe('POST');
    expect(created.request.body.person).toBe('p1');
    created.flush({ id: null, licenseNumber: 'LIC-001', person: 'p1' });

    service.activate('d1').subscribe();
    expect(backend.expectOne('/api/v1/doctor/d1/activate').request.method).toBe('PATCH');
    service.deactivate('d1').subscribe();
    expect(backend.expectOne('/api/v1/doctor/d1/deactivate').request.method).toBe('PATCH');
  });
});
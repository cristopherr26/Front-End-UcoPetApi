import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SpecialtieDoctorService } from './specialtie-doctor.service';

describe('SpecialtieDoctorService', () => {
  let service: SpecialtieDoctorService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpecialtieDoctorService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sends `doctor` and `specialtie` (not idDoctor) in the body', () => {
    service.create({ doctor: 'd1', specialtie: 's1' }).subscribe();
    const request = backend.expectOne('/api/v1/specialtiedoctor');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ doctor: 'd1', specialtie: 's1' });
    request.flush({ id: null, doctor: 'd1', specialtie: 's1' });
  });

  it('filters by idDoctor / idSpecialtie and updates with the id as query param', () => {
    service.list({ idDoctor: 'd1' }).subscribe();
    const filtered = backend.expectOne((req) => req.url === '/api/v1/specialtiedoctor/filter');
    expect(filtered.request.params.get('idDoctor')).toBe('d1');
    filtered.flush([]);

    service.update('r1', { doctor: 'd1', specialtie: 's2' }).subscribe();
    const updated = backend.expectOne((req) => req.url === '/api/v1/specialtiedoctor');
    expect(updated.request.method).toBe('PUT');
    expect(updated.request.params.get('id')).toBe('r1');
    updated.flush({});
  });

  it('removes through PATCH .../deactivate, since the API has no DELETE', () => {
    service.remove('r1').subscribe();
    const request = backend.expectOne('/api/v1/specialtiedoctor/r1/deactivate');
    expect(request.request.method).toBe('PATCH');
    request.flush(null);
  });
});
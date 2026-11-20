import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SpecialtieDoctorService } from './specialtie-doctor.service';
import { SpecialtieDoctor } from '../../models/specialtie/specialtie-doctor.model';

describe('SpecialtieDoctorService', () => {
  let service: SpecialtieDoctorService;
  let backend: HttpTestingController;
  const relation: SpecialtieDoctor = {
    id: 'r1',
    doctor: 'd1',
    specialtie: 's1',
    headquarterId: 'h1',
    certificateUrl: 'https://example.org/cert.pdf',
    certificateNotes: null,
    status: 'PENDING',
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: null,
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpecialtieDoctorService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('verifies with PATCH /{id}/verify and no body', () => {
    service.verify('r1').subscribe();
    const request = backend.expectOne({
      method: 'PATCH',
      url: '/api/v1/specialtiedoctor/r1/verify',
    });
    expect(request.request.body).toBeNull();
    request.flush({ ...relation, status: 'VERIFIED' });
  });

  it('rejects with PATCH /{id}/reject sending the reason', () => {
    service.reject('r1', 'Certificado ilegible').subscribe();
    const request = backend.expectOne({
      method: 'PATCH',
      url: '/api/v1/specialtiedoctor/r1/reject',
    });
    expect(request.request.body).toEqual({ reason: 'Certificado ilegible' });
    request.flush({ ...relation, status: 'REJECTED', rejectionReason: 'Certificado ilegible' });
  });
});

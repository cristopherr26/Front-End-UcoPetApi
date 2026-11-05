import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppointmentTypeService } from './appointment-type.service';

const BASE = '/api/v1/appointments/appointment-type';
const type = { name: 'Consulta general', description: null, isActive: true };

describe('AppointmentTypeService', () => {
  let service: AppointmentTypeService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentTypeService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists all the types and only the active ones', () => {
    service.list().subscribe();
    backend.expectOne(BASE).flush([]);
    service.listActive().subscribe();
    backend.expectOne(`${BASE}/active`).flush([]);
  });

  it('reads the detail with the id in the query', () => {
    service.getById('ty1').subscribe();
    const request = backend.expectOne((req) => req.url === `${BASE}/detail`);
    expect(request.request.params.get('id')).toBe('ty1');
    request.flush({ id: 'ty1', ...type });
  });

  it('creates with POST and updates with PUT using ?id=', () => {
    service.create(type).subscribe();
    const created = backend.expectOne(BASE);
    expect(created.request.method).toBe('POST');
    created.flush({ id: 'ty1', ...type });

    service.update('ty1', type).subscribe();
    const updated = backend.expectOne((req) => req.url === BASE);
    expect(updated.request.method).toBe('PUT');
    expect(updated.request.params.get('id')).toBe('ty1');
    updated.flush({ id: 'ty1', ...type });
  });

  it('switches the state with PATCH {isActive} and deletes with ?id=', () => {
    service.setActive('ty1', false).subscribe();
    const patch = backend.expectOne(`${BASE}/ty1/status`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ isActive: false });
    patch.flush({ id: 'ty1', ...type, isActive: false });

    service.remove('ty1').subscribe();
    const del = backend.expectOne((req) => req.url === BASE);
    expect(del.request.method).toBe('DELETE');
    expect(del.request.params.get('id')).toBe('ty1');
    del.flush(null, { status: 204, statusText: 'No Content' });
  });
});

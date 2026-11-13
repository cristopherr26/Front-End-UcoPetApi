import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TutorPetService } from './tutor-pet.service';

describe('TutorPetService', () => {
  let service: TutorPetService;
  let backend: HttpTestingController;
  const tutorPet = { id: 'tp1', person: 'p1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TutorPetService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists and reads tutor records by ID', () => {
    service.list().subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/tutorPet' }).flush([tutorPet]);

    service.getById('tp1').subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/tutorPet/tp1' }).flush(tutorPet);
  });

  it('filters by the associated person ID', () => {
    service.getByPersonId('p1').subscribe();
    const request = backend.expectOne((req) => req.url === '/api/v1/tutorPet/filter');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('id')).toBe('p1');
    request.flush([tutorPet]);
  });

  it('creates with POST and updates with PUT using the API contract', () => {
    service.create({ person: 'p1' }).subscribe();
    const create = backend.expectOne({ method: 'POST', url: '/api/v1/tutorPet' });
    expect(create.request.body).toEqual({ person: 'p1' });
    create.flush(tutorPet);

    service.update('tp1', { person: 'p2' }).subscribe();
    const update = backend.expectOne((req) => req.url === '/api/v1/tutorPet');
    expect(update.request.method).toBe('PUT');
    expect(update.request.params.get('id')).toBe('tp1');
    expect(update.request.body).toEqual({ person: 'p2' });
    update.flush({ id: 'tp1', person: 'p2' });
  });

  it('deactivates with PUT and the required ID query parameter', () => {
    service.deactivate('tp1').subscribe();
    const request = backend.expectOne((req) => req.url === '/api/v1/tutorPet/deactivate');

    expect(request.request.method).toBe('PUT');
    expect(request.request.params.get('id')).toBe('tp1');
    expect(request.request.body).toBeNull();
    request.flush(null);
  });
});
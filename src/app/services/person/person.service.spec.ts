import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PersonService } from './person.service';
import { PersonLookupService } from './person-lookup.service';
import { Person } from '../../models/person/person.model';

describe('PersonService', () => {
  let service: PersonService;
  let backend: HttpTestingController;
  const person: Person = {
    id: 'p2',
    documentType: 'CC',
    documentNumber: '1036222333',
    firstName: 'José',
    lastName: 'Restrepo',
    email: 'jose@ucopet.com',
    phone: null,
    address: null,
    admin: false,
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PersonService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists, reads and reads my own person', () => {
    service.list().subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/persons' }).flush([person]);
    service.getById('p2').subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/persons/p2' }).flush(person);
    service.me().subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/persons/me' }).flush(person);
  });

  it('creates with POST, updates with PUT and deactivates with DELETE', () => {
    service.create(person).subscribe();
    const created = backend.expectOne({ method: 'POST', url: '/api/v1/persons' });
    expect(created.request.body).toEqual(person);
    created.flush(person);

    service.update('p2', person).subscribe();
    backend.expectOne({ method: 'PUT', url: '/api/v1/persons/p2' }).flush(person);

    service.deactivate('p2').subscribe();
    backend.expectOne({ method: 'DELETE', url: '/api/v1/persons/p2' }).flush(null);
  });

  it('refreshes the person cache used by Médicos after every write', () => {
    const refresh = vi.spyOn(TestBed.inject(PersonLookupService), 'refresh');
    service.create(person).subscribe();
    backend.expectOne('/api/v1/persons').flush(person);
    service.deactivate('p2').subscribe();
    backend.expectOne('/api/v1/persons/p2').flush(null);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('sends the passwords to the right endpoints', () => {
    service.setPassword('p2', { password: 'nuevaClave1' }).subscribe();
    const admin = backend.expectOne({ method: 'PUT', url: '/api/v1/persons/p2/password' });
    expect(admin.request.body).toEqual({ password: 'nuevaClave1' });
    admin.flush(null);

    const change = {
      currentPassword: 'a',
      newPassword: 'nuevaClave1',
      confirmPassword: 'nuevaClave1',
    };
    service.changeOwnPassword(change).subscribe();
    const own = backend.expectOne({ method: 'PUT', url: '/api/v1/persons/me/password' });
    expect(own.request.body).toEqual(change);
    own.flush(null);
  });

  it('asks for the document types once and falls back to a local list if the API fails', () => {
    let first: unknown;
    let second: unknown;
    service.documentTypes().subscribe((types) => (first = types));
    service.documentTypes().subscribe((types) => (second = types));
    backend
      .expectOne('/api/v1/persons/document-types')
      .flush(null, { status: 500, statusText: 'Error' });
    expect(first).toHaveLength(6);
    expect(second).toBe(first);
  });
});

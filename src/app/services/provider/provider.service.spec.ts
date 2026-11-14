import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProviderPayload } from '../../models/provider/provider.model';
import { ProviderService } from './provider.service';

describe('ProviderService', () => {
  let service: ProviderService;
  let backend: HttpTestingController;
  const payload: ProviderPayload = {
    providerName: 'Distribuidora Pet',
    representName: 'Ana Gómez',
    idType: 'NIT',
    documentNumber: '900123456',
    mobileNumber: null,
    address: null,
    email: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProviderService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists providers with GET /api/v1/providers', () => {
    service.getProviders().subscribe();
    expect(backend.expectOne('/api/v1/providers').request.method).toBe('GET');
  });

  it('reads one provider with GET /api/v1/providers/{id}', () => {
    service.getProviderById('p1').subscribe();
    expect(backend.expectOne('/api/v1/providers/p1').request.method).toBe('GET');
  });

  it('creates with POST /api/v1/providers and sends the payload as is', () => {
    service.createProvider(payload).subscribe();
    const request = backend.expectOne('/api/v1/providers').request;
    expect(request.method).toBe('POST');
    expect(request.body).toEqual(payload);
  });

  it('updates with PUT /api/v1/providers/{id}', () => {
    service.updateProvider('p1', payload).subscribe();
    const request = backend.expectOne('/api/v1/providers/p1').request;
    expect(request.method).toBe('PUT');
    expect(request.body).toEqual(payload);
  });

  it('deactivates with PUT /api/v1/providers/{id}/deactivate, not DELETE', () => {
    service.deactivateProvider('p1').subscribe();
    expect(backend.expectOne('/api/v1/providers/p1/deactivate').request.method).toBe('PUT');
  });

  it('loads the document types from the persons endpoint', () => {
    service.getDocumentTypes().subscribe();
    expect(backend.expectOne('/api/v1/persons/document-types').request.method).toBe('GET');
  });
});

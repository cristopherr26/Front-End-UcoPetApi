import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  DocumentTypeOption,
  Provider,
  ProviderPayload,
} from '../../models/provider/provider.model';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly http = inject(HttpClient);
  // La URL base sale de environment; aquí solo se agrega la parte propia de proveedores.
  private readonly apiUrl = `${environment.apiUrl}/providers`;
  private readonly documentTypesUrl = `${environment.apiUrl}/persons/document-types`;

  // GET /api/v1/providers (activos e inactivos)
  getProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(this.apiUrl);
  }

  // GET /api/v1/providers/{id}
  getProviderById(id: string): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  // POST /api/v1/providers
  createProvider(provider: ProviderPayload): Observable<Provider> {
    return this.http.post<Provider>(this.apiUrl, provider);
  }

  // PUT /api/v1/providers/{id}
  updateProvider(id: string, provider: ProviderPayload): Observable<Provider> {
    return this.http.put<Provider>(`${this.apiUrl}/${id}`, provider);
  }

  // PUT /api/v1/providers/{id}/deactivate (el backend no permite reactivar)
  deactivateProvider(id: string): Observable<Provider> {
    return this.http.put<Provider>(`${this.apiUrl}/${id}/deactivate`, null);
  }

  // GET /api/v1/persons/document-types -> [{ value, label }]
  getDocumentTypes(): Observable<DocumentTypeOption[]> {
    return this.http.get<DocumentTypeOption[]>(this.documentTypesUrl);
  }
}

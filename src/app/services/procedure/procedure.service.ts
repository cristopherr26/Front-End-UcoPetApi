import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Procedure,
  ProcedureSpace,
  ProcedureActionResponse,
  CreateProcedureRequest,
  UpdateProcedureRequest
} from '../../models/procedure/procedure.model';

@Injectable({
  providedIn: 'root'
})
export class ProcedureService {

  private readonly http = inject(HttpClient);

  private readonly url = `${environment.apiUrl}/procedures`;

  // Listados
  getAll(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(this.url);
  }

  getActive(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(`${this.url}/active`);
  }

  getInactive(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(`${this.url}/inactive`);
  }

  // Espacios activos para el selector del formulario
  getActiveSpaces(): Observable<ProcedureSpace[]> {
    return this.http.get<ProcedureSpace[]>(`${this.url}/active-spaces`);
  }

  // Consultas individuales
  getById(id: string): Observable<Procedure> {
    return this.http.get<Procedure>(`${this.url}/${id}`);
  }

  getByCode(code: string): Observable<Procedure> {
    return this.http.get<Procedure>(`${this.url}/code/${code}`);
  }

  // Escritura (el backend responde 202 con { message, idMessage })
  create(procedure: CreateProcedureRequest): Observable<ProcedureActionResponse> {
    return this.http.post<ProcedureActionResponse>(this.url, procedure);
  }

  update(id: string, procedure: UpdateProcedureRequest): Observable<ProcedureActionResponse> {
    return this.http.put<ProcedureActionResponse>(`${this.url}/${id}`, procedure);
  }

  activate(id: string): Observable<ProcedureActionResponse> {
    return this.http.patch<ProcedureActionResponse>(`${this.url}/${id}/activate`, null);
  }

  deactivate(id: string): Observable<ProcedureActionResponse> {
    return this.http.patch<ProcedureActionResponse>(`${this.url}/${id}/deactivate`, null);
  }
}
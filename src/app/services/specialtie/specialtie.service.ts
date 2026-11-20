import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateSpecialtieRequest,
  Specialtie,
  UpdateSpecialtieRequest,
} from '../../models/specialtie/specialtie.model';

@Injectable({ providedIn: 'root' })
export class SpecialtieService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/specialties`;
  private cache: Observable<Specialtie[]> | null = null;

  // El catálogo cambia poco: se consulta una vez y se comparte hasta que alguien escriba
  list(): Observable<Specialtie[]> {
    if (this.cache === null) {
      this.cache = this.http
        .get<Specialtie[]>(this.url)
        .pipe(tap({ error: () => this.refresh() }), shareReplay(1));
    }
    return this.cache;
  }

  refresh(): void {
    this.cache = null;
  }

  // El backend responde un texto ("La especialidad fue creada exitosamente."), no JSON;
  // con responseType 'text' se tolera tanto texto como un JSON eventual
  create(request: CreateSpecialtieRequest): Observable<void> {
    const body: CreateSpecialtieRequest = {
      name: request.name,
      description: request.description,
      active: request.active ?? true,
    };
    return this.http.post(this.url, body, { responseType: 'text' }).pipe(
      tap(() => this.refresh()),
      map(() => undefined),
    );
  }

  // Cuerpo parcial: solo los campos que cambian
  update(id: string, request: UpdateSpecialtieRequest): Observable<void> {
    return this.http.patch(`${this.url}/${id}`, request, { responseType: 'text' }).pipe(
      tap(() => this.refresh()),
      map(() => undefined),
    );
  }
}

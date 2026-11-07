import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Pet,
  PetFilters,
  CreatePetRequest,
  UpdatePetRequest
} from '../../models/pet/pet.model';

import { toHttpParams } from '../../utils/shared/http-params';

@Injectable({
  providedIn: 'root'
})
export class PetService {

  private readonly http = inject(HttpClient);

  private readonly url = `${environment.apiUrl}/pets`;


// Obtener mascotas de una sede
// Permite filtrar por nombre, raza y estado
  getByHeadquarter(filters: PetFilters): Observable<Pet[]> {

    return this.http.get<Pet[]>(this.url, {
      params: toHttpParams(filters)
    });
  }


// Obtener mascotas pertenecientes a un tutor
  getByTutor(
    tutorId: string,
    headquarterId: string
  ): Observable<Pet[]> {

    const params = new HttpParams()
      .set('headquarterId', headquarterId);

    return this.http.get<Pet[]>(
      `${this.url}/tutor/${tutorId}`,
      { params }
    );
  }


// Registrar una nueva mascota
  create(pet: CreatePetRequest): Observable<Pet> {

    return this.http.post<Pet>(
      this.url,
      pet
    );
  }

// Actualizar una mascota existente
  update(
    id: string,
    pet: UpdatePetRequest
  ): Observable<Pet> {

    return this.http.put<Pet>(
      `${this.url}/${id}`,
      pet
    );
  }

// Desactivar una mascota

  deactivate(id: string): Observable<void> {

    return this.http.patch<void>(
      `${this.url}/${id}/deactivate`,
      null
    );
  }

}
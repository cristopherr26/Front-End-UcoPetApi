import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PetOption } from '../../models/pet/pet-option.model';

interface TutorPetResponse {
  id: string;
  person: string;
}

interface HealthPlanResponse {
  id: string;
  name: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PetReferenceService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  getTutors(): Observable<PetOption[]> {
    return this.http
      .get<TutorPetResponse[]>(`${this.url}/tutorPet`)
      .pipe(
        map(tutors =>
          tutors.map(tutor => ({
            id: tutor.id,
            name: `Tutor (${tutor.person})`
          }))
        )
      );
  }

  getPolicies(): Observable<PetOption[]> {
    return this.http
      .get<HealthPlanResponse[]>(`${this.url}/healthplans`)
      .pipe(
        map(policies =>
          policies
            .filter(policy => policy.status === 'ACTIVA')
            .map(policy => ({
              id: policy.id,
              name: policy.name
            }))
        )
      );
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SelectOption } from '../../models/appointment/appointment-option.model';
import { PersonSummary } from '../../models/person/person.model';
import { DoctorService } from '../doctor/doctor.service';
import { PersonLookupService } from '../person/person-lookup.service';
import { PetService } from '../pet/pet.service';
import { AppointmentTypeService } from './appointment-type.service';

interface TutorPetApi {
  id: string;
  person: string;
}

// Arma las opciones de los selectores del formulario de citas reutilizando los servicios de
// los otros módulos (solo lectura): médicos, mascotas, personas (nombres) y tutores.
@Injectable({ providedIn: 'root' })
export class AppointmentReferenceService {
  private readonly http = inject(HttpClient);
  private readonly persons = inject(PersonLookupService);
  private readonly doctorService = inject(DoctorService);
  private readonly petService = inject(PetService);
  private readonly typeService = inject(AppointmentTypeService);

  tutors(onlyActive = false): Observable<SelectOption[]> {
    return forkJoin({
      tutors: this.http.get<TutorPetApi[]>(`${environment.apiUrl}/tutorPet`),
      persons: this.persons.byId(),
    }).pipe(
      map(({ tutors, persons }) =>
        tutors
          .filter((tutor) => !onlyActive || persons.get(tutor.person)?.active !== false)
          .map((tutor) => {
            const person = persons.get(tutor.person);
            return {
              id: tutor.id,
              label: personName(person),
              hint: person?.documentNumber ?? null,
            };
          })
          .sort(byLabel),
      ),
    );
  }

  // La API de médicos exige la sede activa: sin sede no hay opciones.
  doctors(headquarterId: string | null): Observable<SelectOption[]> {
    if (!headquarterId) {
      return of([]);
    }
    return forkJoin({
      doctors: this.doctorService.list(headquarterId),
      persons: this.persons.byId(),
    }).pipe(
      map(({ doctors, persons }) =>
        doctors
          .filter((doctor) => doctor.id)
          .map((doctor) => ({
            id: doctor.id as string,
            label: personName(persons.get(doctor.idPerson)),
            hint: `Tarjeta ${doctor.licenseNumber}`,
          }))
          .sort(byLabel),
      ),
    );
  }

  activeTypes(): Observable<SelectOption[]> {
    return this.typeService.listActive().pipe(
      map((types) =>
        types
          .filter((type) => type.id)
          .map((type) => ({ id: type.id as string, label: type.name, hint: type.description }))
          .sort(byLabel),
      ),
    );
  }

  // La API de mascotas pide la sede: solo se listan las mascotas del tutor en esa sede.
  petsOfTutor(tutorId: string, headquarterId: string): Observable<SelectOption[]> {
    return this.petService.getByTutor(tutorId, headquarterId).pipe(
      map((pets) =>
        pets
          .filter((pet) => pet.active !== false)
          .map((pet) => ({ id: pet.id, label: pet.name, hint: `${pet.species} · ${pet.breed}` }))
          .sort(byLabel),
      ),
    );
  }
}

function personName(person: PersonSummary | undefined): string {
  return person ? `${person.firstName} ${person.lastName}`.trim() : 'Sin nombre';
}

function byLabel(a: SelectOption, b: SelectOption): number {
  return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
}

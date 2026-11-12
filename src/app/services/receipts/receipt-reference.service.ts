
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PetOption,
  TutorOption,
} from '../../models/receipts/receipt.model';

import { Headquarter } from '../../models/headquarter/headquarter.model';
import { Pet } from '../../models/pet/pet.model';
import { PersonSummary } from '../../models/person/person.model';

import { HeadquarterService } from '../headquarter/headquarter.service';
import { PersonLookupService } from '../person/person-lookup.service';
import { PetService } from '../pet/pet.service';

interface TutorPetResponse {
  id: string;
  person: string;
}

/**
 * Construye el nombre completo de una persona.
 */
function personFullName(
  person: PersonSummary | undefined,
): string | null {
  if (!person) {
    return null;
  }

  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();

  return name || null;
}

@Injectable({ providedIn: 'root' })
export class ReceiptReferenceService {
  private readonly http = inject(HttpClient);
  private readonly personLookup = inject(PersonLookupService);
  private readonly petService = inject(PetService);
  private readonly headquarterService = inject(HeadquarterService);

  /**
   * Obtiene los tutores desde tutorPet y relaciona cada uno
   * con la información de su persona.
   */
  tutors(): Observable<TutorOption[]> {
    return forkJoin({
      tutors: this.http
        .get<TutorPetResponse[]>(`${environment.apiUrl}/tutorPet`)
        .pipe(
          catchError(() => of([] as TutorPetResponse[])),
        ),
      persons: this.personLookup.byId().pipe(
        catchError(() => of(new Map<string, PersonSummary>())),
      ),
    }).pipe(
      map(({ tutors, persons }) =>
        (Array.isArray(tutors) ? tutors : []).map((tutor) => ({
          id: tutor.id,
          name:
            personFullName(persons.get(tutor.person)) ??
            `Tutor ${tutor.id.slice(0, 8)}`,
        })),
      ),
    );
  }

  /**
   * Obtiene las mascotas de todas las sedes.
   * Cada mascota conserva el tutor al que pertenece.
   */
  pets(): Observable<PetOption[]> {
    return this.headquarterService.list().pipe(
      catchError(() => of([] as Headquarter[])),

      switchMap((headquarters) => {
        if (!headquarters.length) {
          return of([] as PetOption[]);
        }

        return forkJoin(
          headquarters.map((headquarter) =>
            this.petService
              .getByHeadquarter({
                headquarterId: headquarter.id,
              })
              .pipe(
                catchError(() => of([] as Pet[])),
              ),
          ),
        ).pipe(
          map((groups) =>
            groups.flat().map((pet) => ({
              id: pet.id,
              name: pet.name,
              tutorId: pet.tutorId,
              active: pet.active !== false,
            })),
          ),
        );
      }),
    );
  }
}

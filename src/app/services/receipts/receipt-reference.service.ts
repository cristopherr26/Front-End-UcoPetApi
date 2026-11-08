import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PetOption, TutorOption } from '../../models/receipts/receipt.model';
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

function personFullName(person: PersonSummary | undefined): string | null {
  if (!person) {
    return null;
  }
  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return name === '' ? null : name;
}

/**
 * Datos de otros módulos (personas, tutores y mascotas) que Recibos solo lee
 * para mostrar nombres en lugar de UUID. Si alguno falla, se devuelve vacío:
 * la lista de recibos sigue funcionando y muestra el aviso "sin nombre".
 */
@Injectable({ providedIn: 'root' })
export class ReceiptReferenceService {
  private readonly http = inject(HttpClient);
  private readonly personLookup = inject(PersonLookupService);
  private readonly petService = inject(PetService);
  private readonly headquarterService = inject(HeadquarterService);

  /** Un tutor es un registro de /tutorPet (su id es el `tutor_id` del recibo) que apunta a una persona. */
  tutors(): Observable<TutorOption[]> {
    return forkJoin({
      tutors: this.http
        .get<TutorPetResponse[]>(`${environment.apiUrl}/tutorPet`)
        .pipe(catchError(() => of([] as TutorPetResponse[]))),
      persons: this.personLookup.byId(),
    }).pipe(
      map(({ tutors, persons }) =>
        (Array.isArray(tutors) ? tutors : []).map((tutor) => ({
          id: tutor.id,
          name: this.tutorName(persons.get(tutor.person), tutor.id),
        })),
      ),
    );
  }

  /**
   * Todas las mascotas de todas las sedes: `pet_id` del recibo es un UUID suelto
   * y no depende de la sede que esté elegida arriba.
   */
  pets(): Observable<PetOption[]> {
    return this.headquarterService.list().pipe(
      map((headquarters: Headquarter[]) => headquarters.map((headquarter) => headquarter.id)),
      catchError(() => of([] as string[])),
      switchMap((ids) =>
        ids.length === 0
          ? of([] as Pet[][])
          : forkJoin(
            ids.map((headquarterId) =>
              this.petService
                .getByHeadquarter({ headquarterId })
                .pipe(catchError(() => of([] as Pet[]))),
            ),
          ),
      ),
      map((groups) =>
        groups.flat().map((pet) => ({
          id: pet.id,
          name: pet.name,
          tutorId: pet.tutorId,
          active: pet.active !== false,
        })),
      ),
    );
  }

  private tutorName(person: PersonSummary | undefined, tutorId: string): string {
    return personFullName(person) ?? `Tutor ${tutorId.slice(0, 8)}`;
  }
}

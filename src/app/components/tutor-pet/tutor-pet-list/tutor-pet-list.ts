import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { SortHeader } from '../../../directives/shared/sort-header';
import { SessionService } from '../../../services/session/session.service';
import { PersonSummary } from '../../../models/person/person.model';
import { TutorPet } from '../../../models/tutor-pet/tutor-pet.model';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { TutorPetDialogs } from '../../../services/tutor-pet/tutor-pet-dialogs.service';
import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { TablePager } from '../../shared/table-pager';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { createTableState } from '../../../utils/shared/table-state';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { personName, shortId } from '../../../utils/doctor/form-rules';

const PROCESSOR_RETRY_DELAYS_MS = [1200, 2500, 5000];

@Component({
  selector: 'app-tutor-pet-list',
  imports: [PageHeader, EmptyState, SortHeader, TablePager],
  templateUrl: './tutor-pet-list.html',
})
export class TutorPetList {
  private readonly tutorPetService = inject(TutorPetService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly dialogs = inject(TutorPetDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  private readonly session = inject(SessionService);

  protected readonly search = signal('');
  protected readonly sessionIsAdmin = this.session.isAdmin;
  private readonly refresh = signal(0);
  protected readonly tutors = signal<TutorPet[]>([]);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const term = normalize(this.search());
    return term === ''
      ? this.tutors()
      : this.tutors().filter((tutor) => {
          const person = this.persons().get(tutor.person);
          return [this.nameOf(tutor), person?.documentNumber, tutor.id, tutor.person]
            .filter((value): value is string => Boolean(value))
            .some((value) => normalize(value).includes(term));
        });
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'person',
    accessors: {
      person: (tutor) => this.nameOf(tutor) ?? tutor.person,
      document: (tutor) => this.persons().get(tutor.person)?.documentNumber,
      status: (tutor) => this.persons().get(tutor.person)?.active,
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      this.loading.set(untracked(() => this.tutors().length === 0));
      this.error.set(null);
      const subscription = forkJoin({
        tutors: this.tutorPetService.list(),
        persons: this.personLookup.byId(),
      }).subscribe({
        next: ({ tutors, persons }) => {
          this.tutors.set(tutors);
          this.persons.set(persons);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.tutors.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar los tutores'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected nameOf(tutor: TutorPet): string | null {
    return personName(this.persons().get(tutor.person));
  }

  protected shortId = shortId;

  protected create(): void {
    this.dialogs.tutorPet().subscribe(() => this.afterSave('El tutor se envió a guardar', true));
  }

  protected edit(tutor: TutorPet): void {
    this.dialogs
      .tutorPet(tutor)
      .subscribe(() => this.afterSave('Los cambios se enviaron a guardar'));
  }

  protected deactivate(tutor: TutorPet): void {
    const name = this.nameOf(tutor) ?? `Persona ${shortId(tutor.person)}`;
    this.confirm(
      'Desactivar al tutor',
      `Se desactivará la relación de ${name} como tutor de mascotas.`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.tutorPetService.deactivate(tutor.id).subscribe({
          next: () => {
            this.toast.success('La desactivación se envió al procesador');
            this.refreshSoon();
          },
          error: (error: HttpErrorResponse) =>
            this.toast.error(apiErrorMessage(error, 'No se pudo desactivar el tutor')),
        });
      }
    });
  }

  private afterSave(message: string, waitForCreation = false): void {
    this.toast.success(`${message}; el procesador lo aplica en un momento`);
    this.refresh.update((value) => value + 1);
    if (waitForCreation) {
      this.refreshAfterProcessor(PROCESSOR_RETRY_DELAYS_MS, 0);
    }
  }

  private refreshSoon(): void {
    this.refresh.update((value) => value + 1);
    this.refreshAfterProcessor(PROCESSOR_RETRY_DELAYS_MS, 0);
  }

  private refreshAfterProcessor(delays: number[], index: number): void {
    if (index >= delays.length) {
      return;
    }
    setTimeout(() => {
      this.refresh.update((value) => value + 1);
      this.refreshAfterProcessor(delays, index + 1);
    }, delays[index]);
  }
}

function normalize(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { PageHeader } from '../../shared/page-header';
import { TablePager } from '../../shared/table-pager';
import { SortHeader } from '../../../directives/shared/sort-header';
import { Person } from '../../../models/person/person.model';
import { PersonService } from '../../../services/person/person.service';
import { PersonDialogs } from '../../../services/person/person-dialogs.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { createTableState } from '../../../utils/shared/table-state';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { fullName } from '../../../utils/person/form-rules';

type StatusFilter = 'active' | 'inactive' | 'all';
type RoleFilter = 'admin' | 'staff' | 'all';

@Component({
  selector: 'app-person-list',
  imports: [PageHeader, SortHeader, TablePager],
  templateUrl: './person-list.html',
})
export class PersonList {
  private readonly personService = inject(PersonService);
  private readonly dialogs = inject(PersonDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  private readonly session = inject(SessionService);

  protected readonly search = signal('');
  protected readonly status = signal<StatusFilter>('active');
  protected readonly role = signal<RoleFilter>('all');
  private readonly refresh = signal(0);

  protected readonly persons = signal<Person[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly myId = computed(() => this.session.profile()?.personId ?? null);
  protected readonly fullName = fullName;

  protected readonly visible = computed(() => {
    const term = normalize(this.search().trim());
    const status = this.status();
    const role = this.role();
    return this.persons().filter(
      (person) =>
        (status === 'all' || person.active === (status === 'active')) &&
        (role === 'all' || person.admin === (role === 'admin')) &&
        (term === '' ||
          [fullName(person), person.documentNumber, person.email ?? ''].some((text) =>
            normalize(text).includes(term),
          )),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (person) => fullName(person),
      document: (person) => person.documentNumber,
      email: (person) => person.email,
      admin: (person) => person.admin,
      active: (person) => person.active,
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      this.loading.set(true);
      this.error.set(null);
      const subscription = this.personService.list().subscribe({
        next: (persons) => {
          this.persons.set(persons);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.persons.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar los usuarios'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected reload(): void {
    this.refresh.update((value) => value + 1);
  }

  protected create(): void {
    this.dialogs.person().subscribe((saved) => {
      this.persons.update((persons) => [...persons, saved]);
      this.toast.info(
        `${fullName(saved)} se envió a registrar; el procesador lo guarda en un momento`,
      );
    });
  }

  protected edit(person: Person): void {
    this.dialogs.person(person).subscribe((saved) => {
      this.replace(saved);
      this.toast.info(`Los cambios de ${fullName(saved)} se enviaron; se aplican en un momento`);
      if (saved.id === this.myId()) {
        this.session.updateFullName(fullName(saved));
      }
    });
  }

  protected setPassword(person: Person): void {
    this.dialogs
      .password(person)
      .subscribe(() => this.toast.success(`${fullName(person)} ya tiene contraseña nueva`));
  }

  protected deactivate(person: Person): void {
    this.confirm(
      'Desactivar usuario',
      `${fullName(person)} ya no podrá iniciar sesión. Sus datos se conservan y puedes reactivarlo después.`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (!confirmed || !person.id) {
        return;
      }
      this.personService.deactivate(person.id).subscribe({
        next: () => {
          this.replace({ ...person, active: false });
          this.toast.info(`${fullName(person)} se envió a desactivar; se aplica en un momento`);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo desactivar')),
      });
    });
  }

  protected reactivate(person: Person): void {
    if (!person.id) {
      return;
    }
    this.personService.update(person.id, { ...person, active: true }).subscribe({
      next: (saved) => {
        this.replace(saved);
        this.toast.info(`${fullName(person)} se envió a reactivar; se aplica en un momento`);
      },
      error: (error: HttpErrorResponse) =>
        this.toast.error(apiErrorMessage(error, 'No se pudo reactivar')),
    });
  }

  protected setStatus(value: string): void {
    this.status.set(value as StatusFilter);
  }

  protected setRole(value: string): void {
    this.role.set(value as RoleFilter);
  }

  private replace(saved: Person): void {
    this.persons.update((persons) =>
      persons.map((person) => (person.id === saved.id ? saved : person)),
    );
  }
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

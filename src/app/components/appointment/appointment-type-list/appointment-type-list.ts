import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { AppointmentType } from '../../../models/appointment/appointment-type.model';
import { SortHeader } from '../../../directives/shared/sort-header';
import { AppointmentDialogs } from '../../../services/appointment/appointment-dialogs.service';
import { AppointmentTypeService } from '../../../services/appointment/appointment-type.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { appointmentErrorMessage } from '../../../utils/appointment/appointment-errors';
import { normalize } from '../../../utils/appointment/appointment-filters';
import { createTableState } from '../../../utils/shared/table-state';
import { EmptyState } from '../../shared/empty-state';
import { TablePager } from '../../shared/table-pager';

type StateFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-appointment-type-list',
  imports: [SortHeader, TablePager, EmptyState],
  templateUrl: './appointment-type-list.html',
})
export class AppointmentTypeList {
  private readonly typeService = inject(AppointmentTypeService);
  private readonly dialogs = inject(AppointmentDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly search = signal('');
  protected readonly state = signal<StateFilter>('all');
  private readonly refresh = signal(0);

  protected readonly types = signal<AppointmentType[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const term = normalize(this.search().trim());
    const state = this.state();
    return this.types().filter(
      (type) =>
        (state === 'all' || (state === 'active') === type.isActive) &&
        (term === '' || normalize(`${type.name} ${type.description ?? ''}`).includes(term)),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (type) => type.name,
      description: (type) => type.description,
      active: (type) => type.isActive,
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      this.loading.set(true);
      this.error.set(null);
      const subscription = this.typeService.list().subscribe({
        next: (types) => {
          this.types.set(types);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.types.set([]);
          this.loading.set(false);
          this.error.set(appointmentErrorMessage(error, 'No se pudieron cargar los tipos de cita'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected create(): void {
    this.dialogs.type().subscribe((saved) => this.afterSave(saved));
  }

  protected edit(type: AppointmentType): void {
    this.dialogs.type(type).subscribe((saved) => this.afterSave(saved));
  }

  protected toggle(type: AppointmentType): void {
    if (!type.id) {
      return;
    }
    const next = !type.isActive;
    this.typeService.setActive(type.id, next).subscribe({
      next: () => {
        this.toast.success(`"${type.name}" quedó ${next ? 'activo' : 'inactivo'}`);
        this.refresh.update((value) => value + 1);
      },
      error: (error: HttpErrorResponse) =>
        this.toast.error(appointmentErrorMessage(error, 'No se pudo cambiar el estado')),
    });
  }

  protected remove(type: AppointmentType): void {
    this.confirm(
      'Eliminar el tipo de cita',
      `"${type.name}" se borrará para siempre. Si ya hay citas con este tipo, mejor desactívalo.`,
      'Eliminar',
    ).subscribe((confirmed) => {
      if (!confirmed || !type.id) {
        return;
      }
      this.typeService.remove(type.id).subscribe({
        next: () => {
          this.toast.success(`"${type.name}" se eliminó`);
          this.refresh.update((value) => value + 1);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(appointmentErrorMessage(error, 'No se pudo eliminar el tipo de cita')),
      });
    });
  }

  protected setState(value: string): void {
    this.state.set(value as StateFilter);
  }

  private afterSave(saved: AppointmentType): void {
    this.toast.success(`"${saved.name}" quedó guardado`);
    this.refresh.update((value) => value + 1);
  }
}

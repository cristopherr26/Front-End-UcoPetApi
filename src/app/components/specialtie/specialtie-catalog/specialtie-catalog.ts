import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { SortHeader } from '../../../directives/shared/sort-header';
import { EmptyState } from '../../shared/empty-state';
import { TablePager } from '../../shared/table-pager';
import { Specialtie } from '../../../models/specialtie/specialtie.model';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { SpecialtieDialogs } from '../../../services/specialtie/specialtie-dialogs.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { createTableState } from '../../../utils/shared/table-state';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

// Catálogo de especialidades: el ADMIN lo administra, el DOCTOR solo lo consulta
@Component({
  selector: 'app-specialtie-catalog',
  imports: [SortHeader, TablePager, EmptyState],
  templateUrl: './specialtie-catalog.html',
})
export class SpecialtieCatalog {
  private readonly specialtieService = inject(SpecialtieService);
  private readonly dialogs = inject(SpecialtieDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  // Filtros
  protected readonly search = signal('');
  protected readonly activeFilter = signal<ActiveFilter>('ALL');

  private readonly all = signal<Specialtie[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  private readonly refresh = signal(0);

  protected readonly hasFilters = computed(
    () => this.search().trim() !== '' || this.activeFilter() !== 'ALL',
  );

  protected readonly visible = computed(() => {
    const text = normalize(this.search().trim());
    const filter = this.activeFilter();
    return this.all().filter(
      (item) =>
        (filter === 'ALL' || (filter === 'ACTIVE') === (item.active !== false)) &&
        (text === '' || normalize(item.name ?? '').includes(text)),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (item) => item.name,
      description: (item) => item.description,
      active: (item) => item.active !== false,
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      this.loading.set(untracked(() => this.all().length === 0));
      this.error.set(null);
      const subscription = this.specialtieService.list().subscribe({
        next: (specialties) => {
          this.all.set(specialties);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.all.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudo cargar el catálogo'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected setActiveFilter(value: string): void {
    this.activeFilter.set(value as ActiveFilter);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.activeFilter.set('ALL');
  }

  protected create(): void {
    this.dialogs.specialtie().subscribe((saved) => {
      this.toast.success(`Especialidad "${saved.name}" creada`);
      this.reload();
    });
  }

  protected edit(specialtie: Specialtie): void {
    this.dialogs.specialtie(specialtie).subscribe((saved) => {
      this.toast.success(`Especialidad "${saved.name}" actualizada`);
      this.reload();
    });
  }

  protected toggleActive(specialtie: Specialtie): void {
    const activate = specialtie.active === false;
    if (activate) {
      this.setActive(specialtie, true);
      return;
    }
    this.confirm(
      'Desactivar especialidad',
      `"${specialtie.name}" no se podrá asignar a nuevos veterinarios. Las asignaciones actuales no cambian.`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.setActive(specialtie, false);
      }
    });
  }

  private setActive(specialtie: Specialtie, active: boolean): void {
    this.busyId.set(specialtie.id);
    this.specialtieService.update(specialtie.id, { active }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(
          `Especialidad "${specialtie.name}" ${active ? 'activada' : 'desactivada'}`,
        );
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.toast.error(apiErrorMessage(error, 'No se pudo cambiar el estado de la especialidad'));
      },
    });
  }

  // El servicio ya limpió su caché al escribir: recargar trae el catálogo nuevo
  private reload(): void {
    this.refresh.update((value) => value + 1);
  }
}

// Búsqueda sin distinguir mayúsculas ni tildes
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

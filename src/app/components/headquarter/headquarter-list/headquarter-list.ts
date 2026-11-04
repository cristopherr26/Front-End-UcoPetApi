import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { HeadquarterDialogs } from '../../../services/headquarter/headquarter-dialogs.service';
import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { PageHeader } from '../../shared/page-header';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';

@Component({
  selector: 'app-headquarter-list',
  imports: [RouterLink, SortHeader, TablePager, PageHeader],
  templateUrl: './headquarter-list.html',
})
export class HeadquarterList {
  private readonly headquarterService = inject(HeadquarterService);
  private readonly dialogs = inject(HeadquarterDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly search = signal('');
  protected readonly onlyActive = signal(true);
  private readonly reload = signal(0);

  protected readonly headquarters = signal<Headquarter[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const active = this.onlyActive();
    return this.headquarters()
      .filter((headquarter) => (active ? headquarter.isActive : !headquarter.isActive))
      .filter(
        (headquarter) =>
          term === '' ||
          headquarter.name.toLowerCase().includes(term) ||
          headquarter.address.toLowerCase().includes(term),
      );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (headquarter) => headquarter.name,
      address: (headquarter) => headquarter.address,
      isActive: (headquarter) => headquarter.isActive,
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.reload();
      this.loading.set(true);
      this.error.set(null);
      this.headquarterService.refresh();
      const subscription = this.headquarterService.list().subscribe({
        next: (headquarters) => {
          this.headquarters.set(headquarters);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.headquarters.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar las sedes'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected create(): void {
    this.dialogs.headquarter().subscribe((saved) => {
      this.toast.info(`"${saved.name}" se envió a crear; el procesador la aplica en un momento`);
      this.reload.update((value) => value + 1);
    });
  }

  protected edit(headquarter: Headquarter): void {
    this.dialogs.headquarter(headquarter.id).subscribe((saved) => {
      this.toast.info(`"${saved.name}" se envió a actualizar; el procesador la aplica en un momento`);
      this.reload.update((value) => value + 1);
    });
  }

  protected deactivate(headquarter: Headquarter): void {
    this.confirm(
      'Dar de baja la sede',
      `"${headquarter.name}" dejará de estar disponible para stock, espacios y servicios.`,
      'Dar de baja',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.headquarterService.deactivate(headquarter.id).subscribe({
        next: () => {
          this.toast.info(
            `"${headquarter.name}" se envió a dar de baja; el procesador lo aplica en un momento`,
          );
          this.reload.update((value) => value + 1);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo dar de baja la sede')),
      });
    });
  }
}

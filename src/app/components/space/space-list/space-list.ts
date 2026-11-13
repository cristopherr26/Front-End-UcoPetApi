import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { SortHeader } from '../../../directives/shared/sort-header';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { Space } from '../../../models/space/space.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { SpaceDialogs } from '../../../services/space/space-dialogs.service';
import { SpaceService } from '../../../services/space/space.service';
import { createTableState } from '../../../utils/shared/table-state';
import { spaceErrorMessage } from '../../../utils/space/space-error';
import { PageHeader } from '../../shared/page-header';
import { TablePager } from '../../shared/table-pager';

export type SpaceStatus = 'active' | 'inactive' | 'all';

// La API guarda'202' y se vuelve a leer la lista un momento depues
const RELOAD_DELAYS_MS = [1500, 4000];

@Component({
  selector: 'app-space-list',
  imports: [PageHeader, SortHeader, TablePager, RouterLink, UpperCasePipe],
  templateUrl: './space-list.html',
})
export class SpaceList {
  private readonly spaceService = inject(SpaceService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly dialogs = inject(SpaceDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly status = signal<SpaceStatus>('active');
  // Llega de la URL '/espacios?type=Consultorio' usando withComponentInputBinding;
  // el usuario puede cambiarlo después desde el filtro.
  readonly typeFromUrl = input<string | undefined>(undefined, { alias: 'type' });
  protected readonly type = linkedSignal<string | null>(() => this.typeFromUrl() ?? null);
  protected readonly search = signal('');
  private readonly refresh = signal(0);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly spaces = signal<Space[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly headquarters = signal<Headquarter[]>([]);

  protected readonly types = computed(() =>
    [...new Set(this.spaces().map((space) => space.type))].sort((a, b) => a.localeCompare(b, 'es')),
  );
  protected readonly scope = computed(() => {
    const id = this.session.headquarterId();
    return id === null ? null : this.headquarterName(id);
  });

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    const type = this.type();
    return this.spaces().filter(
      (space) =>
        (status === 'all' || (status === 'active') === (space.active === true)) &&
        (type === null || space.type === type) &&
        (term === '' ||
          [space.code, space.type, space.description].some((text) =>
            text.toLowerCase().includes(term),
          )),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'code',
    accessors: {
      code: (space) => space.code,
      type: (space) => space.type,
      headquarter: (space) => this.headquarterName(space.headquarterId),
      active: (space) => space.active,
    },
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));

    this.headquarterService
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (list) => this.headquarters.set(list),
        error: () => this.headquarters.set([]),
      });

    // Se vuelve a pedir la lista al cambiar la sede activa 
    effect((onCleanup) => {
      this.refresh();
      const headquarterId = this.session.headquarterId();
      this.loading.set(true);
      this.error.set(null);
      const subscription = this.spaceService.list(headquarterId).subscribe({
        next: (spaces) => {
          this.spaces.set(spaces);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.spaces.set([]);
          this.loading.set(false);
          this.error.set(spaceErrorMessage(error, 'No se pudieron cargar los espacios'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected headquarterName(id: string | null | undefined): string | null {
    if (!id) {
      return null;
    }
    return (
      this.headquarters().find((headquarter) => headquarter.id === id)?.name ?? 'Sede desconocida'
    );
  }

  protected create(): void {
    this.dialogs.space().subscribe((saved) => {
      this.toast.info(`"${saved.code}" se envió a crear; aparece en la lista en un momento`);
      this.reloadSoon();
    });
  }

  protected edit(space: Space): void {
    this.dialogs.space(space).subscribe((saved) => {
      this.toast.info(`"${saved.code}" se envió a actualizar; el cambio se aplica en un momento`);
      this.reloadSoon();
    });
  }

  protected deactivate(space: Space): void {
    this.confirm(
      'Desactivar el espacio',
      `"${space.code}" dejará de estar disponible, pero no se borra.`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (confirmed && space.id) {
        this.changeStatus(space, false);
      }
    });
  }

  protected activate(space: Space): void {
    if (space.id) {
      this.changeStatus(space, true);
    }
  }

  protected setStatus(value: string): void {
    this.status.set(value as SpaceStatus);
  }

  protected setType(value: string): void {
    this.type.set(value === '' ? null : value);
  }

  private changeStatus(space: Space, active: boolean): void {
    const request = active
      ? this.spaceService.activate(space.id as string)
      : this.spaceService.deactivate(space.id as string);
    request.subscribe({
      next: () => {
        this.spaces.update((spaces) =>
          spaces.map((item) => (item.id === space.id ? { ...item, active } : item)),
        );
        this.toast.info(
          `"${space.code}" se envió a ${active ? 'activar' : 'desactivar'}; el cambio se aplica en un momento`,
        );
        this.reloadSoon();
      },
      error: (error: HttpErrorResponse) =>
        this.toast.error(spaceErrorMessage(error, 'No se pudo cambiar el estado')),
    });
  }

  private reloadSoon(): void {
    RELOAD_DELAYS_MS.forEach((delay) =>
      this.timers.push(setTimeout(() => this.refresh.update((value) => value + 1), delay)),
    );
  }
}
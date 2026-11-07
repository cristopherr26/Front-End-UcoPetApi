import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { Space } from '../../../models/space/space.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { SpaceDialogs } from '../../../services/space/space-dialogs.service';
import { SpaceService } from '../../../services/space/space.service';
import { spaceErrorMessage } from '../../../utils/space/space-error';
import { PageHeader } from '../../shared/page-header';


const RELOAD_DELAYS_MS = [1500, 4000];

@Component({
  selector: 'app-space-detail',
  imports: [PageHeader, RouterLink, UpperCasePipe],
  templateUrl: './space-detail.html',
})
export class SpaceDetail {
  private readonly spaceService = inject(SpaceService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly dialogs = inject(SpaceDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();

  // El codigo llega de la ruta 'espacios/:code' usando withComponentInputBinding.
  readonly code = input.required<string>();

  protected readonly space = signal<Space | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly headquarters = signal<Headquarter[]>([]);
  private readonly refresh = signal(0);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly headquarterName = computed(() => {
    const id = this.space()?.headquarterId;
    if (!id) {
      return null;
    }
    return (
      this.headquarters().find((headquarter) => headquarter.id === id)?.name ?? 'Sede desconocida'
    );
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

    effect((onCleanup) => {
      this.refresh();
      const code = this.code();
     
      if (untracked(() => this.space())?.code !== code) {
        this.loading.set(true);
      }
      this.error.set(null);
      this.notFound.set(false);
      const subscription = this.spaceService.getByCode(code).subscribe({
        next: (space) => {
          this.space.set(space);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          if (error.status === 404) {
            this.space.set(null);
            this.notFound.set(true);
          } else {
            this.error.set(spaceErrorMessage(error, 'No se pudo cargar el espacio'));
          }
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected edit(): void {
    const current = this.space();
    if (!current) {
      return;
    }
    this.dialogs.space(current).subscribe((saved) => {
     
      this.space.set(saved);
      this.toast.info(`"${saved.code}" se envió a actualizar; el cambio se aplica en un momento`);
      this.reloadSoon();
    });
  }

  protected deactivate(): void {
    const current = this.space();
    if (!current?.id) {
      return;
    }
    this.confirm(
      'Desactivar el espacio',
      `"${current.code}" dejará de estar disponible, pero no se borra.`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.changeStatus(false);
      }
    });
  }

  protected activate(): void {
    this.changeStatus(true);
  }

  private changeStatus(active: boolean): void {
    const current = this.space();
    if (!current?.id) {
      return;
    }
    const request = active
      ? this.spaceService.activate(current.id)
      : this.spaceService.deactivate(current.id);
    request.subscribe({
      next: () => {
        this.space.update((space) => (space ? { ...space, active } : space));
        this.toast.info(
          `"${current.code}" se envió a ${active ? 'activar' : 'desactivar'}; el cambio se aplica en un momento`,
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
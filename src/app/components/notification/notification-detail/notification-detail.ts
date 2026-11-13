import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { REFERENCE_TYPES, ReferenceType } from '../../../models/notification/notification-enums';
import { Notification } from '../../../models/notification/notification.model';
import { labelOf } from '../../../models/product/catalog-enums';
import { NotificationTypePipe } from '../../../pipes/notification/notification-type.pipe';
import { NotificationService } from '../../../services/notification/notification.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';

const TARGETS: Record<ReferenceType, string | null> = {
  APPOINTMENT: '/agenda',
  ORDER: '/ordenes',
  LOGIN: null,
};

@Component({
  selector: 'app-notification-detail',
  imports: [RouterLink, DatePipe, UpperCasePipe, NotificationTypePipe, PageHeader, EmptyState],
  templateUrl: './notification-detail.html',
})
export class NotificationDetail {
  private readonly notificationService = inject(NotificationService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly confirm = injectConfirm();

  readonly id = input.required<string>();

  protected readonly notification = signal<Notification | null>(null);
  protected readonly userName = computed(() => this.session.profile()?.fullName ?? '');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly personId = computed(() => this.session.profile()?.personId ?? null);
  protected readonly referenceLabel = computed(() => {
    const type = this.notification()?.referenceType;
    return type ? labelOf(REFERENCE_TYPES, type) : '';
  });
  protected readonly target = computed(() => {
    const type = this.notification()?.referenceType;
    return type ? TARGETS[type] : null;
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      const personId = this.personId();
      this.notification.set(null);
      this.error.set(null);
      if (!personId) {
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      const subscription = this.notificationService.list(personId).subscribe({
        next: (items) => {
          const found = items.find((item) => item.id === id) ?? null;
          this.notification.set(found);
          this.loading.set(false);
          if (found && !found.read) {
            this.markAsRead(found);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudo cargar la notificación'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected goToTarget(): void {
    const target = this.target();
    if (target) {
      this.router.navigate([target]);
    }
  }

  protected remove(item: Notification): void {
    this.confirm(
      'Eliminar la notificación',
      `"${item.title}" dejará de aparecer en tu lista.`,
      'Eliminar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.notificationService.delete(item.id, !item.read).subscribe({
        next: () => {
          this.toast.info('Se envió a eliminar; el procesador la borra en un momento');
          this.router.navigate(['/notificaciones']);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo eliminar')),
      });
    });
  }

  private markAsRead(item: Notification): void {
    this.notificationService.markAsRead(item.id).subscribe({
      next: () =>
        this.notification.update((current) => (current ? { ...current, read: true } : current)),
      error: () => undefined,
    });
  }
}

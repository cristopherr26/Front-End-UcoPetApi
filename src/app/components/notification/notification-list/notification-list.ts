import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { SortHeader } from '../../../directives/shared/sort-header';
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  NotificationStatus,
  NotificationType,
} from '../../../models/notification/notification-enums';
import { Notification } from '../../../models/notification/notification.model';
import { labelOf } from '../../../models/product/catalog-enums';
import { NotificationTypePipe } from '../../../pipes/notification/notification-type.pipe';
import { TruncatePipe } from '../../../pipes/shared/truncate.pipe';
import { NotificationService } from '../../../services/notification/notification.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import {
  DEFAULT_FILTERS,
  FILTER_TEXT_MAX,
  FILTER_TEXT_RULES,
  applyFilters,
} from '../../../utils/notification/filter-rules';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { createTableState } from '../../../utils/shared/table-state';
import { PageHeader } from '../../shared/page-header';
import { TablePager } from '../../shared/table-pager';

@Component({
  selector: 'app-notification-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    UpperCasePipe,
    NotificationTypePipe,
    TruncatePipe,
    SortHeader,
    TablePager,
    PageHeader,
  ],
  templateUrl: './notification-list.html',
})
export class NotificationList {
  private readonly notificationService = inject(NotificationService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly types = NOTIFICATION_TYPES;
  protected readonly statuses = NOTIFICATION_STATUSES;
  protected readonly textMax = FILTER_TEXT_MAX;

  protected readonly form = this.fb.group({
    type: this.fb.control<NotificationType | null>(null),
    status: this.fb.control<NotificationStatus>('ALL'),
    text: ['', FILTER_TEXT_RULES],
  });
  private readonly filters = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly notifications = signal<Notification[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly refresh = signal(0);

  private readonly personId = computed(() => this.session.profile()?.personId ?? null);
  private readonly onlyUnread = computed(() => this.filters().status === 'UNREAD');
  protected readonly hasUnread = computed(() => this.notifications().some((item) => !item.read));
  protected readonly visible = computed(() => applyFilters(this.notifications(), this.filters()));

  protected readonly table = createTableState(this.visible, {
    sortKey: 'createdAt',
    direction: 'desc',
    accessors: {
      title: (item) => item.title,
      type: (item) => labelOf(NOTIFICATION_TYPES, item.type),
      read: (item) => item.read,
      createdAt: (item) => Date.parse(item.createdAt),
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const personId = this.personId();
      const unread = this.onlyUnread();
      if (!personId) {
        this.notifications.set([]);
        return;
      }
      this.loading.set(true);
      this.error.set(null);
      const request = unread
        ? this.notificationService.listUnread(personId)
        : this.notificationService.list(personId);
      const subscription = request.subscribe({
        next: (items) => {
          this.notifications.set(items);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.notifications.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar las notificaciones'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected reload(): void {
    this.refresh.update((value) => value + 1);
  }

  protected clearFilters(): void {
    this.form.reset(DEFAULT_FILTERS);
  }

  protected invalid(): boolean {
    const control = this.form.controls.text;
    return control.dirty && control.invalid;
  }

  protected markAsRead(item: Notification): void {
    if (item.read) {
      return;
    }
    this.notificationService.markAsRead(item.id).subscribe({
      next: () =>
        this.notifications.update((items) =>
          items.map((current) => (current.id === item.id ? { ...current, read: true } : current)),
        ),
      error: (error: HttpErrorResponse) =>
        this.toast.error(apiErrorMessage(error, 'No se pudo marcar como leída')),
    });
  }

  protected markAll(): void {
    const personId = this.personId();
    if (!personId) {
      return;
    }
    this.notificationService.markAllAsRead(personId).subscribe({
      next: () => {
        this.notifications.update((items) => items.map((current) => ({ ...current, read: true })));
        this.toast.success('Todas quedaron como leídas');
      },
      error: (error: HttpErrorResponse) =>
        this.toast.error(apiErrorMessage(error, 'No se pudieron marcar como leídas')),
    });
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
          this.notifications.update((items) => items.filter((current) => current.id !== item.id));
          this.toast.info('Se envió a eliminar; el procesador la borra en un momento');
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo eliminar')),
      });
    });
  }
}

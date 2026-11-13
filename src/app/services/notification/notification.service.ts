import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap, tap, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Notification } from '../../models/notification/notification.model';
import { SessionService } from '../session/session.service';

const REFRESH_EVERY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  private readonly unreadState = signal(0);
  readonly unreadCount = this.unreadState.asReadonly();

  constructor() {
    const session = inject(SessionService);
    effect((onCleanup) => {
      const personId = session.profile()?.personId;
      if (!personId) {
        this.unreadState.set(0);
        return;
      }
      const subscription = timer(0, REFRESH_EVERY_MS)
        .pipe(switchMap(() => this.countUnread(personId).pipe(catchError(() => of(null)))))
        .subscribe((count) => {
          if (count !== null) {
            this.unreadState.set(count);
          }
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  list(personId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/person/${personId}`);
  }

  listUnread(personId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/person/${personId}/unread`);
  }

  countUnread(personId: string): Observable<number> {
    return this.http.get<number>(`${this.base}/person/${personId}/unread/count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/read`, null).pipe(tap(() => this.decrement()));
  }

  markAllAsRead(personId: string): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/person/${personId}/read-all`, null)
      .pipe(tap(() => this.unreadState.set(0)));
  }

  delete(id: string, wasUnread: boolean): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        if (wasUnread) {
          this.decrement();
        }
      }),
    );
  }

  private decrement(): void {
    this.unreadState.update((count) => Math.max(0, count - 1));
  }
}

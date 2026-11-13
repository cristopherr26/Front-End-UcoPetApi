import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NotificationService } from '../../../services/notification/notification.service';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink],
  templateUrl: './notification-bell.html',
})
export class NotificationBell {
  private readonly notificationService = inject(NotificationService);

  protected readonly count = this.notificationService.unreadCount;
  protected readonly label = computed(() => (this.count() > 9 ? '9+' : String(this.count())));
}

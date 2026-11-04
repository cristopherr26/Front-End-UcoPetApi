import { Pipe, PipeTransform } from '@angular/core';

import { NOTIFICATION_TYPES, NotificationType } from '../../models/notification/notification-enums';
import { labelOf } from '../../models/product/catalog-enums';

@Pipe({ name: 'notificationType' })
export class NotificationTypePipe implements PipeTransform {
  transform(value: NotificationType | null | undefined): string {
    return labelOf(NOTIFICATION_TYPES, value);
  }
}

import { ValidatorFn, Validators } from '@angular/forms';

import { Notification, NotificationFilters } from '../../models/notification/notification.model';

export const FILTER_TEXT_MAX = 150;

export const FILTER_TEXT_RULES: ValidatorFn[] = [Validators.maxLength(FILTER_TEXT_MAX)];

export const DEFAULT_FILTERS: NotificationFilters = {
  type: null,
  status: 'ALL',
  text: '',
};

export function applyFilters(
  notifications: Notification[],
  filters: NotificationFilters,
): Notification[] {
  const term = filters.text.trim().toLowerCase();
  return notifications.filter(
    (notification) =>
      (filters.type === null || notification.type === filters.type) &&
      (filters.status !== 'READ' || notification.read) &&
      (filters.status !== 'UNREAD' || !notification.read) &&
      (term === '' || notification.title.toLowerCase().includes(term)),
  );
}

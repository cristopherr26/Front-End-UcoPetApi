import { NotificationStatus, NotificationType, ReferenceType } from './notification-enums';

export interface Notification {
  id: string;
  personId: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  referenceId: string | null;
  referenceType: ReferenceType | null;
  createdAt: string;
}

export interface NotificationFilters {
  type: NotificationType | null;
  status: NotificationStatus;
  text: string;
}

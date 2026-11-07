import { Option } from '../product/catalog-enums';

export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'ORDER_AUTHORIZED'
  | 'ORDER_REJECTED'
  | 'ORDER_PENDING'
  | 'LOGIN_SUCCEDED';

export type ReferenceType = 'APPOINTMENT' | 'ORDER' | 'LOGIN';

export type NotificationStatus = 'ALL' | 'UNREAD' | 'READ';

export const NOTIFICATION_TYPES: Option<NotificationType>[] = [
  { value: 'APPOINTMENT_CREATED', label: 'Cita programada' },
  { value: 'ORDER_AUTHORIZED', label: 'Orden aprobada' },
  { value: 'ORDER_REJECTED', label: 'Orden rechazada' },
  { value: 'ORDER_PENDING', label: 'Orden pendiente' },
  { value: 'LOGIN_SUCCEDED', label: 'Inicio de sesión' },
];

export const REFERENCE_TYPES: Option<ReferenceType>[] = [
  { value: 'APPOINTMENT', label: 'Cita' },
  { value: 'ORDER', label: 'Orden' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
];

export const NOTIFICATION_STATUSES: Option<NotificationStatus>[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'UNREAD', label: 'No leídas' },
  { value: 'READ', label: 'Leídas' },
];

import { Option } from '../product/catalog-enums';

export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'ORDER_AUTHORIZED'
  | 'ORDER_REJECTED'
  | 'ORDER_PENDING'
  | 'LOGIN_SUCCEDED'
  | 'PET_CREATED'
  | 'PET_UPDATED'
  | 'PET_DELETED'
  | 'DOCTOR_CREATED'
  | 'DOCTOR_UPDATED'
  | 'DOCTOR_DELETED'
  | 'TUTOR_CREATED'
  | 'TUTOR_UPDATED'
  | 'TUTOR_DELETED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'



export type ReferenceType = 'APPOINTMENT' | 'ORDER' | 'LOGIN';

export type NotificationStatus = 'ALL' | 'UNREAD' | 'READ';

export const NOTIFICATION_TYPES: Option<NotificationType>[] = [
  { value: 'APPOINTMENT_CREATED', label: 'Cita programada' },
  { value: 'ORDER_AUTHORIZED', label: 'Orden aprobada' },
  { value: 'ORDER_REJECTED', label: 'Orden rechazada' },
  { value: 'ORDER_PENDING', label: 'Orden pendiente' },
  { value: 'LOGIN_SUCCEDED', label: 'Inicio de sesión' },
  { value: 'PET_CREATED', label: 'Mascota creada' },
  { value: 'PET_UPDATED', label: 'Mascota actualizada' },
  { value: 'PET_DELETED', label: 'Mascota eliminada' },
  { value: 'DOCTOR_CREATED', label: 'Médico creado' },
  { value: 'DOCTOR_UPDATED', label: 'Médico actualizado' },
  { value: 'DOCTOR_DELETED', label: 'Médico eliminado' },
  { value: 'TUTOR_CREATED', label: 'Tutor creado' },
  { value: 'TUTOR_UPDATED', label: 'Tutor actualizado' },
  { value: 'TUTOR_DELETED', label: 'Tutor eliminado' },
  { value: 'USER_CREATED', label: 'Usuario creado' },
  { value: 'USER_UPDATED', label: 'Usuario actualizado' },
  { value: 'USER_DELETED', label: 'Usuario eliminado' },

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

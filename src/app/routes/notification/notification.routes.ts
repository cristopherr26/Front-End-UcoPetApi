import { Routes } from '@angular/router';

import { NotificationDetail } from '../../components/notification/notification-detail/notification-detail';
import { NotificationList } from '../../components/notification/notification-list/notification-list';

export const NOTIFICATION_ROUTES: Routes = [
  { path: '', component: NotificationList, title: 'Notificaciones · UcoPet' },
  { path: ':id', component: NotificationDetail, title: 'Detalle de notificación · UcoPet' },
];

import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'notificaciones' },
    title: 'Notificaciones · UcoPet',
  },
];

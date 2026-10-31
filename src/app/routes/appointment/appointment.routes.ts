import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'agenda' },
    title: 'Agenda · UcoPet',
  },
];

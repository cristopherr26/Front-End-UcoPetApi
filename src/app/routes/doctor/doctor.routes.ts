import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'medicos' },
    title: 'Médicos · UcoPet',
  },
];

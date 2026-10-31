import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const HEALTH_PLAN_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'polizas' },
    title: 'Pólizas · UcoPet',
  },
];

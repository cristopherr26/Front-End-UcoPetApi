import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const EGRESS_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'egresos' },
    title: 'Egresos · UcoPet',
  },
];

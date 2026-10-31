import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'compras' },
    title: 'Compras · UcoPet',
  },
];

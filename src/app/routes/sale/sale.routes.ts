import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const SALE_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'ventas' },
    title: 'Ventas · UcoPet',
  },
];

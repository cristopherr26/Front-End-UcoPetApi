import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const PROVIDER_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'proveedores' },
    title: 'Proveedores · UcoPet',
  },
];

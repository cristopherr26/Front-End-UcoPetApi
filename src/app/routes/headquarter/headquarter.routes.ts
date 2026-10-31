import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const HEADQUARTER_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'sedes' },
    title: 'Sedes · UcoPet',
  },
];

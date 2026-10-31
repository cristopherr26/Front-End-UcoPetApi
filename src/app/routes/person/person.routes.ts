import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const PERSON_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'usuarios' },
    title: 'Usuarios · UcoPet',
  },
];

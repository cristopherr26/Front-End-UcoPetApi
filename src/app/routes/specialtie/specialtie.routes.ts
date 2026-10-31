import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const SPECIALTIE_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'especialidades' },
    title: 'Especialidades · UcoPet',
  },
];

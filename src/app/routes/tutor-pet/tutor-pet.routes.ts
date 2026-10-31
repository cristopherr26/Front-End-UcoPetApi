import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const TUTOR_PET_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'tutores' },
    title: 'Tutores · UcoPet',
  },
];

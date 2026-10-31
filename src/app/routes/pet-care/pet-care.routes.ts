import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const PET_CARE_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'atenciones' },
    title: 'Atenciones · UcoPet',
  },
];

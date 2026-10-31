import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const SPACE_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'espacios' },
    title: 'Espacios · UcoPet',
  },
];

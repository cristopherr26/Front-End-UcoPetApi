import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const TRANSFER_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'traslados' },
    title: 'Traslados · UcoPet',
  },
];

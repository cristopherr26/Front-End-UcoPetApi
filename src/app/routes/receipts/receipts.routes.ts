import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const RECEIPTS_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'recibos' },
    title: 'Recibos de caja · UcoPet',
  },
];

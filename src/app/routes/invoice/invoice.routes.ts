import { Routes } from '@angular/router';

import { ModulePlaceholder } from '../../components/placeholder/module-placeholder/module-placeholder';

export const INVOICE_ROUTES: Routes = [
  {
    path: '',
    component: ModulePlaceholder,
    data: { module: 'facturas' },
    title: 'Facturas · UcoPet',
  },
];

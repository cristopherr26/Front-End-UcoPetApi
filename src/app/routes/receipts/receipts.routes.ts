import { Routes } from '@angular/router';

import { ReceiptsList } from '../../components/receipts/receipts-list/receipts-list';

export const RECEIPTS_ROUTES: Routes = [
  {
    path: '',
    component: ReceiptsList,
    title: 'Recibos de caja · UcoPet',
  },
];

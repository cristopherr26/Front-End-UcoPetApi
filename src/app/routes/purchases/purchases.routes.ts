import { Routes } from '@angular/router';

import { PurchaseDetail } from '../../components/purchases/purchase-detail/purchase-detail';
import { PurchaseList } from '../../components/purchases/purchase-list/purchase-list';

export const PURCHASES_ROUTES: Routes = [
  { path: '', component: PurchaseList, title: 'Compras · UcoPet' },
  { path: ':id', component: PurchaseDetail, title: 'Detalle de compra · UcoPet' },
];

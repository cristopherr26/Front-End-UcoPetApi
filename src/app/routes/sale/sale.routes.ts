import { Routes } from '@angular/router';
import { SaleList } from '../../components/sale/sale-list/sale-list';
import { SaleDetail } from '../../components/sale/sale-detail/sale-detail';

export const SALE_ROUTES: Routes = [
  { path: '', component: SaleList, title: 'Ventas · UcoPet' },
  { path: ':id', component: SaleDetail, title: 'Detalle de venta · UcoPet' },
];

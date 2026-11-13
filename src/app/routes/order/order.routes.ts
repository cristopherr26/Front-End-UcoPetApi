import { Routes } from '@angular/router';

import { OrderList } from '../../components/order/order-list/order-list';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    component: OrderList,
    title: 'Órdenes · UcoPet',
  },
];

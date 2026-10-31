import { Routes } from '@angular/router';

import { CatalogList } from '../../components/product/catalog-list/catalog-list';
import { ProductList } from '../../components/product/product-list/product-list';
import { ServiceList } from '../../components/product/service-list/service-list';
import { ProductShell } from '../../components/product/product-shell/product-shell';
import { StockPage } from '../../components/product/stock-page/stock-page';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    component: ProductShell,
    children: [
      { path: '', component: CatalogList, title: 'Catálogo · UcoPet' },
      { path: 'productos', component: ProductList, title: 'Productos · UcoPet' },
      { path: 'productos/:id/stock', component: StockPage, title: 'Stock · UcoPet' },
      { path: 'servicios', component: ServiceList, title: 'Servicios · UcoPet' },
    ],
  },
];

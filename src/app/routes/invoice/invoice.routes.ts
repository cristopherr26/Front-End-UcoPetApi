import { Routes } from '@angular/router';

import { InvoiceDetail } from '../../components/invoice/invoice-detail/invoice-detail';
import { InvoiceList } from '../../components/invoice/invoice-list/invoice-list';

export const INVOICE_ROUTES: Routes = [
  { path: '', component: InvoiceList, title: 'Facturas · UcoPet' },
  { path: ':id', component: InvoiceDetail, title: 'Detalle de factura · UcoPet' },
];

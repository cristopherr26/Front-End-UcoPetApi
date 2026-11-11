import { Routes } from '@angular/router';

import { EgressShell } from '../../components/egress/egress-shell/egress-shell';
import { EgressList } from '../../components/egress/egress-list/egress-list';
import { EgressSummaryPage } from '../../components/egress/egress-summary/egress-summary';
import { EgressDetail } from '../../components/egress/egress-detail/egress-detail';

export const EGRESS_ROUTES: Routes = [
  {
    path: '',
    component: EgressShell,
    children: [
      { path: '', component: EgressList, title: 'Egresos · UcoPet' },
      { path: 'resumen', component: EgressSummaryPage, title: 'Resumen de egresos · UcoPet' },
      { path: ':id', component: EgressDetail, title: 'Detalle de egreso · UcoPet' },
    ],
  },
];

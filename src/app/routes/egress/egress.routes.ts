import { Routes } from '@angular/router';

import { EgressShell } from '../../components/egress/egress-shell/egress-shell';
import { EgressList } from '../../components/egress/egress-list/egress-list';

export const EGRESS_ROUTES: Routes = [
  {
    path: '',
    component: EgressShell,
    children: [{ path: '', component: EgressList, title: 'Egresos · UcoPet' }],
  },
];

import { Routes } from '@angular/router';

import { HeadquarterList } from '../../components/headquarter/headquarter-list/headquarter-list';
import { HeadquarterDetail } from '../../components/headquarter/headquarter-detail/headquarter-detail';

export const HEADQUARTER_ROUTES: Routes = [
  { path: '', component: HeadquarterList, title: 'Sedes · UcoPet' },
  { path: ':id', component: HeadquarterDetail, title: 'Sede · UcoPet' },
];

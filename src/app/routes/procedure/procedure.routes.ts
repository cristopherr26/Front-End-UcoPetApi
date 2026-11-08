import { Routes } from '@angular/router';
import { ProcedureList } from '../../components/procedure/procedure-list/procedure-list';

export const PROCEDURE_ROUTES: Routes = [
  {
    path: '',
    component: ProcedureList,
    title: 'Procedimientos · UcoPet',
  },
];
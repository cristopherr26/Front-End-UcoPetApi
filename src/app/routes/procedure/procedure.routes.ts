import { Routes } from '@angular/router';
import { ProcedureList } from '../../components/procedure/procedure-list/procedure-list';
import { ProcedureDetail } from '../../components/procedure/procedure-detail/procedure-detail';

export const PROCEDURE_ROUTES: Routes = [
  {
    path: '',
    component: ProcedureList,
    title: 'Procedimientos · UcoPet',
  },
  {
    // ":id" es el parámetro de ruta
    path: ':id',
    component: ProcedureDetail,
    title: 'Detalle del procedimiento · UcoPet',
  },
];
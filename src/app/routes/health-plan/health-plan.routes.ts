import { Routes } from '@angular/router';
import { HealthPlanList } from '../../components/health-plan/health-plan-list/health-plan-list';
import { HealthPlanForm } from '../../components/health-plan/health-plan-form/health-plan-form';

export const HEALTH_PLAN_ROUTES: Routes = [
  {
    path: '',
    component: HealthPlanList,
    title: 'Pólizas · UcoPet',
  },
  {
    path: 'new',
    component: HealthPlanForm,
    title: 'Nueva Póliza · UcoPet',
  },
  {
    path: 'edit/:id',
    component: HealthPlanForm,
    title: 'Editar Póliza · UcoPet',
  },
];
import { Routes } from '@angular/router';

import { AppointmentList } from '../../components/appointment/appointment-list/appointment-list';
import { AppointmentShell } from '../../components/appointment/appointment-shell/appointment-shell';
import { AppointmentTypeList } from '../../components/appointment/appointment-type-list/appointment-type-list';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    component: AppointmentShell,
    children: [
      { path: '', component: AppointmentList, title: 'Agenda · UcoPet' },
      { path: 'tipos', component: AppointmentTypeList, title: 'Tipos de cita · UcoPet' },
    ],
  },
];

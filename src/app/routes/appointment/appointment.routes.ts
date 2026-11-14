import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

import { AppointmentList } from '../../components/appointment/appointment-list/appointment-list';
import { AppointmentShell } from '../../components/appointment/appointment-shell/appointment-shell';
import { AppointmentTypeList } from '../../components/appointment/appointment-type-list/appointment-type-list';
import { SessionService } from '../../services/session/session.service';

// Los tipos de cita los gestiona solo el administrador (la API también lo exige).
const adminOnly: CanActivateFn = () =>
  inject(SessionService).isAdmin() || inject(Router).createUrlTree(['/agenda']);

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    component: AppointmentShell,
    children: [
      { path: '', component: AppointmentList, title: 'Agenda · UcoPet' },
      {
        path: 'tipos',
        component: AppointmentTypeList,
        canActivate: [adminOnly],
        title: 'Tipos de cita · UcoPet',
      },
    ],
  },
];

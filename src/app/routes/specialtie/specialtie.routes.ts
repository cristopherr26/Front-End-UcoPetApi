import { Routes } from '@angular/router';

import { SpecialtieShell } from '../../components/specialtie/specialtie-shell/specialtie-shell';
import { SpecialtieDoctorList } from '../../components/specialtie/specialtie-doctor-list/specialtie-doctor-list';
import { SpecialtieCatalog } from '../../components/specialtie/specialtie-catalog/specialtie-catalog';
import { SpecialtieVerification } from '../../components/specialtie/specialtie-verification/specialtie-verification';

// El guard de rol del módulo viene de app.routes (moduleRoleGuard).
// 'verificacion' es solo para ADMIN: la pestaña se oculta y la pantalla muestra el aviso de permiso.
export const SPECIALTIE_ROUTES: Routes = [
  {
    path: '',
    component: SpecialtieShell,
    children: [
      { path: '', component: SpecialtieDoctorList, title: 'Especialidades · UcoPet' },
      {
        path: 'catalogo',
        component: SpecialtieCatalog,
        title: 'Catálogo de especialidades · UcoPet',
      },
      {
        path: 'verificacion',
        component: SpecialtieVerification,
        title: 'Verificación de especialidades · UcoPet',
      },
    ],
  },
];

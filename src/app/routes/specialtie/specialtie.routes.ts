import { Routes } from '@angular/router';

import { SpecialtieDoctorList } from '../../components/doctor/specialtie-doctor-list/specialtie-doctor-list';

// Por ahora solo está la asignación médico-especialidad (/api/v1/specialtiedoctor).
// El CRUD de la especialidad en sí (/api/v1/specialtie) se agrega aquí cuando exista.
export const SPECIALTIE_ROUTES: Routes = [
  {
    path: '',
    component: SpecialtieDoctorList,
    title: 'Especialidades · UcoPet',
  },
];
import { Routes } from '@angular/router';

import { DoctorList } from '../../components/doctor/doctor-list/doctor-list';
import { SpecialtieDoctorList } from '../../components/doctor/specialtie-doctor-list/specialtie-doctor-list';

export const DOCTOR_ROUTES: Routes = [
  { path: '', component: DoctorList, title: 'Médicos · UcoPet' },
  {
    path: 'especialidades',
    component: SpecialtieDoctorList,
    title: 'Especialidades de los médicos · UcoPet',
  },
];
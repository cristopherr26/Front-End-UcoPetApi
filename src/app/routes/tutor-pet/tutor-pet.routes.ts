import { Routes } from '@angular/router';

import { TutorPetList } from '../../components/tutor-pet/tutor-pet-list/tutor-pet-list';

export const TUTOR_PET_ROUTES: Routes = [
  {
    path: '',
    component: TutorPetList,
    data: { module: 'tutores' },
    title: 'Tutores · UcoPet',
  },
];
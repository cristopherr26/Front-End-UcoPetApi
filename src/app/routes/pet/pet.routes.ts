import { Routes } from '@angular/router';
import { PetList } from '../../components/pet/pet-list/pet-list';

export const PET_ROUTES: Routes = [
  {
    path: '',
    component: PetList
  },
  {
    path: 'tutor/:tutorId',
    component: PetList
  }
];


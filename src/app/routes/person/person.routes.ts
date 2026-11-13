import { Routes } from '@angular/router';

import { PersonList } from '../../components/person/person-list/person-list';

export const PERSON_ROUTES: Routes = [
  { path: '', component: PersonList, title: 'Usuarios · UcoPet' },
];

  import { Routes } from '@angular/router';

  import { SpaceDetail } from '../../components/space/space-detail/space-detail';
  import { SpaceList } from '../../components/space/space-list/space-list';

  export const SPACE_ROUTES: Routes = [
    { path: '', component: SpaceList, title: 'Espacios · UcoPet' },
    { path: ':code', component: SpaceDetail, title: 'Detalle del espacio · UcoPet' },
  ];
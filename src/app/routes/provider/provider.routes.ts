import { Routes } from '@angular/router';

import { ProviderList } from '../../components/provider/provider-list/provider-list';

// Crear y editar se hacen en un modal que abre la lista, por eso solo hay una ruta.
export const PROVIDER_ROUTES: Routes = [
  { path: '', component: ProviderList, title: 'Proveedores · UcoPet' },
];

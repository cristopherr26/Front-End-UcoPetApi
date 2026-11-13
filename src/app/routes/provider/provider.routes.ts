import { Routes } from '@angular/router';

import { ProviderForm } from '../../components/provider/provider-form/provider-form';
import { ProviderList } from '../../components/provider/provider-list/provider-list';

export const PROVIDER_ROUTES: Routes = [
  { path: '', component: ProviderList, title: 'Proveedores · UcoPet' },
  { path: 'new', component: ProviderForm, title: 'Nuevo proveedor · UcoPet' },
  { path: 'edit/:id', component: ProviderForm, title: 'Editar proveedor · UcoPet' },
];

import { Route, Routes } from '@angular/router';

import { Shell } from './components/layout/shell/shell';
import { moduleRoleGuard } from './guards/navigation/module-role.guard';
import { NAVIGATION, NavModule } from './config/navigation/navigation';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/session/login/login';
import { guestGuard, sessionGuard } from './guards/session/session.guards';

function moduleRoute(module: NavModule): Route {
  return {
    path: module.path,
    canActivate: [moduleRoleGuard],
    data: { module: module.path },
    loadChildren: module.loadChildren,
  };
}

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Entrar · UcoPet' },
  {
    path: '',
    component: Shell,
    canActivate: [sessionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Dashboard, title: 'Inicio · UcoPet' },
      ...NAVIGATION.flatMap((group) => group.modules).map(moduleRoute),
    ],
  },
  { path: '**', redirectTo: '' },
];

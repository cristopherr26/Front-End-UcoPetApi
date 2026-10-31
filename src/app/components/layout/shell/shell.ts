import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { filter, map } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { Brand } from '../../shared/brand';
import { ToastHost } from '../../shared/toast-host';
import { NAVIGATION, findModule, isReady } from '../../../config/navigation/navigation';
import { HeadquarterMenu } from '../headquarter-menu/headquarter-menu';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgbDropdownModule,
    Brand,
    HeadquarterMenu,
    ToastHost,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  protected readonly sidebarOpen = signal(false);
  protected readonly isReady = isReady;
  protected readonly today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly groups = computed(() => {
    const roles = this.session.profile()?.roles ?? [];
    return NAVIGATION.map((group) => ({
      ...group,
      modules: group.modules.filter((module) => module.roles.some((role) => roles.includes(role))),
    })).filter((group) => group.modules.length > 0);
  });

  protected readonly section = computed(() => {
    const segment = this.url().split('?')[0].split('/').filter(Boolean)[0] ?? 'inicio';
    return findModule(segment)?.label ?? 'Inicio';
  });

  protected readonly initials = computed(() =>
    (this.session.profile()?.fullName ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join(''),
  );

  protected logout(): void {
    this.session.logout();
    this.router.navigate(['/login']);
  }
}

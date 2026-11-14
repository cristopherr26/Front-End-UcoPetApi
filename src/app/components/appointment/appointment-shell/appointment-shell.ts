import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SessionService } from '../../../services/session/session.service';
import { PageHeader } from '../../shared/page-header';

// Marco del módulo Agenda: título y pestañas (Citas | Tipos de cita) sobre la pantalla activa.
@Component({
  selector: 'app-appointment-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeader],
  template: `
    <app-page-header
      eyebrow="Procesador Salud"
      title="Agenda"
      subtitle="Citas de los pacientes con su médico y tipo de atención"
    >
      <ul class="nav nav-pills agenda-nav">
        <li class="nav-item">
          <a
            class="nav-link"
            routerLink="/agenda"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-calendar3 me-1"></i>Citas
          </a>
        </li>
        @if (session.isAdmin()) {
          <li class="nav-item">
            <a class="nav-link" routerLink="/agenda/tipos" routerLinkActive="active">
              <i class="bi bi-tags me-1"></i>Tipos de cita
            </a>
          </li>
        }
      </ul>
    </app-page-header>
    <router-outlet />
  `,
  styles: `
    .agenda-nav {
      background: #fff;
      border: 1px solid var(--uc-line);
      border-radius: 999px;
      padding: 0.25rem;
    }
    .agenda-nav .nav-link {
      border-radius: 999px;
      color: var(--uc-ink);
      font-weight: 700;
      padding: 0.4rem 0.95rem;
    }
    .agenda-nav .nav-link.active {
      color: #fff;
      background: var(--uc-grad);
    }
  `,
})
export class AppointmentShell {
  protected readonly session = inject(SessionService);
}

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'app-egress-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeader],
  template: `
    <app-page-header
      eyebrow="Procesador Pagos"
      title="Egresos"
      subtitle="Pagos a proveedores por órdenes de compra"
    >
      <ul class="nav nav-pills egress-nav">
        <li class="nav-item">
          <a
            class="nav-link"
            routerLink="/egresos"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-list-ul me-1"></i>Registro
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" routerLink="/egresos/resumen" routerLinkActive="active">
            <i class="bi bi-pie-chart me-1"></i>Resumen
          </a>
        </li>
      </ul>
    </app-page-header>
    <router-outlet />
  `,
  styles: `
    .egress-nav {
      background: #fff;
      border: 1px solid var(--uc-line);
      border-radius: 999px;
      padding: 0.25rem;
    }
    .egress-nav .nav-link {
      border-radius: 999px;
      color: var(--uc-ink);
      font-weight: 700;
      padding: 0.4rem 0.95rem;
    }
    .egress-nav .nav-link.active {
      color: #fff;
      background: var(--uc-grad);
    }
  `,
})
export class EgressShell {}

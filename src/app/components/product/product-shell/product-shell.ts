import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SessionService } from '../../../services/session/session.service';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'app-product-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeader],
  template: `
    <app-page-header
      eyebrow="Procesador Inventario"
      title="Catálogo"
      subtitle="Productos, servicios y stock por sede"
    >
      <ul class="nav nav-pills catalog-nav">
        <li class="nav-item">
          <a
            class="nav-link"
            routerLink="/catalogo"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="bi bi-grid me-1"></i>Todo
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" routerLink="/catalogo/productos" routerLinkActive="active">
            <i class="bi bi-box-seam me-1"></i>Productos
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" routerLink="/catalogo/servicios" routerLinkActive="active">
            <i class="bi bi-clipboard2-pulse me-1"></i>Servicios
          </a>
        </li>
      </ul>
    </app-page-header>
    @if (!session.isAdmin()) {
      <div class="alert alert-info d-flex align-items-center gap-2 py-2">
        <i class="bi bi-eye"></i>Tu rol puede consultar el catálogo, pero no modificarlo.
      </div>
    }
    <router-outlet />
  `,
  styles: `
    .catalog-nav {
      background: #fff;
      border: 1px solid var(--uc-line);
      border-radius: 999px;
      padding: 0.25rem;
    }
    .catalog-nav .nav-link {
      border-radius: 999px;
      color: var(--uc-ink);
      font-weight: 700;
      padding: 0.4rem 0.95rem;
    }
    .catalog-nav .nav-link.active {
      color: #fff;
      background: var(--uc-grad);
    }
  `,
})
export class ProductShell {
  protected readonly session = inject(SessionService);
}

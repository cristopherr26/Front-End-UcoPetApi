import { Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { HeadquarterDialogs } from '../../../services/headquarter/headquarter-dialogs.service';
import { SessionService } from '../../../services/session/session.service';
import { PageHeader } from '../../shared/page-header';
import { apiErrorMessage } from '../../../utils/shared/api-error';

@Component({
  selector: 'app-headquarter-detail',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header
      eyebrow="Sedes"
      [title]="headquarter()?.name ?? 'Sede'"
      [subtitle]="headquarter()?.address ?? null"
    >
      <a class="btn btn-light btn-sm" routerLink="/sedes">
        <i class="bi bi-arrow-left me-1"></i>Volver
      </a>
      @if (session.isAdmin() && headquarter()) {
        <button type="button" class="btn btn-primary btn-sm" (click)="edit()">
          <i class="bi bi-pencil me-1"></i>Editar
        </button>
      }
    </app-page-header>

    @if (error()) {
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ error() }}
      </div>
    } @else if (headquarter(); as hq) {
      <div class="card">
        <div class="card-body">
          <dl class="row mb-0">
            <dt class="col-sm-3">Nombre</dt>
            <dd class="col-sm-9">{{ hq.name }}</dd>
            <dt class="col-sm-3">Dirección</dt>
            <dd class="col-sm-9">{{ hq.address }}</dd>
            <dt class="col-sm-3">Estado</dt>
            <dd class="col-sm-9">
              @if (hq.isActive) {
                <span class="badge rounded-pill bg-success-subtle text-success-emphasis">Activa</span>
              } @else {
                <span class="badge rounded-pill bg-danger-subtle text-danger-emphasis">Dada de baja</span>
              }
            </dd>
          </dl>
        </div>
      </div>
    } @else {
      <div class="text-center py-5"><span class="spinner-border text-primary"></span></div>
    }
  `,
})
export class HeadquarterDetail implements OnInit {
  private readonly headquarterService = inject(HeadquarterService);
  private readonly dialogs = inject(HeadquarterDialogs);
  protected readonly session = inject(SessionService);

  readonly id = input.required<string>();
  protected readonly headquarter = signal<Headquarter | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected edit(): void {
    this.dialogs.headquarter(this.id()).subscribe(() => this.load());
  }

  private load(): void {
    this.headquarterService.getById(this.id()).subscribe({
      next: (headquarter) => this.headquarter.set(headquarter),
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'No se encontró la sede')),
    });
  }
}

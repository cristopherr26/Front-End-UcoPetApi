import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { PageHeader } from '../../shared/page-header';
import { Provider } from '../../../models/provider/provider.model';
import { ProviderStatusPipe } from '../../../pipes/provider/provider-status.pipe';
import { ProviderService } from '../../../services/provider/provider.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { providerErrorMessage } from '../../../utils/provider/provider-error';
import { filterProviders } from '../../../utils/provider/provider-filter';
@Component({
  selector: 'app-provider-list',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AsyncPipe,
    UpperCasePipe,
    ProviderStatusPipe,
    PageHeader,
  ],
  templateUrl: './provider-list.html',
})
export class ProviderList {
  private readonly providerService = inject(ProviderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();

  protected readonly providers = signal<Provider[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);

  // Buscador por nombre o documento. El FormControl avisa cada vez que el usuario escribe
  // (valueChanges) y el pipe de RxJS espera a que termine de teclear antes de filtrar.
  protected readonly search = new FormControl('', { nonNullable: true });

  // Los proveedores cargados filtrados por lo que dice el buscador.
  protected readonly filteredProviders$ = combineLatest([
    toObservable(this.providers),
    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), startWith('')),
  ]).pipe(map(([providers, term]) => filterProviders(providers, term)));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.providerService.getProviders().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.providers.set([]);
        this.loading.set(false);
        this.error.set(providerErrorMessage(error, 'No se pudieron cargar los proveedores'));
      },
    });
  }

  // Un proveedor inactivo no se puede editar (el backend lo rechaza), por eso no se navega.
  protected edit(provider: Provider): void {
    if (provider.active) {
      this.router.navigate(['/proveedores/edit', provider.id]);
    }
  }

  protected deactivate(provider: Provider): void {
    this.confirm(
      'Inactivar proveedor',
      `"${provider.providerName}" quedará inactivo y ya no se podrá editar ni reactivar.`,
      'Inactivar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.busyId.set(provider.id);
      this.providerService.deactivateProvider(provider.id).subscribe({
        next: (updated) => {
          this.busyId.set(null);
          this.providers.update((providers) =>
            providers.map((item) => (item.id === provider.id ? { ...item, ...updated } : item)),
          );
          this.toast.info(
            `"${provider.providerName}" se envió a inactivar; el procesador lo aplica en un momento`,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.busyId.set(null);
          this.toast.error(providerErrorMessage(error, 'No se pudo inactivar el proveedor'));
        },
      });
    });
  }
}

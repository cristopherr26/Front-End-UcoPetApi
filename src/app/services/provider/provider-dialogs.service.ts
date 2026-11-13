import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { ProviderForm } from '../../components/provider/provider-form/provider-form';
import { Provider } from '../../models/provider/provider.model';

// Abre el formulario de proveedor como modal. Devuelve el proveedor guardado, o no emite nada
// si el usuario cierra el modal sin guardar.
@Injectable({ providedIn: 'root' })
export class ProviderDialogs {
  private readonly modalService = inject(NgbModal);

  provider(provider: Provider | null = null): Observable<Provider> {
    const ref = this.modalService.open(ProviderForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });

    if (provider !== null) {
      ref.componentInstance.edit(provider);
    }

    return from(ref.result as Promise<Provider>).pipe(catchError(() => EMPTY));
  }
}

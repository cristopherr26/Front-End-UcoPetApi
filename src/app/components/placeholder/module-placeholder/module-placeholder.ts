import { Component, computed, inject, input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, catchError, from } from 'rxjs';

import { injectConfirm } from '../../../services/shared/confirm';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { ToastService } from '../../../services/shared/toast.service';
import { findModule, processorOf } from '../../../config/navigation/navigation';
import { ExampleModal } from '../example-modal';

@Component({
  selector: 'app-module-placeholder',
  imports: [PageHeader, EmptyState],
  templateUrl: './module-placeholder.html',
})
export class ModulePlaceholder {
  private readonly modalService = inject(NgbModal);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();

  readonly module = input.required<string>();
  protected readonly info = computed(() => findModule(this.module()));
  protected readonly processor = computed(() => processorOf(this.module()));

  protected openExample(): void {
    const ref = this.modalService.open(ExampleModal, { backdrop: 'static' });
    from(ref.result as Promise<string>)
      .pipe(catchError(() => EMPTY))
      .subscribe((name) => this.toast.success(`Ejemplo: "${name}" se guardaría aquí`));
  }

  protected openConfirm(): void {
    this.confirm(
      'Dar de baja el registro',
      'Ejemplo de confirmación antes de una acción que no se deshace.',
      'Dar de baja',
    ).subscribe((confirmed) =>
      confirmed ? this.toast.info('Ejemplo: se confirmó la acción') : undefined,
    );
  }
}

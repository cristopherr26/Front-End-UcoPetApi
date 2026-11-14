import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';

import { Order } from '../../../models/order/order.model';
import { Procedure } from '../../../models/procedure/procedure.model';

import { OrderService } from '../../../services/order/order.service';
import { ProcedureService } from '../../../services/procedure/procedure.service';

import { apiErrorMessage } from '../../../utils/shared/api-error';

@Component({
  selector: 'app-order-procedure-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './order-procedure-form.html',
})
export class OrderProcedureForm implements OnInit {
  private readonly orderService = inject(OrderService);

  private readonly procedureService = inject(ProcedureService);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly modal = inject(NgbActiveModal);

  // Orden que se está modificando
  protected readonly order = signal<Order | null>(null);

  // Procedimientos activos distintos al actual (el backend rechaza el mismo con 400)
  protected readonly procedures = signal<Procedure[]>([]);

  // Nombre del procedimiento actual (puede estar desactivado)
  protected readonly currentLabel = signal<string>('—');

  protected readonly loading = signal(false);

  protected readonly saving = signal(false);

  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    procedureId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loading.set(true);

    this.procedureService.getAll().subscribe({
      next: (procedures) => {
        const currentId = this.order()?.procedureId;

        const current = procedures.find((procedure) => procedure.id === currentId);

        this.currentLabel.set(current ? this.procedureLabel(current) : '—');

        this.procedures.set(
          procedures.filter((procedure) => procedure.active && procedure.id !== currentId),
        );

        this.loading.set(false);
      },

      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        this.error.set(apiErrorMessage(error, 'No se pudieron cargar los procedimientos'));
      },
    });
  }

  // Lo llama OrderDialogs antes de mostrar el modal
  edit(order: Order): void {
    this.order.set(order);
  }

  protected procedureLabel(procedure: Procedure): string {
    return `${procedure.code} — ${procedure.type}`;
  }

  protected save(): void {
    const order = this.order();

    if (this.form.invalid || order === null) {
      this.form.markAllAsTouched();

      return;
    }

    this.saving.set(true);

    this.error.set(null);

    this.orderService.changeProcedure(order.id, this.form.getRawValue().procedureId).subscribe({
      next: (updated) => {
        this.modal.close(updated);
      },

      error: (error: HttpErrorResponse) => {
        this.saving.set(false);

        this.error.set(apiErrorMessage(error, 'No se pudo cambiar el procedimiento'));
      },
    });
  }

  protected invalid(): boolean {
    const control = this.form.controls.procedureId;

    return control.touched && control.invalid;
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Appointment } from '../../../models/appointment/appointment.model';
import { dateLabel, timeLabel } from '../../../utils/appointment/appointment-labels';
import { REASON_RULES } from '../../../utils/appointment/form-rules';
import { ModalFrame } from '../../shared/modal-frame';

// Pide la justificación para cancelar una cita. Cierra el modal con el texto escrito.
@Component({
  selector: 'app-appointment-cancel',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './appointment-cancel.html',
})
export class AppointmentCancel {
  protected readonly modal = inject(NgbActiveModal);

  protected readonly appointment = signal<Appointment | null>(null);
  protected readonly reason = new FormControl('', { nonNullable: true, validators: REASON_RULES });
  protected readonly dateLabel = dateLabel;
  protected readonly timeLabel = timeLabel;

  start(appointment: Appointment): void {
    this.appointment.set(appointment);
  }

  protected submit(): void {
    if (this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.modal.close(this.reason.value.trim());
  }
}

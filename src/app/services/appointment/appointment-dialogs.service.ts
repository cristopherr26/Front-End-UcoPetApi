import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Appointment } from '../../models/appointment/appointment.model';
import { AppointmentType } from '../../models/appointment/appointment-type.model';
import { AppointmentCancel } from '../../components/appointment/appointment-cancel/appointment-cancel';
import {
  AppointmentForm,
  AppointmentFormResult,
} from '../../components/appointment/appointment-form/appointment-form';
import { AppointmentTypeForm } from '../../components/appointment/appointment-type-form/appointment-type-form';

@Injectable({ providedIn: 'root' })
export class AppointmentDialogs {
  private readonly modalService = inject(NgbModal);

  // Crear (appointment = null) o editar una cita. `existing` son las citas ya cargadas: el
  // formulario las usa para avisar qué horas tiene ocupadas el médico.
  appointment(
    existing: Appointment[],
    appointment: Appointment | null = null,
  ): Observable<AppointmentFormResult> {
    const ref = this.modalService.open(AppointmentForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    ref.componentInstance.start(existing, appointment);
    return from(ref.result as Promise<AppointmentFormResult>).pipe(catchError(() => EMPTY));
  }

  // Pide la justificación de la cancelación. Emite el texto, o nada si se cierra el modal.
  cancellation(appointment: Appointment): Observable<string> {
    const ref = this.modalService.open(AppointmentCancel, { backdrop: 'static' });
    ref.componentInstance.start(appointment);
    return from(ref.result as Promise<string>).pipe(catchError(() => EMPTY));
  }

  type(type: AppointmentType | null = null): Observable<AppointmentType> {
    const ref = this.modalService.open(AppointmentTypeForm, { backdrop: 'static' });
    if (type) {
      ref.componentInstance.edit(type);
    }
    return from(ref.result as Promise<AppointmentType>).pipe(catchError(() => EMPTY));
  }
}

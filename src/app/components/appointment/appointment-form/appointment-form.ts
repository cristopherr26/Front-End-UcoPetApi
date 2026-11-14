import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, forkJoin, map } from 'rxjs';

import { SelectOption } from '../../../models/appointment/appointment-option.model';
import { Appointment, AppointmentRequest } from '../../../models/appointment/appointment.model';
import { AppointmentReferenceService } from '../../../services/appointment/appointment-reference.service';
import { AppointmentService } from '../../../services/appointment/appointment.service';
import { SessionService } from '../../../services/session/session.service';
import { appointmentErrorMessage } from '../../../utils/appointment/appointment-errors';
import { dateLabel, statusLabel, timeLabel } from '../../../utils/appointment/appointment-labels';
import {
  busyTimes,
  hasClash,
  isPastTime,
  todayIso,
} from '../../../utils/appointment/appointment-schedule';
import { SavedSchedule, notPastDate, notPastTime } from '../../../utils/appointment/form-rules';
import { ModalFrame } from '../../shared/modal-frame';

// Lo que devuelve el modal al guardar: la API respondió 202 y el procesador aún debe guardar la cita.
export interface AppointmentFormResult {
  id: string;
  mode: 'create' | 'update';
  request: AppointmentRequest;
}

@Component({
  selector: 'app-appointment-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './appointment-form.html',
})
export class AppointmentForm {
  private readonly appointmentService = inject(AppointmentService);
  private readonly references = inject(AppointmentReferenceService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  // Fecha y hora con las que la cita ya estaba guardada (null al crear). Va antes del formulario
  // porque su validador la lee.
  private readonly savedSchedule = signal<SavedSchedule | null>(null);

  protected readonly form = this.fb.group(
    {
      tutorId: this.fb.control<string | null>(null, Validators.required),
      petId: this.fb.control<string | null>(null, Validators.required),
      doctorId: this.fb.control<string | null>(null, Validators.required),
      appointmentTypeId: this.fb.control<string | null>(null, Validators.required),
      appointmentDate: ['', [Validators.required, notPastDate()]],
      appointmentTime: ['', Validators.required],
    },
    { validators: notPastTime(() => this.savedSchedule()) },
  );

  protected readonly tutors = signal<SelectOption[]>([]);
  protected readonly pets = signal<SelectOption[]>([]);
  // Citas pendientes del tutor elegido (GET /pending): aviso para no duplicar citas.
  protected readonly tutorPending = signal<Appointment[]>([]);
  protected readonly doctors = signal<SelectOption[]>([]);
  protected readonly types = signal<SelectOption[]>([]);

  protected readonly editing = signal<Appointment | null>(null);
  protected readonly loadingOptions = signal(false);
  protected readonly loadingPets = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly minDate = todayIso();
  protected readonly hasHeadquarter = computed(() => this.session.headquarterId() !== null);

  private readonly existing = signal<Appointment[]>([]);
  private petsRequest: Subscription | null = null;
  private pendingRequest: Subscription | null = null;

  // Lo que hay escrito en el formulario, como signal, para calcular las horas ocupadas al vuelo.
  private readonly value = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly busy = computed(() =>
    busyTimes(
      this.existing(),
      this.value().doctorId,
      this.value().appointmentDate,
      this.editing()?.id ?? null,
    ),
  );
  // Hoy y con una hora que ya pasó. Se calcula con el valor escrito para mostrar el aviso al vuelo.
  protected readonly pastTime = computed(() => {
    const { appointmentDate, appointmentTime } = this.value();
    const saved = this.savedSchedule();
    const unchanged =
      !!saved && saved.date === appointmentDate && saved.time === appointmentTime?.slice(0, 5);
    return !unchanged && isPastTime(appointmentDate, appointmentTime);
  });
  protected readonly clash = computed(() =>
    hasClash(
      this.existing(),
      this.value().doctorId,
      this.value().appointmentDate,
      this.value().appointmentTime,
      this.editing()?.id ?? null,
    ),
  );

  protected readonly statusLabel = statusLabel;
  protected readonly dateLabel = dateLabel;
  protected readonly timeLabel = timeLabel;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.petsRequest?.unsubscribe();
      this.pendingRequest?.unsubscribe();
    });
  }

  // `existing` son las citas ya cargadas en la lista; `appointment` es la cita a editar (null al crear).
  start(existing: Appointment[], appointment: Appointment | null = null): void {
    this.existing.set(existing);
    this.editing.set(appointment);
    this.loadingOptions.set(true);
    forkJoin({
      tutors: this.references.tutors(true),
      doctors: this.references.doctors(this.session.headquarterId()),
      types: this.references.activeTypes(),
    }).subscribe({
      next: ({ tutors, doctors, types }) => {
        this.tutors.set(tutors);
        // Al editar sin sede activa se conserva el médico actual de la cita para no perderlo.
        const currentDoctor: SelectOption | null = appointment
          ? { id: appointment.doctorId, label: appointment.doctorName ?? 'Médico de la cita' }
          : null;
        this.doctors.set(
          currentDoctor && !doctors.some((doctor) => doctor.id === currentDoctor.id)
            ? [...doctors, currentDoctor]
            : doctors,
        );
        this.types.set(types);
        if (appointment) {
          this.fillFrom(appointment, types);
        }
        this.loadingOptions.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loadingOptions.set(false);
        this.error.set(
          appointmentErrorMessage(error, 'No se pudieron cargar los datos del formulario'),
        );
      },
    });
  }

  // Cambiar de tutor invalida la mascota elegida: se vuelve a pedir la lista de ese tutor.
  protected onTutorChange(): void {
    this.form.controls.petId.reset(null);
    this.loadPets(this.form.controls.tutorId.value, null);
    this.loadPending(this.form.controls.tutorId.value);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const current = this.editing();
    const request: AppointmentRequest = {
      tutorId: value.tutorId as string,
      petId: value.petId as string,
      doctorId: value.doctorId as string,
      appointmentTypeId: value.appointmentTypeId as string,
      appointmentDate: value.appointmentDate,
      appointmentTime: value.appointmentTime,
      // Al editar se conserva el estado: cambiarlo se hace con las acciones de la lista.
      status: current?.status ?? 'PENDING',
      cancellationReason: current?.cancellationReason ?? null,
    };

    this.saving.set(true);
    this.error.set(null);
    const call = current
      ? this.appointmentService.update(current.id, request)
      : this.appointmentService.create(request);
    call.subscribe({
      next: (accepted) =>
        this.modal.close({
          id: accepted.id,
          mode: current ? 'update' : 'create',
          request,
        } satisfies AppointmentFormResult),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(appointmentErrorMessage(error, 'No se pudo enviar la cita'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  private fillFrom(appointment: Appointment, activeTypes: SelectOption[]): void {
    this.savedSchedule.set({
      date: appointment.appointmentDate,
      time: timeLabel(appointment.appointmentTime),
    });
    this.form.patchValue({
      tutorId: appointment.tutorId,
      doctorId: appointment.doctorId,
      // Si el tipo de la cita se desactivó, la API no lo acepta: hay que elegir otro.
      appointmentTypeId: activeTypes.some((type) => type.id === appointment.appointmentTypeId)
        ? appointment.appointmentTypeId
        : null,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: timeLabel(appointment.appointmentTime),
    });
    this.loadPets(appointment.tutorId, appointment.petId);
    this.loadPending(appointment.tutorId);
  }

  // Es solo un aviso: si falla, el formulario sigue funcionando.
  private loadPending(tutorId: string | null): void {
    this.pendingRequest?.unsubscribe();
    this.tutorPending.set([]);
    if (!tutorId) {
      return;
    }
    this.pendingRequest = this.appointmentService.pendingByTutor(tutorId).subscribe({
      next: (pending) =>
        this.tutorPending.set(pending.filter((item) => item.id !== this.editing()?.id)),
      error: () => undefined,
    });
  }

  // La API de mascotas necesita la sede activa. Sin sede no hay lista; al editar se conserva la
  // mascota actual de la cita para no perderla.
  private loadPets(tutorId: string | null, selectedPetId: string | null): void {
    this.petsRequest?.unsubscribe();
    this.pets.set([]);
    const headquarterId = this.session.headquarterId();
    const current = this.editing();
    const currentPet: SelectOption | null =
      current && current.tutorId === tutorId
        ? { id: current.petId, label: current.petName ?? 'Mascota de la cita' }
        : null;

    if (!tutorId || !headquarterId) {
      if (currentPet) {
        this.pets.set([currentPet]);
        this.form.controls.petId.setValue(currentPet.id);
      }
      return;
    }

    this.loadingPets.set(true);
    this.petsRequest = this.references.petsOfTutor(tutorId, headquarterId).subscribe({
      next: (pets) => {
        const keepCurrent = currentPet && !pets.some((pet) => pet.id === currentPet.id);
        const options = keepCurrent ? [...pets, currentPet] : pets;
        this.pets.set(options);
        this.form.controls.petId.setValue(
          selectedPetId && options.some((pet) => pet.id === selectedPetId) ? selectedPetId : null,
        );
        this.loadingPets.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loadingPets.set(false);
        this.error.set(appointmentErrorMessage(error, 'No se pudieron cargar las mascotas'));
      },
    });
  }
}

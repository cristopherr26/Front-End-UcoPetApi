import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { Doctor } from '../../../models/doctor/doctor.model';
import { Specialtie } from '../../../models/specialtie/specialtie.model';
import {
  SpecialtieDoctor,
  SpecialtieDoctorRequest,
} from '../../../models/specialtie/specialtie-doctor.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SessionService } from '../../../services/session/session.service';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { SpecialtieDoctorService } from '../../../services/specialtie/specialtie-doctor.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  NOTES_MAX,
  certificateUrlRule,
  doctorLabel,
  statusLabel,
  statusTag,
} from '../../../utils/specialtie/form-rules';

interface Option {
  id: string;
  label: string;
}

@Component({
  selector: 'app-specialtie-doctor-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './specialtie-doctor-form.html',
})
export class SpecialtieDoctorForm implements OnInit {
  private readonly relationService = inject(SpecialtieDoctorService);
  private readonly doctorService = inject(DoctorService);
  private readonly specialtieService = inject(SpecialtieService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly session = inject(SessionService);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly notesMax = NOTES_MAX;
  protected readonly statusLabel = statusLabel;
  protected readonly statusTag = statusTag;

  protected readonly form = this.fb.group({
    doctor: ['', Validators.required],
    specialtie: ['', Validators.required],
    certificateUrl: ['', certificateUrlRule],
    certificateNotes: ['', Validators.maxLength(NOTES_MAX)],
  });

  // Asignación en edición (null al crear)
  protected readonly current = signal<SpecialtieDoctor | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  // Cambió la URL respecto a la guardada (para avisar que vuelve a Pendiente)
  protected readonly certificateChanged = signal(false);

  // Solo médicos de la sede activa: la asignación queda en la sede del médico
  private readonly doctors = signal<Doctor[]>([]);
  private readonly specialties = signal<Specialtie[]>([]);
  protected readonly doctorOptions = signal<Option[]>([]);

  // Solo especialidades activas (y la actual, si se está editando una que se desactivó)
  protected readonly specialtieOptions = computed<Option[]>(() => {
    const currentId = this.current()?.specialtie;
    return this.specialties()
      .filter((item) => item.active !== false || item.id === currentId)
      .map((item) => ({
        id: item.id,
        label: item.active === false ? `${item.name} (inactiva)` : item.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  // Al editar algo ya revisado, cambiar el certificado reinicia la verificación
  protected readonly resetsVerification = computed(
    () => this.current() !== null && this.current()?.status !== 'PENDING',
  );

  ngOnInit(): void {
    this.form.controls.certificateUrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const saved = this.current()?.certificateUrl ?? '';
        this.certificateChanged.set(this.current() !== null && value.trim() !== saved.trim());
      });

    const headquarterId = this.session.headquarterId();
    if (headquarterId === null) {
      this.loading.set(false);
      this.error.set('Elige una sede en el menú superior antes de asignar especialidades');
      this.form.disable();
      return;
    }
    forkJoin({
      doctors: this.doctorService.list(headquarterId),
      persons: this.personLookup.byId(),
      specialties: this.specialtieService.list(),
    }).subscribe({
      next: ({ doctors, persons, specialties }) => {
        this.doctors.set(doctors);
        this.specialties.set(specialties);
        this.doctorOptions.set(
          doctors
            .filter((doctor): doctor is Doctor & { id: string } => !!doctor.id)
            .map((doctor) => ({
              id: doctor.id,
              label: `${doctorLabel(doctor.id, doctors, persons)} · Tarjeta ${doctor.licenseNumber}`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es')),
        );
        this.loading.set(false);
        // Los campos aparecen al terminar la carga: el foco va al primero que importa
        setTimeout(() =>
          document.getElementById(this.current() ? 'assignment-url' : 'assignment-doctor')?.focus(),
        );
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudieron cargar los veterinarios'));
      },
    });
  }

  edit(relation: SpecialtieDoctor): void {
    this.current.set(relation);
    this.form.setValue({
      doctor: relation.doctor,
      specialtie: relation.specialtie,
      certificateUrl: relation.certificateUrl ?? '',
      certificateNotes: relation.certificateNotes ?? '',
    });
  }

  presetDoctor(doctorId: string): void {
    this.form.patchValue({ doctor: doctorId });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const doctor = this.doctors().find((item) => item.id === value.doctor);
    if (!doctor) {
      this.error.set('El veterinario elegido no pertenece a la sede activa');
      return;
    }
    const request: SpecialtieDoctorRequest = {
      doctor: value.doctor,
      specialtie: value.specialtie,
      headquarterId: doctor.headquarterId,
      certificateUrl: value.certificateUrl,
      certificateNotes: value.certificateNotes,
    };
    const id = this.current()?.id ?? null;
    this.saving.set(true);
    this.error.set(null);
    (id
      ? this.relationService.update(id, request)
      : this.relationService.create(request)
    ).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar la asignación'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  protected hasError(field: keyof typeof this.form.controls, code: string): boolean {
    return this.form.controls[field].hasError(code);
  }
}

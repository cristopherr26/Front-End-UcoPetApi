import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, forkJoin, of } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { Doctor } from '../../../models/doctor/doctor.model';
import { SpecialtieDoctor } from '../../../models/doctor/specialtie-doctor.model';
import { Specialtie } from '../../../models/specialtie/specialtie.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SpecialtieDoctorService } from '../../../services/doctor/specialtie-doctor.service';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { UUID_RULES, personName, shortId } from '../../../utils/doctor/form-rules';

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
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = this.fb.group({
    doctor: ['', Validators.required],
    specialtie: ['', UUID_RULES],
  });
  protected readonly relationId = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly specialties = signal<Specialtie[]>([]);
  private readonly currentSpecialtie = signal('');
  protected readonly doctorOptions = signal<{ id: string; label: string }[]>([]);

  // Mientras Especialidades no tenga su lista, se pega el id de la especialidad.
  protected readonly canPickSpecialtie = computed(() => this.specialties().length > 0);
  // Solo se ofrecen las especialidades activas (y la actual, si se está editando).
  protected readonly specialtieOptions = computed(() =>
    this.specialties()
      .filter((item) => item.active !== false || item.id === this.currentSpecialtie())
      .map((item) => ({ id: item.id, label: item.name || `Especialidad ${shortId(item.id)}…` }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  ngOnInit(): void {
    forkJoin({
      doctors: this.doctorService.list(),
      persons: this.personLookup.byId(),
      specialties: this.specialtieService.list().pipe(catchError(() => of([] as Specialtie[]))),
    }).subscribe({
      next: ({ doctors, persons, specialties }) => {
        this.specialties.set(specialties);
        this.doctorOptions.set(
          doctors
            .filter((doctor): doctor is Doctor & { id: string } => !!doctor.id)
            .map((doctor) => ({
              id: doctor.id,
              label: `${personName(persons.get(doctor.idPerson)) ?? `Persona ${shortId(doctor.idPerson)}…`} · ${doctor.licenseNumber}`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudieron cargar los médicos'));
      },
    });
  }

  edit(relation: SpecialtieDoctor): void {
    this.relationId.set(relation.id ?? null);
    this.currentSpecialtie.set(relation.specialtie);
    this.form.patchValue({ doctor: relation.doctor, specialtie: relation.specialtie });
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
    const relation: SpecialtieDoctor = {
      doctor: value.doctor,
      specialtie: value.specialtie.trim(),
    };
    const id = this.relationId();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.relationService.update(id, relation) : this.relationService.create(relation)).subscribe({
      next: (saved) => this.modal.close({ ...relation, ...saved }),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar la especialidad del médico'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
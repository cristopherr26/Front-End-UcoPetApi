import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { Doctor } from '../../../models/doctor/doctor.model';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { PersonSummary } from '../../../models/person/person.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SessionService } from '../../../services/session/session.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  UUID_RULES,
  licenseNumberRule,
  personName,
  shortId,
} from '../../../utils/doctor/form-rules';

@Component({
  selector: 'app-doctor-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './doctor-form.html',
})
export class DoctorForm implements OnInit {
  private readonly doctorService = inject(DoctorService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = this.fb.group({
    idPerson: ['', UUID_RULES],
    licenseNumber: ['', licenseNumberRule],
    // Por defecto, la sede activa del menú superior.
    headquarterId: [this.session.headquarterId() ?? '', Validators.required],
  });
  protected readonly doctorId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly persons = signal<PersonSummary[]>([]);
  private readonly currentPerson = signal('');
  private readonly allHeadquarters = signal<Headquarter[]>([]);
  private readonly currentHeadquarterId = signal<string | null>(null);

  // Si la API deja leer personas se elige de una lista; si no, se pega el id.
  protected readonly canPick = computed(() => this.persons().length > 0);
  protected readonly options = computed(() => {
    const options = this.persons().map((person) => ({
      id: person.id,
      label: this.label(person),
    }));
    const current = this.currentPerson();
    if (current !== '' && !options.some((option) => option.id === current)) {
      options.unshift({ id: current, label: `Persona ${shortId(current)}…` });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  });

  // Solo sedes activas; si el médico ya está en una dada de baja, se conserva para poder verla.
  protected readonly headquarters = computed(() =>
    this.allHeadquarters()
      .filter(
        (headquarter) => headquarter.isActive || headquarter.id === this.currentHeadquarterId(),
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  ngOnInit(): void {
    this.personLookup.byId().subscribe((persons) => this.persons.set([...persons.values()]));
    this.headquarterService.list().subscribe({
      next: (headquarters) => this.allHeadquarters.set(headquarters),
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'No se pudieron cargar las sedes')),
    });
  }

  edit(doctor: Doctor): void {
    this.doctorId.set(doctor.id ?? null);
    this.currentPerson.set(doctor.idPerson);
    this.currentHeadquarterId.set(doctor.headquarterId);
    this.form.patchValue({
      idPerson: doctor.idPerson,
      licenseNumber: doctor.licenseNumber,
      headquarterId: doctor.headquarterId,
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const doctor: Doctor = {
      idPerson: value.idPerson.trim(),
      licenseNumber: value.licenseNumber.trim(),
      headquarterId: value.headquarterId,
    };
    const id = this.doctorId();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.doctorService.update(id, doctor) : this.doctorService.create(doctor)).subscribe({
      next: (saved) => this.modal.close({ ...doctor, ...saved }),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar el médico'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  protected licenseMessage(): string {
    const errors = this.form.controls.licenseNumber.errors;
    if (errors?.['licenseLength']) {
      return 'La tarjeta profesional debe tener entre 4 y 30 caracteres';
    }
    if (errors?.['licenseChars']) {
      return 'Solo puede tener letras, números y guiones';
    }
    return 'La tarjeta profesional es obligatoria';
  }

  private label(person: PersonSummary): string {
    const name = personName(person) ?? `Persona ${shortId(person.id)}…`;
    return person.documentNumber ? `${name} · ${person.documentNumber}` : name;
  }
}
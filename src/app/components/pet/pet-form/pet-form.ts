import { Component, OnInit, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { catchError, forkJoin, of } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';

import {
  Pet,
  PetGender,
  PetData,
  CreatePetRequest
} from '../../../models/pet/pet.model';


import { Headquarter } from '../../../models/headquarter/headquarter.model';

import { PetService } from '../../../services/pet/pet.service';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';

import { TutorPet } from '../../../models/tutor-pet/tutor-pet.model';
import { HealthPlan } from '../../../models/health-plan/health-plan.model';
import { PersonSummary } from '../../../models/person/person.model';

import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';

import { personName, shortId } from '../../../utils/doctor/form-rules';

import { apiErrorMessage } from '../../../utils/shared/api-error';

import {
  NAME_RULES,
  BREED_RULES,
  SPECIES_RULES,
  GENDER_RULES,
  BIRTH_DATE_RULES,
  PHOTO_URL_RULES,
  trimValue
} from '../../../utils/pet/form-rules';

@Component({
  selector: 'app-pet-form',
  imports: [
    ReactiveFormsModule,
    ModalFrame
  ],
  templateUrl: './pet-form.html'
})
export class PetForm implements OnInit {

  private readonly petService = inject(PetService);

  private readonly tutorPetService = inject(TutorPetService);

  private readonly healthPlanService = inject(HealthPlanService);

  private readonly personLookup = inject(PersonLookupService);

  private readonly headquarterService = inject(HeadquarterService);

  private readonly session = inject(SessionService);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly modal = inject(NgbActiveModal);

  // Catálogos para los desplegables
  protected readonly tutors = signal<TutorPet[]>([]);

  protected readonly policies = signal<HealthPlan[]>([]);

  private readonly persons = signal<Map<string, PersonSummary>>(new Map());

  protected readonly headquarters = signal<Headquarter[]>([]);

  // Identificador de la mascota en edición
  protected readonly petId = signal<string | null>(null);

  // Estados del componente
  protected readonly loading = signal(false);

  protected readonly saving = signal(false);

  protected readonly error = signal<string | null>(null);

  // Formulario reactivo.
  protected readonly form = this.fb.group({

    name: ['', NAME_RULES],

    birthDate: ['', BIRTH_DATE_RULES],

    breed: ['', BREED_RULES],

    species: ['', SPECIES_RULES],

    gender: this.fb.control<PetGender | ''>('', GENDER_RULES),

    photoUrl: ['', PHOTO_URL_RULES],

    tutorId: ['', Validators.required],

    policyId: [''],

    headquarterId: ['', Validators.required]

  });

  ngOnInit(): void {

    this.loadCatalogs();

  }


// Cargar tutores, pólizas y sedes
    private loadCatalogs(): void {
    this.loading.set(true);

    forkJoin({
      tutors: this.tutorPetService.list().pipe(
        catchError(error => {
          console.error('Error cargando tutores:', error);
          return of([] as TutorPet[]);
        })
      ),

      policies: this.healthPlanService.getHealthPlans().pipe(
        catchError(error => {
          console.error('Error cargando planes de salud:', error);
          return of([] as HealthPlan[]);
        })
      ),

      persons: this.personLookup.byId(),

      headquarters: this.headquarterService.list().pipe(
        catchError(error => {
          console.error('Error cargando sedes:', error);
          return of([] as Headquarter[]);
        })
      )
    }).subscribe({
      next: ({ tutors, policies, persons, headquarters }) => {
        this.persons.set(persons);

        this.tutors.set(tutors.filter(tutor => persons.get(tutor.person)?.active !== false));

        // Mostrar únicamente los planes activos
        this.policies.set(
          policies.filter(policy => policy.status === 'ACTIVA')
        );

        // Mostrar únicamente las sedes activas
        const activeHeadquarters = headquarters.filter(
          headquarters => headquarters.isActive
        );

        this.headquarters.set(activeHeadquarters);

        // Seleccionar automáticamente la sede actual
        const selectedHeadquarter = this.session.headquarterId();

        if (selectedHeadquarter) {
          this.form.controls.headquarterId.setValue(selectedHeadquarter);
        }

        this.loading.set(false);
      },

      error: error => {
        console.error('Error cargando los catálogos:', error);
        this.loading.set(false);
      }
    });
  }

  protected tutorLabel(tutor: TutorPet): string {
    const person = this.persons().get(tutor.person);

    return personName(person) ?? `Persona ${shortId(tutor.person)}`;
  }


// Precargar los datos de una mascota para actualizar
  edit(pet: Pet): void {

    this.petId.set(pet.id);

    this.form.patchValue({

      name: pet.name,

      birthDate: pet.birthDate,

      breed: pet.breed,

      species: pet.species,

      gender: pet.gender,

      photoUrl: pet.photoUrl ?? '',

      tutorId: pet.tutorId,

      policyId: pet.policyId ?? '',

      headquarterId: pet.headquarterId

    });

  }


// Aplicar trim cuando el usuario termina de escribir

  protected trimField(
    field: 'name' | 'breed' | 'species' | 'photoUrl'
  ): void {

    const control = this.form.controls[field];

    control.setValue(trimValue(control.value));

    control.updateValueAndValidity();

  }

// Guardar mascota
// POST para crear y PUT para actualizar
  protected save(): void {

    // Normalizar los campos de texto
    this.trimField('name');

    this.trimField('breed');

    this.trimField('species');

    this.trimField('photoUrl');

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    const value = this.form.getRawValue();

    const petData: PetData = {

      name: value.name,

      birthDate: value.birthDate,

      breed: value.breed,

      species: value.species,

      gender: value.gender as PetGender,

      photoUrl: value.photoUrl || null,

      tutorId: value.tutorId,

      policyId: value.policyId || null,

      headquarterId: value.headquarterId

    };

    const id = this.petId();

    this.saving.set(true);

    this.error.set(null);

    if (id === null) {

      const request: CreatePetRequest = {

        ...petData,

        isActive: true

      };

      this.petService.create(request).subscribe({

        next: (saved) => {

          this.modal.close(saved);

        },

        error: (error: HttpErrorResponse) => {

          this.saving.set(false);

          this.error.set(
            apiErrorMessage(
              error,
              'No se pudo registrar la mascota'
            )
          );

        }

      });

    } else {

      this.petService.update(id, petData).subscribe({

        next: (saved) => {

          this.modal.close(saved);

        },

        error: (error: HttpErrorResponse) => {

          this.saving.set(false);

          this.error.set(
            apiErrorMessage(
              error,
              'No se pudo actualizar la mascota'
            )
          );

        }

      });

    }

  }


// Consultar si un campo tiene errores
  protected invalid(
    field: keyof typeof this.form.controls
  ): boolean {

    const control = this.form.controls[field];

    return control.touched && control.invalid;

  }

  protected hasError(
    field: keyof typeof this.form.controls,
    error: string
  ): boolean {

    const control = this.form.controls[field];

    return control.touched && control.hasError(error);

  }

}
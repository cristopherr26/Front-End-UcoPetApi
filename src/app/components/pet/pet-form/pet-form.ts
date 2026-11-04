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

import { PetOption } from '../../../models/pet/pet-option.model';

import { Headquarter } from '../../../models/headquarter/headquarter.model';

import { PetService } from '../../../services/pet/pet.service';
import { PetReferenceService } from '../../../services/pet/pet-reference.service';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';

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

  private readonly referenceService = inject(PetReferenceService);

  private readonly headquarterService = inject(HeadquarterService);

  private readonly session = inject(SessionService);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly modal = inject(NgbActiveModal);

  // Catálogos para los desplegables
  protected readonly tutors = signal<PetOption[]>([]);

  protected readonly policies = signal<PetOption[]>([]);

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

    policyId: ['', Validators.required],

    headquarterId: ['', Validators.required]

  });

  ngOnInit(): void {

    this.loadCatalogs();

  }


// Cargar tutores, pólizas y sedes
  private loadCatalogs(): void {
    forkJoin({
      tutors: this.referenceService.getTutors().pipe(
        catchError(error => {
          console.error('Error cargando tutores:', error);
          return of([]);
        })
      ),

      policies: this.referenceService.getPolicies().pipe(
        catchError(error => {
          console.error('Error cargando planes de salud:', error);
          return of([]);
        })
      ),

      headquarters: this.headquarterService.list().pipe(
        catchError(error => {
          console.error('Error cargando sedes:', error);
          return of([]);
        })
      )
    }).subscribe(({ tutors, policies, headquarters }) => {
      this.tutors.set(tutors);
      this.policies.set(policies);

      const activeHeadquarters = headquarters.filter(
        headquarters => headquarters.isActive
      );

      this.headquarters.set(activeHeadquarters);

      const selectedHeadquarter = this.session.headquarterId();

      if (selectedHeadquarter) {
        this.form.controls.headquarterId.setValue(selectedHeadquarter);
      }
    });
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

      photoUrl: pet.photoUrl,

      tutorId: pet.tutorId,

      policyId: pet.policyId,

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

      photoUrl: value.photoUrl,

      tutorId: value.tutorId,

      policyId: value.policyId,

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
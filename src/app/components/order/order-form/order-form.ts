import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { catchError, forkJoin, of } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';

import { Pet } from '../../../models/pet/pet.model';
import { Procedure } from '../../../models/procedure/procedure.model';

import { OrderService } from '../../../services/order/order.service';
import { ProcedureService } from '../../../services/procedure/procedure.service';
import { PetService } from '../../../services/pet/pet.service';
import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SessionService } from '../../../services/session/session.service';

import { apiErrorMessage } from '../../../utils/shared/api-error';

// Opción del selector de tutor: id de TutorPet (para buscar mascotas)
// e id de la persona (lo que exige la orden como tutorId)
export interface TutorOption {
  tutorPetId: string;
  personId: string;
  name: string;
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './order-form.html',
})
export class OrderForm implements OnInit {
  private readonly orderService = inject(OrderService);

  private readonly procedureService = inject(ProcedureService);

  private readonly petService = inject(PetService);

  private readonly tutorPetService = inject(TutorPetService);

  private readonly personLookup = inject(PersonLookupService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly session = inject(SessionService);

  protected readonly modal = inject(NgbActiveModal);

  // Catálogos para los desplegables
  protected readonly tutors = signal<TutorOption[]>([]);

  protected readonly pets = signal<Pet[]>([]);

  protected readonly procedures = signal<Procedure[]>([]);

  // Estados del componente
  protected readonly loading = signal(false);

  protected readonly loadingPets = signal(false);

  protected readonly saving = signal(false);

  protected readonly error = signal<string | null>(null);

  protected readonly petsError = signal<string | null>(null);

  // Formulario reactivo: tutor -> mascota (depende del tutor) -> procedimiento
  protected readonly form = this.fb.group({
    tutorPetId: ['', Validators.required],

    petId: [{ value: '', disabled: true }, Validators.required],

    procedureId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadCatalogs();

    // Cada vez que cambia el tutor se reinicia la mascota y se cargan las suyas
    this.form.controls.tutorPetId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tutorPetId) => this.loadPets(tutorPetId));
  }

  // Cargar tutores (con el nombre de la persona) y procedimientos activos
  private loadCatalogs(): void {
    this.loading.set(true);

    forkJoin({
      tutors: this.tutorPetService.list().pipe(
        catchError((error) => {
          console.error('Error cargando tutores:', error);
          return of([]);
        }),
      ),

      persons: this.personLookup.byId(),

      procedures: this.procedureService.getActive().pipe(
        catchError((error) => {
          console.error('Error cargando procedimientos:', error);
          return of([] as Procedure[]);
        }),
      ),
    }).subscribe(({ tutors, persons, procedures }) => {
      this.tutors.set(
        tutors
          .filter((tutor) => persons.get(tutor.person)?.active !== false)
          .map((tutor) => {
            const person = persons.get(tutor.person);
            return {
              tutorPetId: tutor.id,
              personId: tutor.person,
              name: person ? `${person.firstName} ${person.lastName}` : `Tutor (${tutor.person})`,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
      );

      this.procedures.set(procedures);

      this.loading.set(false);
    });
  }

  // Mascotas del tutor en la sede activa
  private loadPets(tutorPetId: string): void {
    const petControl = this.form.controls.petId;

    petControl.reset('');
    petControl.disable();

    this.pets.set([]);
    this.petsError.set(null);

    const headquarterId = this.session.headquarterId();

    // Sin sede activa el backend no permite listar mascotas
    if (!tutorPetId || headquarterId === null) {
      return;
    }

    this.loadingPets.set(true);

    this.petService.getByTutor(tutorPetId, headquarterId).subscribe({
      next: (pets) => {
        this.pets.set(pets.filter((pet) => pet.active !== false));

        this.loadingPets.set(false);

        petControl.enable();
      },

      error: (error: HttpErrorResponse) => {
        this.loadingPets.set(false);

        this.petsError.set(apiErrorMessage(error, 'No se pudieron cargar las mascotas del tutor'));
      },
    });
  }

  // Texto que se muestra en el selector de procedimientos
  protected procedureLabel(procedure: Procedure): string {
    return `${procedure.code} — ${procedure.type}`;
  }

  // Guardar orden (POST)
  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const value = this.form.getRawValue();

    const tutor = this.tutors().find((option) => option.tutorPetId === value.tutorPetId);

    if (!tutor) {
      this.error.set('Selecciona un tutor válido');

      return;
    }

    this.saving.set(true);

    this.error.set(null);

    this.orderService
      .create({
        // La orden guarda el id de la PERSONA del tutor, no el de TutorPet
        tutorId: tutor.personId,
        petId: value.petId,
        procedureId: value.procedureId,
      })
      .subscribe({
        next: (order) => {
          this.modal.close(order);
        },

        error: (error: HttpErrorResponse) => {
          this.saving.set(false);

          this.error.set(apiErrorMessage(error, 'No se pudo crear la orden'));
        },
      });
  }

  // Consultar si un campo tiene errores
  protected invalid(field: 'tutorPetId' | 'petId' | 'procedureId'): boolean {
    const control = this.form.controls[field];

    return control.touched && control.invalid;
  }
}

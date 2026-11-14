import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';

import { Pet } from '../../../models/pet/pet.model';
import { TutorPet } from '../../../models/tutor-pet/tutor-pet.model';
import { HealthPlan } from '../../../models/health-plan/health-plan.model';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { PersonSummary } from '../../../models/person/person.model';
import {SaleOrder, SaleOrderRequest,} from '../../../models/sale/sale.model';

import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { PetService } from '../../../services/pet/pet.service';
import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { SaleService } from '../../../services/sale/sale.service';
import { SessionService } from '../../../services/session/session.service';

import { apiErrorMessage } from '../../../utils/shared/api-error';
import { ModalFrame } from '../../shared/modal-frame';

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

@Component({
  selector: 'app-sale-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './sale-form.html',
})
export class SaleForm {
  protected readonly modal = inject(NgbActiveModal);

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sales = inject(SaleService);
  private readonly session = inject(SessionService);
  private readonly petsService = inject(PetService);
  private readonly tutorsService = inject(TutorPetService);
  private readonly personsService = inject(PersonLookupService);
  private readonly plansService = inject(HealthPlanService);
  private readonly headquartersService = inject(HeadquarterService);

  protected readonly form = this.fb.group({
    clientID: ['', Validators.required],
    petId: ['', Validators.required],
    healthPlanId: [''],
    comment: ['', Validators.maxLength(255)],
  });

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly tutors = signal<TutorPet[]>([]);
  protected readonly pets = signal<Pet[]>([]);
  protected readonly plans = signal<HealthPlan[]>([]);
  protected readonly headquarters = signal<Headquarter[]>([]);

  protected readonly persons = signal<Map<string, PersonSummary>>(
    new Map(),
  );

  protected readonly clientId = signal('');
  protected readonly selectedPetId = signal('');

  protected readonly headquarter = this.session.headquarterId;
  protected readonly existing = signal<SaleOrder | null>(null);

  protected readonly selectedHeadquarterId = computed(
    () => this.existing()?.headquarterId ?? this.headquarter(),
  );

  protected readonly headquarterName = computed(() => {
    const id = this.selectedHeadquarterId();

    if (!id) {
      return 'Sin sede seleccionada';
    }

    return (
      this.headquarters().find((hq) => hq.id === id)?.name
      ?? 'Sede no disponible'
    );
  });

  protected readonly availablePets = computed(() => {
    const tutor = this.tutors().find(
      (t) => t.id === this.clientId(),
    );

    return tutor
      ? this.pets().filter(
        (pet) => pet.tutorId === tutor.id && pet.active,
      )
      : [];
  });

  protected readonly selectedPet = computed(() =>
    this.availablePets().find(
      (pet) => pet.id === this.selectedPetId(),
    ) ?? null,
  );

  protected readonly activePlans = computed(() =>
    this.plans().filter(
      (plan) =>
        plan.status === 'ACTIVA' &&
        !plan.deleted &&
        !!plan.id,
    ),
  );

  protected readonly assignedPolicyId = computed(() => {
    const id = this.selectedPet()?.policyId;

    return id && id !== EMPTY_UUID ? id : null;
  });

  protected readonly assignedActivePlan = computed(() => {
    const id = this.assignedPolicyId();

    return id
      ? this.activePlans().find((plan) => plan.id === id) ?? null
      : null;
  });

  protected readonly canSelectPolicy = computed(
    () =>
      this.selectedPet() !== null &&
      this.assignedPolicyId() === null,
  );


  protected readonly invalidAssignedPolicy = computed(
    () =>
      this.assignedPolicyId() !== null &&
      this.assignedActivePlan() === null,
  );

  protected readonly assignedPolicyName = computed(
    () => this.assignedActivePlan()?.name ?? 'Sin póliza',
  );

  constructor() {
    this.form.controls.healthPlanId.disable({
      emitEvent: false,
    });

    this.loadReferences();
  }

  private loadReferences(): void {
    const hq = this.selectedHeadquarterId();

    if (!hq) {
      this.loading.set(false);
      this.error.set(
        'Selecciona una sede antes de crear o modificar una orden.',
      );
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      tutors: this.tutorsService.list(),
      pets: this.petsService.getByHeadquarter({
        headquarterId: hq,
        isActive: true,
      }),
      plans: this.plansService.getHealthPlans(),
      persons: this.personsService.byId(),
      headquarters: this.headquartersService.list(),
    }).subscribe({
      next: ({
               tutors,
               pets,
               plans,
               persons,
               headquarters,
             }) => {
        this.tutors.set(tutors);
        this.pets.set(pets);
        this.plans.set(plans);
        this.persons.set(persons);
        this.headquarters.set(headquarters);

        this.loading.set(false);


        this.syncPolicyWithPet(true);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(
          apiErrorMessage(
            err,
            'No se pudieron cargar los datos de la venta',
          ),
        );
        this.loading.set(false);
      },
    });
  }

  edit(sale: SaleOrder): void {
    this.existing.set(sale);

    this.clientId.set(sale.clientID);
    this.selectedPetId.set(sale.petId);

    const healthPlanId =
      sale.healthPlanId && sale.healthPlanId !== EMPTY_UUID
        ? sale.healthPlanId
        : '';

    this.form.patchValue({
      clientID: sale.clientID,
      petId: sale.petId,
      healthPlanId,
      comment: sale.comment ?? '',
    });


    if (sale.headquarterId !== this.headquarter()) {
      this.loading.set(true);

      this.petsService.getByHeadquarter({
        headquarterId: sale.headquarterId,
        isActive: true,
      }).subscribe({
        next: (pets) => {
          this.pets.set(pets);
          this.loading.set(false);

          if (this.plans().length > 0) {
            this.syncPolicyWithPet(true);
          }
        },

        error: (err: HttpErrorResponse) => {
          this.error.set(
            apiErrorMessage(
              err,
              'No se pudieron cargar las mascotas de la sede',
            ),
          );
          this.loading.set(false);
        },
      });
    } else if (!this.loading()) {
      this.syncPolicyWithPet(true);
    }
  }

  protected personLabel(id: string): string {
    const person = this.persons().get(id);

    return person
      ? `${person.firstName} ${person.lastName}`.trim()
      : 'Persona no disponible';
  }

  protected changeClient(id: string): void {
    this.clientId.set(id);
    this.selectedPetId.set('');

    this.form.controls.petId.setValue('');
    this.form.controls.healthPlanId.setValue('');

    this.form.controls.healthPlanId.disable({
      emitEvent: false,
    });
  }


  protected changePet(id: string): void {
    this.selectedPetId.set(id);
    this.syncPolicyWithPet(false);
  }

  private syncPolicyWithPet(
    preserveExistingSelection: boolean,
  ): void {
    const control = this.form.controls.healthPlanId;
    const pet = this.selectedPet();

    if (!pet) {
      control.setValue('');
      control.disable({ emitEvent: false });
      return;
    }

    const assignedId = this.assignedPolicyId();

    if (assignedId) {

      const plan = this.assignedActivePlan();

      control.setValue(plan?.id ?? '');
      control.disable({ emitEvent: false });
      return;
    }


    control.enable({ emitEvent: false });

    const currentValue = control.value;
    const isValidCurrentSelection = this.activePlans().some(
      (plan) => plan.id === currentValue,
    );

    if (
      preserveExistingSelection &&
      isValidCurrentSelection
    ) {
      return;
    }

    control.setValue('');
  }

  protected save(): void {
    const headquarterId = this.selectedHeadquarterId();
    const pet = this.selectedPet();

    if (
      this.form.invalid ||
      !headquarterId ||
      !pet ||
      this.loading() ||
      this.saving()
    ) {
      this.form.markAllAsTouched();

      if (!pet && this.form.controls.petId.value) {
        this.error.set(
          'La mascota seleccionada no corresponde al tutor y sede de esta venta.',
        );
      }

      return;
    }

    const value = this.form.getRawValue();


    const assignedId = this.assignedPolicyId();
    const activeAssigned = this.assignedActivePlan();

    let healthPlanId = '';

    if (assignedId) {
      healthPlanId = activeAssigned?.id ?? '';
    } else if (value.healthPlanId) {
      const validPlan = this.activePlans().some(
        (plan) => plan.id === value.healthPlanId,
      );

      if (!validPlan) {
        this.error.set(
          'La póliza seleccionada no está activa.',
        );
        return;
      }

      healthPlanId = value.healthPlanId;
    }

    const request: SaleOrderRequest = {
      headquarterId,
      clientID: value.clientID,
      petId: value.petId,
      comment: value.comment.trim(),

      ...(healthPlanId ? { healthPlanId } : {}),
    };

    this.error.set(null);
    this.saving.set(true);

    const current = this.existing();

    const operation = current
      ? this.sales.update(current.id, request)
      : this.sales.create(request);

    operation.subscribe({
      next: (sale) => {
        this.modal.close(sale);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(
          apiErrorMessage(
            err,
            'No se pudo guardar la venta',
          ),
        );
        this.saving.set(false);
      },
    });
  }
}

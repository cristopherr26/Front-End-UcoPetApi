
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import {
  PayMethod,
  PetOption,
  Receipt,
  ReceiptRequest,
  TutorOption,
} from '../../../models/receipts/receipt.model';

/**
 * Obtiene la fecha y hora local para el input datetime-local.
 * No utiliza UTC para evitar cambios de hora al enviar los datos.
 */
function currentLocalDateTime(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Convierte la fecha del formulario al formato LocalDateTime
 * esperado por el backend.
 */
function toApiDate(value: string): string {
  const date = value || currentLocalDateTime();

  return date.length === 16 ? `${date}:00` : date.slice(0, 19);
}

/**
 * Convierte la fecha recibida de la API al formato del input.
 */
function toInputDate(value: string): string {
  return value.slice(0, 16);
}

@Component({
  selector: 'app-receipt-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './receipt-form.html',
  styleUrl: './receipt-form.scss',
})
export class ReceiptForm {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly payMethods = signal<PayMethod[]>([]);
  protected readonly tutors = signal<TutorOption[]>([]);
  protected readonly receipt = signal<Receipt | null>(null);

  private readonly allPets = signal<PetOption[]>([]);
  private readonly tutorId = signal('');

  protected readonly form = this.fb.group({
    tutorId: ['', Validators.required],
    petId: [''],
    concept: ['', [Validators.required, Validators.maxLength(255)]],
    amount: this.fb.control<number | null>(
      null,
      [Validators.required, Validators.min(0.01)],
    ),
    payMethodId: this.fb.control<string | null>(
      null,
      Validators.required,
    ),
    date: [currentLocalDateTime(), Validators.required],
  });

  protected readonly sortedTutors = computed(() =>
    [...this.tutors()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  /**
   * Solo muestra las mascotas pertenecientes al tutor seleccionado.
   * También conserva una mascota inactiva si ya estaba asociada
   * al recibo que se está editando.
   */
  protected readonly pets = computed(() => {
    const selectedTutorId = this.tutorId();
    const currentPetId = this.receipt()?.petId ?? null;

    return this.allPets()
      .filter(
        (pet) =>
          pet.tutorId === selectedTutorId &&
          (pet.active || pet.id === currentPetId),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    this.form.controls.tutorId.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((tutorId) => {
        this.tutorId.set(tutorId);

        // Al cambiar de tutor se limpia la mascota seleccionada.
        this.form.controls.petId.setValue('');
      });
  }

  /**
   * Inicializa el formulario al abrir el modal.
   * Recibe null cuando se está creando un recibo.
   */
  start(
    payMethods: PayMethod[],
    tutors: TutorOption[],
    pets: PetOption[],
    receipt: Receipt | null,
  ): void {
    this.payMethods.set(payMethods);
    this.tutors.set(tutors);
    this.allPets.set(pets);
    this.receipt.set(receipt);

    this.tutorId.set(receipt?.tutorId ?? '');

    this.form.reset({
      tutorId: receipt?.tutorId ?? '',
      petId: receipt?.petId ?? '',
      concept: receipt?.concept ?? '',
      amount: receipt?.amount ?? null,
      payMethodId: receipt?.payMethodId ?? null,
      date: receipt
        ? toInputDate(receipt.date)
        : currentLocalDateTime(),
    });
  }

  protected save(): void {
    // Un recibo anulado no puede modificarse.
    if (this.receipt()?.state === 'CANCELLED') {
      return;
    }

    // Si el usuario deja la fecha vacía, se utiliza la fecha actual.
    if (this.form.controls.date.value === '') {
      this.form.controls.date.setValue(currentLocalDateTime());
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const request: ReceiptRequest = {
      tutorId: value.tutorId,
      petId: value.petId === '' ? null : value.petId,
      concept: value.concept.trim(),
      amount: value.amount as number,
      payMethodId: value.payMethodId as string,
      date: toApiDate(value.date),
    };

    this.modal.close(request);
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];

    return control.touched && control.invalid;
  }
}

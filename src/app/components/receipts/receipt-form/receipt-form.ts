import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import {
  PayMethod,
  PetOption,
  Receipt,
  ReceiptRequest,
  TutorOption,
} from '../../../models/receipts/receipt.model';

/** `datetime-local` entrega "2026-11-07T14:30"; la API espera segundos: "2026-11-07T14:30:00". */
function toApiDate(value: string): string | null {
  if (value === '') {
    return null;
  }
  return value.length === 16 ? `${value}:00` : value.slice(0, 19);
}

/** La API devuelve "2026-11-07T14:30:00(.123)"; el input solo acepta hasta los minutos. */
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
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payMethodId: this.fb.control<string | null>(null, Validators.required),
    date: [''],
  });

  protected readonly sortedTutors = computed(() =>
    [...this.tutors()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  /** Solo las mascotas del tutor elegido; las dadas de baja salen únicamente si ya eran del recibo. */
  protected readonly pets = computed(() => {
    const tutorId = this.tutorId();
    const current = this.receipt()?.petId ?? null;
    return this.allPets()
      .filter((pet) => pet.tutorId === tutorId && (pet.active || pet.id === current))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    this.form.controls.tutorId.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((tutorId) => {
        this.tutorId.set(tutorId);
        this.form.controls.petId.setValue('');
      });
  }

  /** Lo llama la lista justo después de abrir el modal. `receipt` es null al crear. */
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
    if (receipt) {
      this.form.patchValue({
        tutorId: receipt.tutorId,
        concept: receipt.concept,
        amount: receipt.amount,
        payMethodId: receipt.payMethodId,
        date: toInputDate(receipt.date),
      });
      // patchValue de tutorId borra la mascota; se vuelve a poner cuando ya hay lista filtrada.
      this.form.controls.petId.setValue(receipt.petId ?? '');
    }
  }

  protected save(): void {
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

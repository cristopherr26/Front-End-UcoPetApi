import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { PersonSummary } from '../../../models/person/person.model';
import { TutorPet } from '../../../models/tutor-pet/tutor-pet.model';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  TutorPetFormGroup,
  toTutorPetRequest,
  tutorPetFormGroup,
} from '../../../utils/tutor-pet/form-rules';
import { personName, shortId } from '../../../utils/doctor/form-rules';

@Component({
  selector: 'app-tutor-pet-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './tutor-pet-form.html',
})
export class TutorPetForm implements OnInit {
  private readonly tutorPetService = inject(TutorPetService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form: TutorPetFormGroup = tutorPetFormGroup(this.fb);
  protected readonly tutorPetId = signal<string | null>(null);
  protected readonly persons = signal<PersonSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly currentPerson = signal('');

  protected readonly options = computed(() => {
    const options = this.persons()
      .filter((person) => person.active !== false)
      .map((person) => ({ id: person.id, label: this.label(person) }));
    const current = this.currentPerson();
    if (current !== '' && !options.some((option) => option.id === current)) {
      const person = this.persons().find((candidate) => candidate.id === current);
      options.unshift({
        id: current,
        label: person ? `${this.label(person)} · Inactiva` : `Persona ${shortId(current)}…`,
      });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  ngOnInit(): void {
    // La lista puede haber cambiado desde que se abrió el último formulario
    this.personLookup.refresh();
    this.personLookup.byIdStrict().subscribe({
      next: (persons) => {
        this.persons.set([...persons.values()]);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudieron cargar las personas'));
      },
    });
  }

  edit(tutor: TutorPet): void {
    this.tutorPetId.set(tutor.id);
    this.currentPerson.set(tutor.person);
    this.form.patchValue({ person: tutor.person });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.tutorPetId();
    const request = toTutorPetRequest(this.form);
    this.saving.set(true);
    this.error.set(null);
    (id
      ? this.tutorPetService.update(id, request)
      : this.tutorPetService.create(request)
    ).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar el tutor'));
      },
    });
  }

  protected invalid(): boolean {
    const control = this.form.controls.person;
    return control.touched && control.invalid;
  }

  private label(person: PersonSummary): string {
    const name = personName(person) ?? `Persona ${shortId(person.id)}…`;
    return person.documentNumber ? `${name} · ${person.documentNumber}` : name;
  }
}
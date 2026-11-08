import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { Space, SpaceChanges } from '../../../models/space/space.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';
import { SpaceService } from '../../../services/space/space.service';
import {
  CODE_RULES,
  DESCRIPTION_RULES,
  SPACE_TYPE_SUGGESTIONS,
  TYPE_RULES,
} from '../../../utils/space/form-rules';
import { spaceErrorMessage } from '../../../utils/space/space-error';

@Component({
  selector: 'app-space-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './space-form.html',
})
export class SpaceForm {
  private readonly spaceService = inject(SpaceService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly typeSuggestions = SPACE_TYPE_SUGGESTIONS;
  protected readonly form = this.fb.group({
    code: ['', CODE_RULES],
    type: ['', TYPE_RULES],
    description: ['', DESCRIPTION_RULES],
    headquarterId: this.fb.control<string | null>(
      this.session.headquarterId(),
      Validators.required,
    ),
  });
  protected readonly editing = signal<Space | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly headquarters = signal<Headquarter[]>([]);
  // Cuando crea solo muestra sedes activas y cuando edita se muestran las que ya tiene incluyendo inactivas
  protected readonly headquarterOptions = computed(() =>
    this.editing()
      ? this.headquarters()
      : this.headquarters().filter((headquarter) => headquarter.isActive),
  );

  constructor() {
    this.headquarterService
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (list) => this.headquarters.set(list),
        error: (error: HttpErrorResponse) =>
          this.error.set(spaceErrorMessage(error, 'No se pudieron cargar las sedes')),
      });
  }

  // El codigo y la sede no se pueden cambiar con el espacio creado
  edit(space: Space): void {
    this.editing.set(space);
    this.form.patchValue({
      code: space.code,
      type: space.type,
      description: space.description,
      headquarterId: space.headquarterId ?? null,
    });
    this.form.controls.code.disable();
    this.form.controls.headquarterId.disable();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const type = value.type.trim();
    const description = value.description.trim();
    const current = this.editing();

    let request: Observable<Space>;
    if (current?.id) {
      // Solo se mandan las claves que cambiaron para el PATCH 
      const changes: SpaceChanges = {};
      if (type !== current.type) {
        changes.type = type;
      }
      if (description !== current.description) {
        changes.description = description;
      }
      if (Object.keys(changes).length === 0) {
        this.modal.dismiss();
        return;
      }
      request = this.spaceService.patch(current.id, changes);
    } else {
      request = this.spaceService.create({
        code: value.code.trim(),
        type,
        description,
        headquarterId: value.headquarterId,
      });
    }

    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(spaceErrorMessage(error, 'No se pudo guardar el espacio'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
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
  Procedure,
  ProcedureData,
  ProcedureSpace
} from '../../../models/procedure/procedure.model';

import { CatalogItem } from '../../../models/product/catalog-item.model';

import { ProcedureService } from '../../../services/procedure/procedure.service';
import { CatalogService } from '../../../services/product/catalog.service';

import { apiErrorMessage } from '../../../utils/shared/api-error';

import {
    TYPE_RULES,
    DESCRIPTION_RULES,
    DURATION_RULES,
    QUANTITY_RULES,
    ITEMS_MIN_RULE,
    uniqueItemsValidator,
    trimValue
} from '../../../utils/procedure/form-rules';

// Cada fila de insumo: ítem del catálogo + cantidad
function createItemGroup(
    fb: NonNullableFormBuilder,
    itemId = '',
    quantity: number | null = 1
) {
    return fb.group({
    itemId: [itemId, Validators.required],
    quantity: fb.control<number | null>(quantity, QUANTITY_RULES)
    });
}

type ItemGroup = ReturnType<typeof createItemGroup>;

@Component({
    selector: 'app-procedure-form',
    imports: [
    ReactiveFormsModule,
    ModalFrame
    ],
    templateUrl: './procedure-form.html'
})
export class ProcedureForm implements OnInit {

  private readonly procedureService = inject(ProcedureService);

  private readonly catalogService = inject(CatalogService);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly modal = inject(NgbActiveModal);

  // Catálogos para los desplegables
  protected readonly spaces = signal<ProcedureSpace[]>([]);

  protected readonly catalogItems = signal<CatalogItem[]>([]);

  // Identificador del procedimiento en edición
  protected readonly procedureId = signal<string | null>(null);

    // Código del procedimiento en edición (el backend lo exige al actualizar)
    protected readonly procedureCode = signal<string | null>(null);

  // Estados del componente
  protected readonly loading = signal(false);

  protected readonly saving = signal(false);

  protected readonly error = signal<string | null>(null);

  // Formulario reactivo
  protected readonly form = this.fb.group({

    type: ['', TYPE_RULES],

    description: ['', DESCRIPTION_RULES],

    durationMinutes: this.fb.control<number | null>(null, DURATION_RULES),

    spaceId: ['', Validators.required],

    items: this.fb.array<ItemGroup>([], [ITEMS_MIN_RULE, uniqueItemsValidator])

  });

ngOnInit(): void {

    // Al crear, empezamos con una fila vacía (al editar ya viene cargada)
    if (this.items.length === 0) {

        this.addItem();

    }

    this.loadCatalogs();

}

  protected get items() {

    return this.form.controls.items;

  }

  // Cargar espacios activos e ítems del catálogo
  private loadCatalogs(): void {

    this.loading.set(true);

    forkJoin({
      spaces: this.procedureService.getActiveSpaces().pipe(
        catchError(error => {
          console.error('Error cargando espacios:', error);
          return of([] as ProcedureSpace[]);
        })
      ),

      items: this.catalogService.list({ active: true }).pipe(
        catchError(error => {
          console.error('Error cargando ítems del catálogo:', error);
          return of([] as CatalogItem[]);
        })
      )
    }).subscribe(({ spaces, items }) => {

      this.spaces.set(spaces);

      this.catalogItems.set(items);

      this.loading.set(false);

    });

  }

// Precargar los datos de un procedimiento para actualizar
edit(procedure: Procedure): void {

    this.procedureId.set(procedure.id);

    this.procedureCode.set(procedure.code);

    this.form.patchValue({

        type: procedure.type,

        description: procedure.description,

        durationMinutes: procedure.durationMinutes,

        spaceId: procedure.spaceId

    });

    this.items.clear();

    for (const item of procedure.defaultItems ?? []) {

        this.items.push(
            createItemGroup(this.fb, item.itemId, item.quantity)
        );

    }

}

  // Texto que se muestra en el selector de ítems
  protected itemLabel(item: CatalogItem): string {

    const type = item.type === 'PRODUCT' ? 'Producto' : 'Servicio';

    return `${item.name} (${type})`;

  }

  protected addItem(): void {

    this.items.push(createItemGroup(this.fb));

  }

  protected removeItem(index: number): void {

    this.items.removeAt(index);

  }

  // Aplicar trim cuando el usuario termina de escribir
  protected trimField(field: 'type' | 'description'): void {

    const control = this.form.controls[field];

    control.setValue(trimValue(control.value));

    control.updateValueAndValidity();

  }

  // Guardar procedimiento
  // POST para crear y PUT para actualizar
  protected save(): void {

    this.trimField('type');

    this.trimField('description');

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    const value = this.form.getRawValue();

    const data: ProcedureData = {

      type: value.type,

      description: value.description,

      durationMinutes: value.durationMinutes as number,

      spaceId: value.spaceId,

      defaultItems: value.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity as number
      }))

    };

    const id = this.procedureId();

    this.saving.set(true);

    this.error.set(null);

    const request$ = id === null
        ? this.procedureService.create(data)
        : this.procedureService.update(id, {
                ...data,
                code: this.procedureCode() ?? ''
            });

    const failMessage = id === null
      ? 'No se pudo crear el procedimiento'
      : 'No se pudo actualizar el procedimiento';

    request$.subscribe({

      next: (response) => {

        this.modal.close(response);

      },

      error: (error: HttpErrorResponse) => {

        this.saving.set(false);

        this.error.set(apiErrorMessage(error, failMessage));

      }

    });

  }

  // Consultar si un campo tiene errores
  protected invalid(
    field: 'type' | 'description' | 'durationMinutes' | 'spaceId'
  ): boolean {

    const control = this.form.controls[field];

    return control.touched && control.invalid;

  }

  protected hasError(
    field: 'type' | 'description' | 'durationMinutes' | 'spaceId',
    error: string
  ): boolean {

    const control = this.form.controls[field];

    return control.touched && control.hasError(error);

  }

  // Errores de una fila de insumos
  protected itemInvalid(
    index: number,
    field: 'itemId' | 'quantity'
  ): boolean {

    const control = this.items.at(index).controls[field];

    return control.touched && control.invalid;

  }

}
import { Component, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { timer } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { ProcedureService } from '../../../services/procedure/procedure.service';
import { ProcedureDialogs } from '../../../services/procedure/procedure-dialogs.service';

import {
Procedure,
ProcedureActionResponse,
ProcedureSpace
} from '../../../models/procedure/procedure.model';

import { SortHeader } from '../../../directives/shared/sort-header';
import { TablePager } from '../../shared/table-pager';

import { DurationPipe } from '../../../pipes/procedure/duration.pipe';

import { createTableState } from '../../../utils/shared/table-state';
import { apiErrorMessage } from '../../../utils/shared/api-error';

import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';

type StatusFilter = 'active' | 'inactive' | 'all';

@Component({
selector: 'app-procedure-list',
imports: [
    SortHeader,
    TablePager,
    RouterLink,
    DurationPipe
],
templateUrl: './procedure-list.html'
})
export class ProcedureList {

private readonly dialogs = inject(ProcedureDialogs);

private readonly procedureService = inject(ProcedureService);

private readonly toast = inject(ToastService);

private readonly confirm = injectConfirm();

protected readonly session = inject(SessionService);

// Filtros
protected readonly search = signal('');

protected readonly status = signal<StatusFilter>('active');

// Todos los procedimientos que devolvió el backend
private readonly all = signal<Procedure[]>([]);

// Los que quedan después de aplicar la búsqueda (los que ve la tabla)
protected readonly visible = signal<Procedure[]>([]);

// Espacios activos, para mostrar el código en lugar del UUID
private readonly spaces = signal<ProcedureSpace[]>([]);

// Estados de la consulta
protected readonly loading = signal(false);

protected readonly error = signal<string | null>(null);

// Permite recargar la tabla después de una operación
private readonly refresh = signal(0);

// Tabla y ordenamiento
protected readonly table = createTableState(this.visible, {
    sortKey: 'code',
    accessors: {
    code: (procedure) => procedure.code,
    type: (procedure) => procedure.type,
    description: (procedure) => procedure.description,
    durationMinutes: (procedure) => procedure.durationMinutes,
    active: (procedure) => procedure.active
    }
});

constructor() {

    // Los espacios se consultan una sola vez
    this.procedureService.getActiveSpaces().subscribe({
    next: (spaces) => this.spaces.set(spaces),
    error: () => this.spaces.set([])
    });

    // Cada vez que cambie el estado o la señal de actualización,
    // se vuelve a consultar el backend
    effect((onCleanup) => {

    const status = this.status();

    this.refresh();

    this.loading.set(true);

    this.error.set(null);

    const request$ =
        status === 'active'
        ? this.procedureService.getActive()
        : status === 'inactive'
            ? this.procedureService.getInactive()
            : this.procedureService.getAll();

    const subscription = request$.subscribe({

        next: (procedures) => {

        this.all.set(procedures);

        this.loading.set(false);

        },

        error: (error: HttpErrorResponse) => {

        this.all.set([]);

        this.loading.set(false);

        this.error.set(
            apiErrorMessage(
            error,
            'No se pudieron cargar los procedimientos'
            )
        );

        }

    });

    onCleanup(() => subscription.unsubscribe());

    });

    // Cada vez que cambie la búsqueda o los datos, se filtra en pantalla
    effect(() => {

    const text = this.search().trim().toLowerCase();

    const rows = this.all();

    if (!text) {

        this.visible.set(rows);

        return;

    }

    this.visible.set(
        rows.filter((procedure) =>
        [procedure.code, procedure.type, procedure.description]
            .some((value) => (value ?? '').toLowerCase().includes(text))
        )
    );

    });

}

// Cambiar el filtro de estado
protected setStatus(value: string): void {

    this.status.set(value as StatusFilter);

}

// Código del espacio a partir de su id
protected spaceLabel(spaceId: string): string {

    return this.spaces().find((space) => space.id === spaceId)?.code ?? '—';

}

// Abrir formulario de creación
protected create(): void {

    this.dialogs.procedure().subscribe((response) => {

    this.afterSave(response);

    });

}

// Abrir formulario de edición
protected edit(procedure: Procedure): void {

    this.dialogs.procedure(procedure).subscribe((response) => {

    this.afterSave(response);

    });

}

// Acciones posteriores a crear o actualizar
private afterSave(response: ProcedureActionResponse): void {

    this.toast.success(response.message);

    this.reloadSoon();

}

// Desactivar un procedimiento
protected deactivate(procedure: Procedure): void {

    this.confirm(
    'Desactivar procedimiento',
    `¿Estás seguro de que deseas desactivar "${procedure.code}"?`,
    'Desactivar'
    ).subscribe((confirmed) => {

    if (!confirmed) {

        return;

    }

    this.procedureService.deactivate(procedure.id).subscribe({

        next: (response) => {

        this.toast.success(response.message);

        this.reloadSoon();

        },

        error: (error: HttpErrorResponse) => {

        this.toast.error(
            apiErrorMessage(
            error,
            'No se pudo desactivar el procedimiento'
            )
        );

        }

    });

    });

}

// Activar un procedimiento
protected activate(procedure: Procedure): void {

    this.procedureService.activate(procedure.id).subscribe({

    next: (response) => {

        this.toast.success(response.message);

        this.reloadSoon();

    },

    error: (error: HttpErrorResponse) => {

        this.toast.error(
        apiErrorMessage(
            error,
            'No se pudo activar el procedimiento'
        )
        );

    }

    });

}

// El backend procesa de forma asíncrona (202), así que esperamos
// un momento antes de volver a consultar la lista
private reloadSoon(): void {

    timer(800).subscribe(() => {

    this.refresh.update((value) => value + 1);

    });

}

}
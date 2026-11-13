import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { catchError, forkJoin, of } from 'rxjs';

import { Procedure, ProcedureSpace } from '../../../models/procedure/procedure.model';
import { CatalogItem } from '../../../models/product/catalog-item.model';

import { ProcedureService } from '../../../services/procedure/procedure.service';
import { CatalogService } from '../../../services/product/catalog.service';

import { DurationPipe } from '../../../pipes/procedure/duration.pipe';

import { apiErrorMessage } from '../../../utils/shared/api-error';

@Component({
selector: 'app-procedure-detail',
imports: [RouterLink, DurationPipe],
templateUrl: './procedure-detail.html'
})
export class ProcedureDetail implements OnInit {

private readonly route = inject(ActivatedRoute);

private readonly procedureService = inject(ProcedureService);

private readonly catalogService = inject(CatalogService);

protected readonly procedure = signal<Procedure | null>(null);

protected readonly spaces = signal<ProcedureSpace[]>([]);

protected readonly catalogItems = signal<CatalogItem[]>([]);

protected readonly loading = signal(true);

protected readonly error = signal<string | null>(null);

ngOnInit(): void {

    // Aquí se lee el parámetro de ruta: el ":id" de la URL
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {

    this.error.set('No se indicó qué procedimiento mostrar');

    this.loading.set(false);

    return;

    }

    forkJoin({
    procedure: this.procedureService.getById(id),

    spaces: this.procedureService.getActiveSpaces().pipe(
        catchError(() => of([] as ProcedureSpace[]))
    ),

    items: this.catalogService.list().pipe(
        catchError(() => of([] as CatalogItem[]))
    )
    }).subscribe({

    next: ({ procedure, spaces, items }) => {

        this.procedure.set(procedure);

        this.spaces.set(spaces);

        this.catalogItems.set(items);

        this.loading.set(false);

    },

    error: (error: HttpErrorResponse) => {

        this.error.set(
        apiErrorMessage(error, 'No se pudo cargar el procedimiento')
        );

        this.loading.set(false);

    }

    });

}

// Nombre del espacio a partir de su id
protected spaceLabel(spaceId: string): string {

    const space = this.spaces().find((s) => s.id === spaceId);

    return space ? `${space.code} — ${space.description}` : '—';

}

// Nombre y tipo del ítem a partir de su id
protected itemLabel(itemId: string): string {

    const item = this.catalogItems().find((i) => i.id === itemId);

    if (!item) return 'Ítem no disponible';

    return `${item.name} (${item.type === 'PRODUCT' ? 'Producto' : 'Servicio'})`;

}

}
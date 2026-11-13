import { Component, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, timer, switchMap } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { PetService } from '../../../services/pet/pet.service';
import { PetDialogs } from '../../../services/pet/pet-dialogs.service';

import { Pet, PetFilters } from '../../../models/pet/pet.model';

import { SortHeader } from '../../../directives/shared/sort-header';
import { TablePager } from '../../shared/table-pager';

import { createTableState } from '../../../utils/shared/table-state';
import { apiErrorMessage } from '../../../utils/shared/api-error';

import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';

@Component({
  selector: 'app-pet-list',
  imports: [
    SortHeader,
    TablePager,
    RouterLink
  ],
  templateUrl: './pet-list.html'
})
export class PetList {

  private readonly petService = inject(PetService);

  private readonly dialogs = inject(PetDialogs);

  private readonly toast = inject(ToastService);

  private readonly confirm = injectConfirm();

  protected readonly session = inject(SessionService);

  // Filtros de búsqueda
  protected readonly name = signal('');

  protected readonly breed = signal('');

  protected readonly isActive = signal<boolean | null>(true);

  // Mascotas obtenidas del backend
  protected readonly pets = signal<Pet[]>([]);

  // Estados de la consulta
  protected readonly loading = signal(false);

  protected readonly error = signal<string | null>(null);

  // Permite actualizar la tabla después de una operación
  private readonly refresh = signal(0);

  // Tabla y ordenamiento
  protected readonly table = createTableState(this.pets, {
    sortKey: 'name',
    accessors: {
      name: (pet) => pet.name,
      breed: (pet) => pet.breed,
      species: (pet) => pet.species,
      birthDate: (pet) => pet.birthDate,
      gender: (pet) => pet.gender,
      active: (pet) => pet.active
    }
  });

  private readonly route = inject(ActivatedRoute);

  protected readonly tutorId = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('tutorId'))
    ),
    { initialValue: null }
  );

  constructor() {

    /**
     * Cada vez que cambie:
     * - La sede seleccionada.
     * - El nombre.
     * - La raza.
     * - El estado.
     * - La señal de actualización.
     *
     * Se vuelve a consultar el backend.
     */
    effect((onCleanup) => {

      const headquarterId = this.session.headquarterId();

      const filters: PetFilters = {

        headquarterId: headquarterId ?? '',

        name: this.name().trim(),

        breed: this.breed().trim(),

        isActive: this.isActive() ?? undefined

      };

      this.refresh();

      // La API necesita una sede específica
      if (headquarterId === null) {

        this.pets.set([]);

        this.loading.set(false);

        this.error.set(null);

        return;

      }

      this.loading.set(true);

      this.error.set(null);

      
       // Esperamos 300 ms antes de consultar, esto evita realizar una petición por cada tecla
       
       // switchMap y la cancelación de la suscripción evitan que consultas anteriores sobrescriban
       // los resultados de filtros más recientes
       
      const tutorId = this.tutorId();

      const request$ = tutorId
        ? this.petService.getByTutor(tutorId, headquarterId)
        : this.petService.getByHeadquarter(filters);

      const subscription = timer(300).pipe(
        switchMap(() => request$)
      ).subscribe({


          next: (pets) => {

            this.pets.set(pets);

            this.loading.set(false);

          },

          error: (error: HttpErrorResponse) => {

            this.pets.set([]);

            this.loading.set(false);

            this.error.set(
              apiErrorMessage(
                error,
                'No se pudieron cargar las mascotas'
              )
            );

          }

        });

      onCleanup(() => subscription.unsubscribe());

    });

  }

// Cambiar el filtro de estado
  protected setStatus(value: string): void {

    if (value === '') {

      this.isActive.set(null);

    } else {

      this.isActive.set(value === 'true');

    }

  }

   // Abrir formulario de creación
  protected create(): void {

    this.dialogs.pet().subscribe((saved) => {

      this.afterSave(saved);

    });

  }

// Abrir formulario de edición
  protected edit(pet: Pet): void {

    this.dialogs.pet(pet).subscribe((saved) => {

      this.afterSave(saved);

    });

  }

// Desactivar una mascota

  protected deactivate(pet: Pet): void {

    this.confirm(
      'Desactivar mascota',
      `¿Estás seguro de que deseas desactivar a "${pet.name}"?`,
      'Desactivar'
    ).subscribe((confirmed) => {

      if (!confirmed || !pet.id) {

        return;

      }

      this.petService.deactivate(pet.id).subscribe({

        next: () => {

          this.toast.success(
            `La mascota "${pet.name}" fue desactivada correctamente`
          );

          this.refresh.update(value => value + 1);

        },

        error: (error: HttpErrorResponse) => {

          this.toast.error(
            apiErrorMessage(
              error,
              'No se pudo desactivar la mascota'
            )
          );

        }

      });

    });

  }


// Acciones posteriores a crear o actualizar

  private afterSave(saved: Pet): void {

    this.toast.success(
      `La mascota "${saved.name}" quedó guardada correctamente`
    );

    this.refresh.update(value => value + 1);

  }

}
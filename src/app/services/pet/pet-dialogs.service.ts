import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
  EMPTY,
  Observable,
  catchError,
  from
} from 'rxjs';

import { Pet } from '../../models/pet/pet.model';
import { PetForm } from '../../components/pet/pet-form/pet-form';

@Injectable({
  providedIn: 'root'
})
export class PetDialogs {

  private readonly modalService = inject(NgbModal);

  pet(pet: Pet | null = null): Observable<Pet> {

    const ref = this.modalService.open(PetForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true
    });

    if (pet !== null) {
      ref.componentInstance.edit(pet);
    }

    return from(ref.result as Promise<Pet>).pipe(
      catchError(() => EMPTY)
    );

  }

}
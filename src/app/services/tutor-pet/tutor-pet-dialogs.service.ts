import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { TutorPet } from '../../models/tutor-pet/tutor-pet.model';
import { TutorPetForm } from '../../components/tutor-pet/tutor-pet-form/tutor-pet-form';

@Injectable({ providedIn: 'root' })
export class TutorPetDialogs {
  private readonly modalService = inject(NgbModal);

  tutorPet(tutor: TutorPet | null = null): Observable<TutorPet> {
    const ref = this.modalService.open(TutorPetForm, {
      backdrop: 'static',
      scrollable: true,
    });
    if (tutor !== null) {
      ref.componentInstance.edit(tutor);
    }
    return from(ref.result as Promise<TutorPet>).pipe(catchError(() => EMPTY));
  }
}
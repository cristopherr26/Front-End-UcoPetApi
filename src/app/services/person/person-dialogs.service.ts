import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Person } from '../../models/person/person.model';
import { PersonForm } from '../../components/person/person-form/person-form';
import { PasswordForm } from '../../components/person/password-form/password-form';

@Injectable({ providedIn: 'root' })
export class PersonDialogs {
  private readonly modalService = inject(NgbModal);

  person(person: Person | null = null): Observable<Person> {
    const ref = this.modalService.open(PersonForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    if (person !== null) {
      ref.componentInstance.edit(person);
    }
    return from(ref.result as Promise<Person>).pipe(catchError(() => EMPTY));
  }

  password(person: Person): Observable<void> {
    const ref = this.modalService.open(PasswordForm, { backdrop: 'static' });
    ref.componentInstance.start(person);
    return from(ref.result as Promise<void>).pipe(catchError(() => EMPTY));
  }
}

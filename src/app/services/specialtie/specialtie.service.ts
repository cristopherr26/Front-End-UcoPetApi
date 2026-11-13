import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Specialtie } from '../../models/specialtie/specialtie.model';


@Injectable({ providedIn: 'root' })
export class SpecialtieService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/specialties`;
  private cache: Observable<Specialtie[]> | null = null;

  list(): Observable<Specialtie[]> {
    if (this.cache === null) {
      this.cache = this.http
        .get<Specialtie[]>(this.url)
        .pipe(tap({ error: () => this.refresh() }), shareReplay(1));
    }
    return this.cache;
  }

  refresh(): void {
    this.cache = null;
  }
}
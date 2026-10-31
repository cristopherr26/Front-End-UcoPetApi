import { Injectable, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';
import { Headquarter } from '../../models/headquarter/headquarter.model';

@Injectable({ providedIn: 'root' })
export class HeadquarterService {
  private readonly http = inject(HttpClient);
  private cache: Observable<Headquarter[]> | null = null;

  constructor() {
    const session = inject(SessionService);
    effect(() => {
      session.token();
      this.refresh();
    });
  }

  list(): Observable<Headquarter[]> {
    if (this.cache === null) {
      this.cache = this.http
        .get<Headquarter[]>(`${environment.apiUrl}/headquarter`)
        .pipe(tap({ error: () => this.refresh() }), shareReplay(1));
    }
    return this.cache;
  }

  refresh(): void {
    this.cache = null;
  }
}

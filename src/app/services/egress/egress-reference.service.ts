import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Page,
  ProviderOption,
  ProviderResponse,
  PurchaseOption,
  PurchaseResponse,
} from '../../models/egress/egress.model';
import { HeadquarterService } from '../headquarter/headquarter.service';

const PURCHASE_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class EgressReferenceService {
  private readonly http = inject(HttpClient);
  private readonly headquarterService = inject(HeadquarterService);

  private providers$: Observable<ProviderOption[]> | null = null;
  private purchases$: Observable<PurchaseOption[]> | null = null;

  providers(): Observable<ProviderOption[]> {
    this.providers$ ??= this.http.get<ProviderResponse[]>(`${environment.apiUrl}/providers`).pipe(
      map((providers) =>
        providers.map((provider) => ({
          id: provider.id,
          name: provider.providerName,
          active: provider.active !== false,
        })),
      ),
      catchError(() => of([] as ProviderOption[])),
      shareReplay(1),
    );
    return this.providers$;
  }

  purchases(): Observable<PurchaseOption[]> {
    this.purchases$ ??= this.headquarterService.list().pipe(
      catchError(() => of([])),
      switchMap((headquarters) =>
        headquarters.length === 0
          ? of([] as PurchaseResponse[][])
          : forkJoin(headquarters.map((headquarter) => this.purchasesOf(headquarter.id))),
      ),
      map((groups) => groups.flat().map(toPurchaseOption)),
      shareReplay(1),
    );
    return this.purchases$;
  }

  refresh(): void {
    this.providers$ = null;
    this.purchases$ = null;
  }

  private purchasesOf(headquarterId: string): Observable<PurchaseResponse[]> {
    const params = new HttpParams()
      .set('headquarterId', headquarterId)
      .set('size', PURCHASE_PAGE_SIZE);
    return this.http
      .get<Page<PurchaseResponse>>(`${environment.apiUrl}/purchases`, { params })
      .pipe(
        map((page) => page.content ?? []),
        catchError(() => of([] as PurchaseResponse[])),
      );
  }
}

function toPurchaseOption(purchase: PurchaseResponse): PurchaseOption {
  return {
    id: purchase.id,
    number: purchase.purchaseNumber,
    providerId: purchase.supplier?.id ?? '',
    headquarterName: purchase.headquarter?.name ?? 'Sin sede',
    total: Number(purchase.total ?? 0),
    status: purchase.status,
  };
}

import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import {
  Egress,
  EgressCatalog,
  EgressView,
  PayMethod,
  ProviderOption,
  PurchaseOption,
} from '../../models/egress/egress.model';
import { PayMethodService } from '../receipts/pay-method.service';
import { EgressReferenceService } from './egress-reference.service';
import { EgressService } from './egress.service';

@Injectable({ providedIn: 'root' })
export class EgressViewService {
  private readonly egressService = inject(EgressService);
  private readonly referenceService = inject(EgressReferenceService);
  private readonly payMethodService = inject(PayMethodService);

  load(): Observable<EgressCatalog> {
    return forkJoin({
      egresses: this.egressService.list(),
      providers: this.referenceService.providers(),
      purchases: this.referenceService.purchases(),
      payMethods: this.payMethodService.list().pipe(catchError(() => of([] as PayMethod[]))),
    }).pipe(
      map(({ egresses, providers, purchases, payMethods }) => ({
        egresses: toViews(egresses, providers, purchases, payMethods),
        providers,
        purchases,
        payMethods,
      })),
    );
  }

  reload(): Observable<EgressCatalog> {
    this.referenceService.refresh();
    return this.load();
  }
}

export function toViews(
  egresses: Egress[],
  providers: ProviderOption[],
  purchases: PurchaseOption[],
  payMethods: PayMethod[],
): EgressView[] {
  const providerNames = new Map(providers.map((provider) => [provider.id, provider.name]));
  const purchaseNumbers = new Map(purchases.map((purchase) => [purchase.id, purchase.number]));
  const payMethodNames = new Map(payMethods.map((method) => [method.id, method.name]));

  return egresses.map((egress) => ({
    ...egress,
    providerName: providerNames.get(egress.provider) ?? shortId(egress.provider),
    purchaseNumber: purchaseNumbers.get(egress.purchaseOrder) ?? shortId(egress.purchaseOrder),
    payMethodName: payMethodNames.get(egress.payMethod) ?? shortId(egress.payMethod),
  }));
}

function shortId(id: string): string {
  return `#${id.slice(0, 8)}`;
}

import { Egress, EgressView, PurchaseOption } from '../../models/egress/egress.model';
import { todayIso } from './form-rules';

export interface SummaryGroup {
  key: string;
  label: string;
  total: number;
  count: number;
  share: number;
}

export interface EgressSummary {
  total: number;
  count: number;
  monthTotal: number;
  average: number;
  byProvider: SummaryGroup[];
  byPayMethod: SummaryGroup[];
}

export interface PurchaseBalance {
  paid: number;
  pending: number;
}

export function summarize(egresses: EgressView[], today: string = todayIso()): EgressSummary {
  const total = sumOf(egresses);
  const month = today.slice(0, 7);
  return {
    total,
    count: egresses.length,
    monthTotal: sumOf(egresses.filter((egress) => egress.date.startsWith(month))),
    average: egresses.length === 0 ? 0 : round2(total / egresses.length),
    byProvider: groupBy(egresses, total, (e) => e.provider, (e) => e.providerName),
    byPayMethod: groupBy(egresses, total, (e) => e.payMethod, (e) => e.payMethodName),
  };
}

export function purchaseBalance(
  purchase: PurchaseOption,
  egresses: Egress[],
  excludeEgressId: string | null = null,
): PurchaseBalance {
  const paid = sumOf(
    egresses.filter(
      (egress) => egress.purchaseOrder === purchase.id && egress.id !== excludeEgressId,
    ),
  );
  return { paid, pending: round2(Math.max(purchase.total - paid, 0)) };
}

export function payablePurchases(
  purchases: PurchaseOption[],
  egresses: Egress[],
  providerId: string,
  current: { egressId: string; purchaseId: string } | null = null,
): PurchaseOption[] {
  return purchases.filter(
    (purchase) =>
      purchase.providerId === providerId &&
      (purchase.id === current?.purchaseId ||
        (purchase.status !== 'CANCELLED' &&
          purchaseBalance(purchase, egresses, current?.egressId ?? null).pending > 0)),
  );
}

function groupBy(
  egresses: EgressView[],
  grandTotal: number,
  keyOf: (egress: EgressView) => string,
  labelOf: (egress: EgressView) => string,
): SummaryGroup[] {
  const groups = new Map<string, SummaryGroup>();
  for (const egress of egresses) {
    const key = keyOf(egress);
    const group = groups.get(key) ?? { key, label: labelOf(egress), total: 0, count: 0, share: 0 };
    group.total = round2(group.total + egress.total);
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      share: grandTotal === 0 ? 0 : Math.round((group.total / grandTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}

function sumOf(egresses: Egress[]): number {
  return round2(egresses.reduce((sum, egress) => sum + egress.total, 0));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

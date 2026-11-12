import { EgressView, PurchaseOption } from '../../models/egress/egress.model';
import { payablePurchases, purchaseBalance, summarize } from './egress-summary';

const egress = (overrides: Partial<EgressView>): EgressView => ({
  id: 'e',
  date: '2026-11-01',
  provider: 'p1',
  payMethod: 'm1',
  purchaseOrder: 'o1',
  concept: 'Compra',
  total: 100,
  providerName: 'Proveedor 1',
  payMethodName: 'Efectivo',
  purchaseNumber: 'OC-0001',
  ...overrides,
});

const purchase = (overrides: Partial<PurchaseOption>): PurchaseOption => ({
  id: 'o1',
  number: 'OC-0001',
  providerId: 'p1',
  headquarterName: 'Sede',
  total: 1000,
  status: 'RECEIVED',
  ...overrides,
});

describe('egress summary', () => {
  it('computes totals, month total, average and groups', () => {
    const summary = summarize(
      [
        egress({ id: 'a', total: 300 }),
        egress({ id: 'b', total: 100, date: '2026-10-20' }),
        egress({ id: 'c', total: 600, provider: 'p2', providerName: 'Proveedor 2', payMethod: 'm2', payMethodName: 'Transferencia' }),
      ],
      '2026-11-11',
    );
    expect(summary.total).toBe(1000);
    expect(summary.monthTotal).toBe(900);
    expect(summary.average).toBeCloseTo(333.33);
    expect(summary.byProvider.map((g) => [g.label, g.total, g.share])).toEqual([
      ['Proveedor 2', 600, 60],
      ['Proveedor 1', 400, 40],
    ]);
  });

  it('computes what is paid and pending in an order', () => {
    const egresses = [egress({ id: 'a', total: 300 }), egress({ id: 'b', total: 200 })];
    expect(purchaseBalance(purchase({}), egresses)).toEqual({ paid: 500, pending: 500 });
    expect(purchaseBalance(purchase({}), egresses, 'a')).toEqual({ paid: 200, pending: 800 });
  });

  it('lists only payable orders of the provider, keeping the current one when editing', () => {
    const purchases = [
      purchase({ id: 'o1', total: 100 }),
      purchase({ id: 'o2', number: 'OC-0002' }),
      purchase({ id: 'o3', status: 'CANCELLED' }),
      purchase({ id: 'o4', providerId: 'p2' }),
    ];
    const egresses = [egress({ id: 'a', total: 100, purchaseOrder: 'o1' })];
    expect(payablePurchases(purchases, egresses, 'p1').map((p) => p.id)).toEqual(['o2']);
    expect(
      payablePurchases(purchases, egresses, 'p1', { egressId: 'a', purchaseId: 'o1' }).map((p) => p.id),
    ).toEqual(['o1', 'o2']);
  });
});

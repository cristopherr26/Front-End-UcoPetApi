import { EMPTY_FILTERS, EgressView } from '../../models/egress/egress.model';
import { applyEgressFilters, hasActiveFilters, invalidDateRange } from './egress-filters';

const egress = (overrides: Partial<EgressView>): EgressView => ({
  id: 'e',
  date: '2026-11-01',
  provider: 'p1',
  payMethod: 'm1',
  purchaseOrder: 'o1',
  concept: 'Compra',
  total: 100,
  providerName: 'Proveedor',
  payMethodName: 'Efectivo',
  purchaseNumber: 'OC-0001',
  ...overrides,
});

describe('egress filters', () => {
  const data = [
    egress({ id: 'a', concept: 'Energía eléctrica', date: '2026-10-15' }),
    egress({ id: 'b', provider: 'p2', providerName: 'VetSupply', payMethod: 'm2' }),
    egress({ id: 'c', purchaseNumber: 'OC-0042', date: '2026-11-10' }),
  ];
  const ids = (filters: Partial<typeof EMPTY_FILTERS>) =>
    applyEgressFilters(data, { ...EMPTY_FILTERS, ...filters }).map((e) => e.id);

  it('searches concept, provider and order ignoring accents and case', () => {
    expect(ids({ search: 'energia' })).toEqual(['a']);
    expect(ids({ search: 'vetsupply' })).toEqual(['b']);
    expect(ids({ search: 'oc-0042' })).toEqual(['c']);
  });

  it('filters by provider, pay method and date range', () => {
    expect(ids({ providerId: 'p2' })).toEqual(['b']);
    expect(ids({ payMethodId: 'm1' })).toEqual(['a', 'c']);
    expect(ids({ dateFrom: '2026-11-01', dateTo: '2026-11-05' })).toEqual(['b']);
  });

  it('knows when filters are active or the range is invalid', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(true);
    expect(invalidDateRange({ ...EMPTY_FILTERS, dateFrom: '2026-11-10', dateTo: '2026-11-01' })).toBe(true);
  });
});

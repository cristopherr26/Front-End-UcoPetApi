import { EgressFilters, EgressView } from '../../models/egress/egress.model';

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function applyEgressFilters(egresses: EgressView[], filters: EgressFilters): EgressView[] {
  const search = normalize(filters.search);
  return egresses.filter(
    (egress) =>
      (search === '' ||
        [egress.concept, egress.providerName, egress.purchaseNumber].some((text) =>
          normalize(text).includes(search),
        )) &&
      (!filters.providerId || egress.provider === filters.providerId) &&
      (!filters.payMethodId || egress.payMethod === filters.payMethodId) &&
      (!filters.dateFrom || egress.date >= filters.dateFrom) &&
      (!filters.dateTo || egress.date <= filters.dateTo),
  );
}

export function hasActiveFilters(filters: EgressFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.providerId !== null ||
    filters.payMethodId !== null ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''
  );
}

export function invalidDateRange(filters: EgressFilters): boolean {
  return filters.dateFrom !== '' && filters.dateTo !== '' && filters.dateFrom > filters.dateTo;
}

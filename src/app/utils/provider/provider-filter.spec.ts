import { Provider } from '../../models/provider/provider.model';
import { filterProviders } from './provider-filter';

const provider = (id: string, providerName: string, documentNumber: string): Provider => ({
  id,
  providerName,
  representName: 'Ana Gómez',
  idType: 'NIT',
  documentNumber,
  mobileNumber: null,
  address: null,
  email: null,
  active: true,
});

describe('filterProviders', () => {
  const providers = [
    provider('1', 'Distribuidora Peña', '900123456'),
    provider('2', 'VETERINARIA CENTRAL', '800555777'),
    provider('3', 'Alimentos Mascota', '900999000'),
  ];
  const ids = (list: Provider[]) => list.map((item) => item.id);

  it('returns everything when the search is empty or only spaces', () => {
    expect(filterProviders(providers, '')).toEqual(providers);
    expect(filterProviders(providers, '   ')).toEqual(providers);
  });

  it('finds by name, ignoring case and accents', () => {
    expect(ids(filterProviders(providers, 'pena'))).toEqual(['1']);
    expect(ids(filterProviders(providers, 'central'))).toEqual(['2']);
    expect(ids(filterProviders(providers, '  MASCOTA '))).toEqual(['3']);
  });

  it('finds by document number, even by a part of it', () => {
    expect(ids(filterProviders(providers, '800555777'))).toEqual(['2']);
    expect(ids(filterProviders(providers, '900'))).toEqual(['1', '3']);
  });

  it('returns nothing when no name or document matches', () => {
    expect(filterProviders(providers, 'zzz')).toEqual([]);
  });
});

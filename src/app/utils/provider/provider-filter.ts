import { Provider } from '../../models/provider/provider.model';

// Pasa a minúsculas, quita tildes y recorta espacios, para que "Peña" y "pena" coincidan.
function normalize(text: string | null | undefined): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Deja los proveedores cuyo nombre o número de documento contiene el texto buscado.
// Si no se escribió nada, devuelve la lista completa.
export function filterProviders(providers: Provider[], term: string): Provider[] {
  const search = normalize(term);
  if (search === '') {
    return providers;
  }
  return providers.filter(
    (provider) =>
      normalize(provider.providerName).includes(search) ||
      normalize(provider.documentNumber).includes(search),
  );
}

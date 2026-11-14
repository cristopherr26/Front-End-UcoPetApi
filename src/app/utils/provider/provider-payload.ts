import { ProviderPayload } from '../../models/provider/provider.model';

export interface ProviderFormValue {
  providerName: string;
  representName: string;
  idType: string;
  documentNumber: string;
  mobileNumber: string;
  address: string;
  email: string;
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

// Los campos opcionales vacíos se envían como null (el backend hace lo mismo con trimToNull).
function cleanOrNull(value: string | null | undefined): string | null {
  const text = clean(value);
  return text === '' ? null : text;
}

// Convierte lo que escribió el usuario en el cuerpo que espera la API:
// textos sin espacios al inicio ni al final.
export function toProviderPayload(value: ProviderFormValue): ProviderPayload {
  return {
    providerName: clean(value.providerName),
    representName: clean(value.representName),
    idType: value.idType,
    documentNumber: clean(value.documentNumber),
    mobileNumber: cleanOrNull(value.mobileNumber),
    address: cleanOrNull(value.address),
    email: cleanOrNull(value.email),
  };
}

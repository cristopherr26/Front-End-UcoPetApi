// Lo que DEVUELVE la API (ProviderDTO).
// Ojo con el estado: el DTO tiene el getter isActive(), y Jackson lo serializa como "active".
export interface Provider {
  id: string;
  providerName: string;
  representName: string;
  idType: string;
  documentNumber: string;
  mobileNumber: string | null;
  address: string | null;
  email: string | null;
  active: boolean;
}

// Lo que ENVÍAS al crear (POST) o editar (PUT). No lleva id ni estado:
// el id va en la URL y el backend fuerza active = true.
export interface ProviderPayload {
  providerName: string;
  representName: string;
  idType: string;
  documentNumber: string;
  mobileNumber: string | null;
  address: string | null;
  email: string | null;
}

// Un tipo de documento tal como lo devuelve GET /api/v1/persons/document-types.
export interface DocumentTypeOption {
  value: string;
  label: string;
}

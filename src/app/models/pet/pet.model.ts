export type PetGender = 'M' | 'F';


// Información general de una mascota
export interface PetData {
  name: string;
  birthDate: string;
  breed: string;
  species: string;
  gender: PetGender;
  photoUrl: string | null;
  tutorId: string;
  policyId: string | null;
  headquarterId: string;
}


// Modelo que representa una mascota consultada
export interface Pet extends PetData {
  id: string;
  active: boolean;
}


// Información necesaria para crear una mascota
export interface CreatePetRequest extends PetData {
  isActive: boolean;
}


// Información necesaria para actualizar una mascota
export type UpdatePetRequest = PetData;


// Filtros disponibles para consultar mascotas por sede
export interface PetFilters {
  headquarterId: string;
  name?: string;
  breed?: string;
  isActive?: boolean;
}
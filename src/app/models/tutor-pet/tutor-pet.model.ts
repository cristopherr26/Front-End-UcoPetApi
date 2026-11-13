/** Relación entre una persona existente y su registro como tutor de mascotas */
export interface TutorPet {
  id: string;
  person: string;
}

/** Datos necesarios para crear o actualizar la relación de tutor */
export interface TutorPetRequest {
  person: string;
}
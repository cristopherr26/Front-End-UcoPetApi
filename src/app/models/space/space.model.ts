export interface Space {
  id?: string;
  code: string;
  type: string;
  description: string;
  active?: boolean;
  headquarterId?: string | null;
}

// Lo que acepta el PATCH de la API
// Codigo y sede no se pueden modificar al estar espacio creado
export interface SpaceChanges {
  type?: string;
  description?: string;
  active?: boolean;
}
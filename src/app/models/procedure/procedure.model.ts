// Insumo por defecto de un procedimiento
export interface ProcedureItem {
    itemId: string;
    quantity: number;
}

// Datos que el usuario escribe al crear o editar (igual al JSON de Postman)
export interface ProcedureData {
    type: string;
    description: string;
    durationMinutes: number;
    spaceId: string;
    defaultItems: ProcedureItem[];
}

// Procedimiento consultado: el backend agrega id, code y active
export interface Procedure extends ProcedureData {
    id: string;
    code: string;
    active: boolean;
}

export type CreateProcedureRequest = ProcedureData;
export interface UpdateProcedureRequest extends ProcedureData {
    code: string;
}

// Espacio para el selector del formulario
export interface ProcedureSpace {
    id: string;
    code: string;
    type: string;
    description: string;
    active: boolean;
    headquarterId?: string;
}

// Respuesta 202 en crear, actualizar, activar y desactivar
export interface ProcedureActionResponse {
    message: string;
    idMessage: string;
}
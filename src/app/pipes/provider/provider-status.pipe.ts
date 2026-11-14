import { Pipe, PipeTransform } from '@angular/core';

// Convierte el booleano "active" que manda el backend en el texto que se ve en pantalla.
@Pipe({ name: 'providerStatus' })
export class ProviderStatusPipe implements PipeTransform {
  transform(active: boolean | null | undefined): string {
    return active ? 'Activo' : 'Inactivo';
  }
}

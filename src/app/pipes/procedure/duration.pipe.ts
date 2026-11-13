import { Pipe, PipeTransform } from '@angular/core';

// Convierte minutos en horas y minutos
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {

    transform(minutes: number): string {

        const hours = Math.floor(minutes / 60);

        const rest = minutes % 60;

        if (hours === 0) return `${rest} min`;

        return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;

    }

}
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SessionService } from '../../../services/session/session.service';
import { PageHeader } from '../../shared/page-header';

// Contenedor del módulo: encabezado y pestañas; cada pestaña es una ruta hija
@Component({
  selector: 'app-specialtie-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeader],
  templateUrl: './specialtie-shell.html',
  styleUrl: './specialtie-shell.scss',
})
export class SpecialtieShell {
  protected readonly session = inject(SessionService);
}

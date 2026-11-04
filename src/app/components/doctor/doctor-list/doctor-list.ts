import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { Doctor } from '../../../models/doctor/doctor.model';
import { PersonSummary } from '../../../models/person/person.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { DoctorDialogs } from '../../../services/doctor/doctor-dialogs.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { personName, shortId } from '../../../utils/doctor/form-rules';


const PROCESSOR_DELAY_MS = 1500;

@Component({
  selector: 'app-doctor-list',
  imports: [RouterLink, SortHeader, TablePager],
  templateUrl: './doctor-list.html',
})
export class DoctorList {
  private readonly doctorService = inject(DoctorService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly dialogs = inject(DoctorDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly search = signal('');
  private readonly refresh = signal(0);

  protected readonly doctors = signal<Doctor[]>([]);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term === ''
      ? this.doctors()
      : this.doctors().filter(
          (doctor) =>
            doctor.licenseNumber.toLowerCase().includes(term) ||
            (this.nameOf(doctor) ?? '').toLowerCase().includes(term),
        );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'person',
    accessors: {
      person: (doctor) => this.nameOf(doctor) ?? doctor.idPerson,
      license: (doctor) => doctor.licenseNumber,
      status: (doctor) => this.isActive(doctor),
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      this.loading.set(untracked(() => this.doctors().length === 0));
      this.error.set(null);
      const subscription = forkJoin({
        doctors: this.doctorService.list(),
        persons: this.personLookup.byId(),
      }).subscribe({
        next: ({ doctors, persons }) => {
          this.doctors.set(doctors);
          this.persons.set(persons);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.doctors.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar los médicos'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected nameOf(doctor: Doctor): string | null {
    return personName(this.persons().get(doctor.idPerson));
  }

  protected shortId = shortId;

  
  protected isActive(doctor: Doctor): boolean | null {
    return this.persons().get(doctor.idPerson)?.active ?? null;
  }

  protected create(): void {
    this.dialogs.doctor().subscribe(() => this.afterSave('El médico se envió a guardar'));
  }

  protected edit(doctor: Doctor): void {
    this.dialogs.doctor(doctor).subscribe(() => this.afterSave('Los cambios se enviaron a guardar'));
  }

  protected deactivate(doctor: Doctor): void {
    const name = this.nameOf(doctor) ?? doctor.licenseNumber;
    this.confirm(
      'Desactivar al médico',
      `${name} dejará de estar activo: se desactiva su persona.`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (confirmed && doctor.id) {
        this.changeState(doctor.id, false);
      }
    });
  }

  protected activate(doctor: Doctor): void {
    if (doctor.id) {
      this.changeState(doctor.id, true);
    }
  }

  private changeState(id: string, activate: boolean): void {
    const request = activate ? this.doctorService.activate(id) : this.doctorService.deactivate(id);
    request.subscribe({
      next: () => {
        this.personLookup.refresh();
        this.toast.success(activate ? 'Médico activado' : 'Médico desactivado');
        this.refreshSoon();
      },
      error: (error: HttpErrorResponse) =>
        this.toast.error(apiErrorMessage(error, 'No se pudo cambiar el estado')),
    });
  }

  private afterSave(message: string): void {
    this.toast.success(`${message}; el procesador lo aplica en un momento`);
    this.refreshSoon();
  }

  private refreshSoon(): void {
    this.refresh.update((value) => value + 1);
    setTimeout(() => this.refresh.update((value) => value + 1), PROCESSOR_DELAY_MS);
  }
}
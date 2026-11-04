import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { Doctor } from '../../../models/doctor/doctor.model';
import { SpecialtieDoctor } from '../../../models/doctor/specialtie-doctor.model';
import { PersonSummary } from '../../../models/person/person.model';
import { Specialtie } from '../../../models/specialtie/specialtie.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { DoctorDialogs } from '../../../services/doctor/doctor-dialogs.service';
import { SpecialtieDoctorService } from '../../../services/doctor/specialtie-doctor.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { personName, shortId } from '../../../utils/doctor/form-rules';

const PROCESSOR_DELAY_MS = 1500;

@Component({
  selector: 'app-specialtie-doctor-list',
  imports: [RouterLink, SortHeader, TablePager],
  templateUrl: './specialtie-doctor-list.html',
})
export class SpecialtieDoctorList {
  private readonly relationService = inject(SpecialtieDoctorService);
  private readonly doctorService = inject(DoctorService);
  private readonly specialtieService = inject(SpecialtieService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly dialogs = inject(DoctorDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  // Llegar desde Médicos con `?idDoctor=` deja la lista ya filtrada.
  protected readonly doctorFilter = signal<string | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('idDoctor'),
  );
  protected readonly specialtieFilter = signal<string | null>(null);
  private readonly refresh = signal(0);

  protected readonly relations = signal<SpecialtieDoctor[]>([]);
  private readonly doctors = signal<Doctor[]>([]);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  private readonly specialties = signal<Specialtie[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly doctorOptions = computed(() =>
    this.doctors()
      .filter((doctor) => !!doctor.id)
      .map((doctor) => ({ id: doctor.id as string, label: this.doctorLabel(doctor.id as string) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );
  protected readonly specialtieOptions = computed(() =>
    this.specialties()
      .map((item) => ({ id: item.id, label: this.specialtieLabel(item.id) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly visible = computed(() => {
    const doctor = this.doctorFilter();
    const specialtie = this.specialtieFilter();
    return this.relations().filter(
      (relation) =>
        (doctor === null || relation.doctor === doctor) &&
        (specialtie === null || relation.specialtie === specialtie),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'doctor',
    accessors: {
      doctor: (relation) => this.doctorLabel(relation.doctor),
      specialtie: (relation) => this.specialtieLabel(relation.specialtie),
    },
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      this.loading.set(untracked(() => this.relations().length === 0));
      this.error.set(null);
      const subscription = forkJoin({
        relations: this.relationService.list(),
        doctors: this.doctorService.list(),
        persons: this.personLookup.byId(),
        // Si la lista de especialidades no se puede leer, se muestra el id.
        specialties: this.specialtieService.list().pipe(catchError(() => of([] as Specialtie[]))),
      }).subscribe({
        next: ({ relations, doctors, persons, specialties }) => {
          this.relations.set(relations);
          this.doctors.set(doctors);
          this.persons.set(persons);
          this.specialties.set(specialties);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.relations.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar las especialidades'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected doctorLabel(doctorId: string): string {
    const doctor = this.doctors().find((item) => item.id === doctorId);
    if (!doctor) {
      return `Médico ${shortId(doctorId)}…`;
    }
    return personName(this.persons().get(doctor.idPerson)) ?? doctor.licenseNumber;
  }

  protected specialtieLabel(specialtieId: string): string {
    const specialtie = this.specialties().find((item) => item.id === specialtieId);
    return specialtie?.name || `Especialidad ${shortId(specialtieId)}…`;
  }

  protected setDoctor(value: string): void {
    this.doctorFilter.set(value === '' ? null : value);
  }

  protected setSpecialtie(value: string): void {
    this.specialtieFilter.set(value === '' ? null : value);
  }

  protected create(): void {
    this.dialogs
      .specialtieDoctor(null, this.doctorFilter())
      .subscribe(() => this.afterChange('La especialidad se envió a guardar'));
  }

  protected edit(relation: SpecialtieDoctor): void {
    this.dialogs
      .specialtieDoctor(relation)
      .subscribe(() => this.afterChange('Los cambios se enviaron a guardar'));
  }

  protected remove(relation: SpecialtieDoctor): void {
    this.confirm(
      'Quitar la especialidad',
      `${this.doctorLabel(relation.doctor)} dejará de tener "${this.specialtieLabel(relation.specialtie)}". Se elimina la relación.`,
      'Quitar',
    ).subscribe((confirmed) => {
      if (!confirmed || !relation.id) {
        return;
      }
      this.relationService.remove(relation.id).subscribe({
        next: () => {
          this.relations.update((items) => items.filter((item) => item.id !== relation.id));
          this.afterChange('La especialidad se envió a quitar');
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo quitar la especialidad')),
      });
    });
  }

  private afterChange(message: string): void {
    this.toast.success(`${message}; el procesador lo aplica en un momento`);
    this.refresh.update((value) => value + 1);
    setTimeout(() => this.refresh.update((value) => value + 1), PROCESSOR_DELAY_MS);
  }
}
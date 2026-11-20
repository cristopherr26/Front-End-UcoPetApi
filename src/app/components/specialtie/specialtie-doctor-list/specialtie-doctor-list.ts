import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { SortHeader } from '../../../directives/shared/sort-header';
import { EmptyState } from '../../shared/empty-state';
import { TablePager } from '../../shared/table-pager';
import { Doctor } from '../../../models/doctor/doctor.model';
import { PersonSummary } from '../../../models/person/person.model';
import { Specialtie } from '../../../models/specialtie/specialtie.model';
import {
  SpecialtieDoctor,
  VERIFICATION_STATUSES,
  VerificationStatus,
} from '../../../models/specialtie/specialtie-doctor.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { SpecialtieDoctorService } from '../../../services/specialtie/specialtie-doctor.service';
import { SpecialtieDialogs } from '../../../services/specialtie/specialtie-dialogs.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { createTableState } from '../../../utils/shared/table-state';
import {
  doctorLabel,
  personLabel,
  specialtieLabel,
  statusIcon,
  statusLabel,
  statusTag,
} from '../../../utils/specialtie/form-rules';

@Component({
  selector: 'app-specialtie-doctor-list',
  imports: [SortHeader, TablePager, EmptyState, DatePipe],
  templateUrl: './specialtie-doctor-list.html',
  styleUrl: './specialtie-doctor-list.scss',
})
export class SpecialtieDoctorList {
  private readonly relationService = inject(SpecialtieDoctorService);
  private readonly doctorService = inject(DoctorService);
  private readonly specialtieService = inject(SpecialtieService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly dialogs = inject(SpecialtieDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly states = VERIFICATION_STATUSES;
  protected readonly statusLabel = statusLabel;
  protected readonly statusTag = statusTag;
  protected readonly statusIcon = statusIcon;

  // Filtros. Llegar con `?idDoctor=` deja la lista ya filtrada por ese veterinario.
  protected readonly doctorFilter = signal<string | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('idDoctor'),
  );
  protected readonly specialtieFilter = signal<string | null>(null);
  protected readonly statusFilter = signal<VerificationStatus | null>(null);
  protected readonly onlyVerified = signal(false);
  protected readonly showInactive = signal(false);

  // Datos
  private readonly relations = signal<SpecialtieDoctor[]>([]);
  private readonly doctors = signal<Doctor[]>([]);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  private readonly specialties = signal<Specialtie[]>([]);

  // Estados de la consulta
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  // Fila con una acción en curso (evita doble clic)
  protected readonly busyId = signal<string | null>(null);
  private readonly refresh = signal(0);

  protected readonly hasFilters = computed(
    () =>
      this.doctorFilter() !== null ||
      this.specialtieFilter() !== null ||
      this.statusFilter() !== null ||
      this.onlyVerified(),
  );

  protected readonly doctorOptions = computed(() =>
    this.doctors()
      .filter((doctor): doctor is Doctor & { id: string } => !!doctor.id)
      .map((doctor) => ({ id: doctor.id, label: this.doctorLabel(doctor.id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
  );

  protected readonly specialtieOptions = computed(() =>
    this.specialties()
      .map((item) => ({ id: item.id, label: item.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
  );

  // Las inactivas solo se muestran si se piden
  protected readonly visible = computed(() =>
    this.showInactive()
      ? this.relations()
      : this.relations().filter((relation) => relation.active !== false),
  );

  protected readonly inactiveCount = computed(
    () => this.relations().filter((relation) => relation.active === false).length,
  );

  protected readonly table = createTableState(this.visible, {
    sortKey: 'doctor',
    accessors: {
      doctor: (relation) => this.doctorLabel(relation.doctor),
      specialtie: (relation) => this.specialtieLabel(relation.specialtie),
      status: (relation) => statusLabel(relation.status),
      verifiedAt: (relation) => relation.verifiedAt,
    },
  });

  constructor() {
    // Datos de referencia para mostrar nombres en lugar de ids
    this.personLookup.byId().subscribe((persons) => this.persons.set(persons));
    this.specialtieService.list().subscribe({
      next: (specialties) => this.specialties.set(specialties),
      error: () => this.specialties.set([]),
    });

    // Los veterinarios dependen de la sede activa
    effect((onCleanup) => {
      const headquarterId = this.session.headquarterId();
      if (headquarterId === null) {
        this.doctors.set([]);
        return;
      }
      const subscription = this.doctorService.list(headquarterId).subscribe({
        next: (doctors) => this.doctors.set(doctors),
        error: () => this.doctors.set([]),
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Asignaciones: se vuelven a pedir al cambiar sede, filtros o tras una operación
    effect((onCleanup) => {
      this.refresh();
      const headquarterId = this.session.headquarterId();
      const idDoctor = this.doctorFilter();
      const idSpecialtie = this.specialtieFilter();
      const status = this.statusFilter();
      const onlyVerified = this.onlyVerified();

      // El backend exige la sede: sin sede elegida no hay nada que consultar
      if (headquarterId === null) {
        this.relations.set([]);
        this.loading.set(false);
        this.error.set(null);
        return;
      }

      let request$: Observable<SpecialtieDoctor[]>;
      if (onlyVerified) {
        request$ = this.relationService.verified(headquarterId, idSpecialtie);
      } else if (idDoctor !== null || idSpecialtie !== null || status !== null) {
        request$ = this.relationService.filter(headquarterId, { idDoctor, idSpecialtie, status });
      } else {
        request$ = this.relationService.list(headquarterId);
      }

      // El spinner grande solo la primera vez; al recargar se mantiene la tabla
      this.loading.set(untracked(() => this.relations().length === 0));
      this.error.set(null);
      const subscription = request$.subscribe({
        next: (relations) => {
          // /verified no filtra por médico: se aplica aquí
          this.relations.set(
            onlyVerified && idDoctor !== null
              ? relations.filter((relation) => relation.doctor === idDoctor)
              : relations,
          );
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.relations.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar las asignaciones'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  // Etiquetas legibles
  protected doctorLabel(doctorId: string): string {
    return doctorLabel(doctorId, this.doctors(), this.persons());
  }

  protected specialtieLabel(specialtieId: string): string {
    return specialtieLabel(specialtieId, this.specialties());
  }

  protected reviewerLabel(personId: string | null): string | null {
    return personLabel(personId, this.persons());
  }

  // Acciones de verificación: solo ADMIN, sobre asignaciones activas y pendientes
  protected canReview(relation: SpecialtieDoctor): boolean {
    return this.session.isAdmin() && relation.active !== false && relation.status === 'PENDING';
  }

  // Filtros
  protected setDoctor(value: string): void {
    this.doctorFilter.set(value === '' ? null : value);
  }

  protected setSpecialtie(value: string): void {
    this.specialtieFilter.set(value === '' ? null : value);
  }

  protected setStatus(value: string): void {
    this.statusFilter.set(value === '' ? null : (value as VerificationStatus));
  }

  protected setOnlyVerified(value: boolean): void {
    this.onlyVerified.set(value);
    if (value) {
      this.statusFilter.set(null);
    }
  }

  protected clearFilters(): void {
    this.doctorFilter.set(null);
    this.specialtieFilter.set(null);
    this.statusFilter.set(null);
    this.onlyVerified.set(false);
  }

  // Operaciones
  protected create(): void {
    this.dialogs.specialtieDoctor(null, this.doctorFilter()).subscribe((saved) => {
      this.toast.success(
        `${this.specialtieLabel(saved.specialtie)} asignada a ${this.doctorLabel(saved.doctor)}; queda pendiente de verificación`,
      );
      this.reload();
    });
  }

  protected edit(relation: SpecialtieDoctor): void {
    this.dialogs.specialtieDoctor(relation).subscribe((saved) => {
      const reset = relation.status !== 'PENDING' && saved.status === 'PENDING';
      this.toast.success(
        reset
          ? 'Asignación actualizada; el certificado nuevo quedó pendiente de verificación'
          : 'Asignación actualizada',
      );
      this.reload();
    });
  }

  protected deactivate(relation: SpecialtieDoctor): void {
    this.confirm(
      'Desactivar asignación',
      `${this.doctorLabel(relation.doctor)} dejará de figurar con "${this.specialtieLabel(relation.specialtie)}".`,
      'Desactivar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.busyId.set(relation.id);
      this.relationService.deactivate(relation.id).subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success('Asignación desactivada');
          this.reload();
        },
        error: (error: HttpErrorResponse) => {
          this.busyId.set(null);
          this.toast.error(apiErrorMessage(error, 'No se pudo desactivar la asignación'));
        },
      });
    });
  }

  protected verify(relation: SpecialtieDoctor): void {
    this.confirm(
      'Verificar certificado',
      `Confirmas que revisaste el certificado de ${this.doctorLabel(relation.doctor)} para "${this.specialtieLabel(relation.specialtie)}".`,
      'Verificar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.busyId.set(relation.id);
      this.relationService.verify(relation.id).subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success(`Especialidad de ${this.doctorLabel(relation.doctor)} verificada`);
          this.reload();
        },
        error: (error: HttpErrorResponse) => {
          this.busyId.set(null);
          this.toast.error(apiErrorMessage(error, 'No se pudo verificar la asignación'));
        },
      });
    });
  }

  protected reject(relation: SpecialtieDoctor): void {
    this.dialogs
      .reject(
        relation,
        this.doctorLabel(relation.doctor),
        this.specialtieLabel(relation.specialtie),
      )
      .subscribe(() => {
        this.toast.success(`Certificado de ${this.doctorLabel(relation.doctor)} rechazado`);
        this.reload();
      });
  }

  // El backend responde cuando ya guardó: basta con una recarga inmediata
  private reload(): void {
    this.refresh.update((value) => value + 1);
  }
}

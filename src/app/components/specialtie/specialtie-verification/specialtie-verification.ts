import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EmptyState } from '../../shared/empty-state';
import { KpiCard } from '../../shared/kpi-card';
import { Doctor } from '../../../models/doctor/doctor.model';
import { PersonSummary } from '../../../models/person/person.model';
import { Specialtie } from '../../../models/specialtie/specialtie.model';
import { SpecialtieDoctor } from '../../../models/specialtie/specialtie-doctor.model';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { SpecialtieDoctorService } from '../../../services/specialtie/specialtie-doctor.service';
import { SpecialtieDialogs } from '../../../services/specialtie/specialtie-dialogs.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { doctorLabel, specialtieLabel } from '../../../utils/specialtie/form-rules';

// Bandeja del ADMIN: certificados pendientes de revisión en la sede activa
@Component({
  selector: 'app-specialtie-verification',
  imports: [RouterLink, EmptyState, KpiCard],
  templateUrl: './specialtie-verification.html',
  styleUrl: './specialtie-verification.scss',
})
export class SpecialtieVerification {
  private readonly relationService = inject(SpecialtieDoctorService);
  private readonly doctorService = inject(DoctorService);
  private readonly specialtieService = inject(SpecialtieService);
  private readonly personLookup = inject(PersonLookupService);
  private readonly dialogs = inject(SpecialtieDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  // La lista completa de la sede alimenta los KPI; la bandeja sale de /filter?status=PENDING
  private readonly relations = signal<SpecialtieDoctor[]>([]);
  private readonly pendingRelations = signal<SpecialtieDoctor[]>([]);
  private readonly doctors = signal<Doctor[]>([]);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  private readonly specialties = signal<Specialtie[]>([]);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  private readonly refresh = signal(0);

  private readonly active = computed(() =>
    this.relations().filter((relation) => relation.active !== false),
  );

  // Pendientes activas, ordenadas por veterinario
  protected readonly pending = computed(() =>
    this.pendingRelations()
      .filter((relation) => relation.active !== false && relation.status === 'PENDING')
      .sort((a, b) => this.doctorLabel(a.doctor).localeCompare(this.doctorLabel(b.doctor), 'es')),
  );

  protected readonly counts = computed(() => {
    const active = this.active();
    return {
      pending: active.filter((relation) => relation.status === 'PENDING').length,
      verified: active.filter((relation) => relation.status === 'VERIFIED').length,
      rejected: active.filter((relation) => relation.status === 'REJECTED').length,
    };
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const headquarterId = this.session.headquarterId();
      // Un DOCTOR que entra por URL no consulta nada: ve el aviso de permiso
      if (!this.session.isAdmin() || headquarterId === null) {
        this.relations.set([]);
        this.pendingRelations.set([]);
        this.loading.set(false);
        this.error.set(null);
        return;
      }
      this.loading.set(untracked(() => this.relations().length === 0));
      this.error.set(null);
      const subscription = forkJoin({
        relations: this.relationService.list(headquarterId),
        pending: this.relationService.filter(headquarterId, { status: 'PENDING' }),
        doctors: this.doctorService.list(headquarterId),
        persons: this.personLookup.byId(),
        specialties: this.specialtieService.list(),
      }).subscribe({
        next: ({ relations, pending, doctors, persons, specialties }) => {
          this.relations.set(relations);
          this.pendingRelations.set(pending);
          this.doctors.set(doctors);
          this.persons.set(persons);
          this.specialties.set(specialties);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.relations.set([]);
          this.pendingRelations.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar las asignaciones'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected doctorLabel(doctorId: string): string {
    return doctorLabel(doctorId, this.doctors(), this.persons());
  }

  protected specialtieLabel(specialtieId: string): string {
    return specialtieLabel(specialtieId, this.specialties());
  }

  protected licenseOf(doctorId: string): string | null {
    return this.doctors().find((doctor) => doctor.id === doctorId)?.licenseNumber ?? null;
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

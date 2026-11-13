import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { Appointment, AppointmentStatus } from '../../../models/appointment/appointment.model';
import { SortHeader } from '../../../directives/shared/sort-header';
import { AppointmentDialogs } from '../../../services/appointment/appointment-dialogs.service';
import { AppointmentService } from '../../../services/appointment/appointment.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { appointmentErrorMessage } from '../../../utils/appointment/appointment-errors';
import {
  AppointmentPeriod,
  appointmentKpis,
  filterAppointments,
} from '../../../utils/appointment/appointment-filters';
import {
  APPOINTMENT_STATUSES,
  allowedActions,
  dateLabel,
  statusIcon,
  statusLabel,
  statusTone,
  timeLabel,
} from '../../../utils/appointment/appointment-labels';
import { matchesRequest, todayIso } from '../../../utils/appointment/appointment-schedule';
import { createTableState } from '../../../utils/shared/table-state';
import { EmptyState } from '../../shared/empty-state';
import { KpiCard } from '../../shared/kpi-card';
import { TablePager } from '../../shared/table-pager';
import { AppointmentFormResult } from '../appointment-form/appointment-form';

@Component({
  selector: 'app-appointment-list',
  imports: [RouterLink, SortHeader, TablePager, KpiCard, EmptyState],
  templateUrl: './appointment-list.html',
})
export class AppointmentList {
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly dialogs = inject(AppointmentDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  // /agenda?tutorId=... muestra solo las citas de ese tutor (filtro de la API).
  readonly tutorId = input<string | undefined>();

  protected readonly periods: { value: AppointmentPeriod; label: string }[] = [
    { value: 'upcoming', label: 'Próximas' },
    { value: 'today', label: 'Hoy' },
    { value: 'past', label: 'Pasadas' },
    { value: 'all', label: 'Todas' },
  ];
  protected readonly statuses = APPOINTMENT_STATUSES;

  // Filtros del navegador
  protected readonly search = signal('');
  protected readonly period = signal<AppointmentPeriod>('upcoming');
  protected readonly status = signal<AppointmentStatus | ''>('');
  protected readonly doctor = signal('');
  protected readonly onlyMine = signal(false);
  private readonly myDoctorId = signal<string | null>(null);
  protected readonly canFilterMine = computed(() => this.myDoctorId() !== null);

  private readonly refresh = signal(0);
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Citas cuyo cambio ya se envió a RabbitMQ y todavía no se ve aplicado.
  protected readonly processing = signal<ReadonlySet<string>>(new Set());

  // Si el usuario es un médico, "solo mis citas" parte activado.
  private readonly scoped = computed(() => {
    const mine = this.onlyMine() ? this.myDoctorId() : null;
    return mine
      ? this.appointments().filter((appointment) => appointment.doctorId === mine)
      : this.appointments();
  });

  protected readonly kpis = computed(() => appointmentKpis(this.scoped(), todayIso()));

  protected readonly doctorOptions = computed(() => {
    const byId = new Map<string, string>();
    this.scoped().forEach((appointment) =>
      byId.set(appointment.doctorId, appointment.doctorName ?? 'Sin nombre'),
    );
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  });

  protected readonly visible = computed(() =>
    filterAppointments(
      this.scoped(),
      {
        period: this.period(),
        status: this.status(),
        doctorId: this.doctor(),
        search: this.search(),
      },
      todayIso(),
    ),
  );

  protected readonly tutorName = computed(
    () => this.appointments().find((appointment) => appointment.tutorName)?.tutorName ?? null,
  );

  protected readonly table = createTableState(this.visible, {
    sortKey: 'when',
    accessors: {
      when: (a) => `${a.appointmentDate}T${a.appointmentTime}`,
      patient: (a) => a.petName,
      doctor: (a) => a.doctorName,
      type: (a) => a.appointmentTypeName,
      status: (a) => statusLabel(a.status),
    },
  });

  protected readonly allowedActions = allowedActions;
  protected readonly dateLabel = dateLabel;
  protected readonly timeLabel = timeLabel;
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;
  protected readonly statusIcon = statusIcon;
  protected readonly todayIso = todayIso;

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const tutorId = this.tutorId();
      this.loading.set(true);
      this.error.set(null);
      const subscription = this.appointmentService.list({ tutorId }).subscribe({
        next: (appointments) => {
          this.appointments.set(appointments);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.appointments.set([]);
          this.loading.set(false);
          this.error.set(appointmentErrorMessage(error, 'No se pudieron cargar las citas'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // La API no filtra por médico: se ubica al médico de la sesión para ofrecer "solo mis citas".
    // La API de médicos exige la sede activa: sin sede no se puede ubicar al médico.
    const headquarterId = this.session.headquarterId();
    if (!headquarterId) {
      return;
    }
    this.doctorService.list(headquarterId).subscribe({
      next: (doctors) => {
        const personId = this.session.profile()?.personId;
        const mine = doctors.find((doctor) => doctor.idPerson === personId)?.id ?? null;
        this.myDoctorId.set(mine);
        if (mine && !this.session.isAdmin()) {
          this.onlyMine.set(true);
        }
      },
      error: () => undefined,
    });
  }

  protected isProcessing(id: string): boolean {
    return this.processing().has(id);
  }

  protected create(): void {
    this.dialogs.appointment(this.appointments()).subscribe((result) => this.afterSubmit(result));
  }

  protected edit(appointment: Appointment): void {
    this.dialogs
      .appointment(this.appointments(), appointment)
      .subscribe((result) => this.afterSubmit(result));
  }

  protected confirmAppointment(appointment: Appointment): void {
    this.changeStatus(appointment, 'CONFIRMED', null, 'La cita quedó confirmada');
  }

  protected complete(appointment: Appointment): void {
    this.confirm(
      'Completar la cita',
      `La cita de ${appointment.petName ?? 'la mascota'} pasará a completada y ya no se podrá cancelar.`,
      'Completar',
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.changeStatus(appointment, 'COMPLETED', null, 'La cita quedó completada');
      }
    });
  }

  protected cancel(appointment: Appointment): void {
    this.dialogs
      .cancellation(appointment)
      .subscribe((reason) =>
        this.changeStatus(appointment, 'CANCELLED', reason, 'La cita quedó cancelada'),
      );
  }

  protected reactivate(appointment: Appointment): void {
    this.confirm(
      'Reactivar la cita',
      'Volverá a pendiente y se revisará de nuevo que el médico siga libre a esa hora.',
      'Reactivar',
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.changeStatus(appointment, 'PENDING', null, 'La cita volvió a estar pendiente');
      }
    });
  }

  // Borrar es síncrono (no pasa por RabbitMQ). Para conservar el historial se recomienda cancelar.
  protected remove(appointment: Appointment): void {
    this.confirm(
      'Eliminar la cita',
      'Se borrará para siempre. Si solo quieres liberar el horario, mejor cancélala.',
      'Eliminar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.appointmentService.remove(appointment.id).subscribe({
        next: () => {
          this.appointments.update((list) => list.filter((item) => item.id !== appointment.id));
          this.toast.success('La cita se eliminó');
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(appointmentErrorMessage(error, 'No se pudo eliminar la cita')),
      });
    });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.period.set('all');
    this.status.set('');
    this.doctor.set('');
  }

  protected setStatus(value: string): void {
    this.status.set(value as AppointmentStatus | '');
  }

  private afterSubmit(result: AppointmentFormResult): void {
    this.watch(
      result.id,
      (saved) => matchesRequest(saved, result.request),
      result.mode === 'create' ? 'La cita quedó agendada' : 'La cita quedó actualizada',
    );
  }

  private changeStatus(
    appointment: Appointment,
    status: AppointmentStatus,
    cancellationReason: string | null,
    done: string,
  ): void {
    this.mark(appointment.id, true);
    this.appointmentService.changeStatus(appointment.id, { status, cancellationReason }).subscribe({
      next: () => this.watch(appointment.id, (saved) => saved.status === status, done),
      error: (error: HttpErrorResponse) => {
        this.mark(appointment.id, false);
        this.toast.error(appointmentErrorMessage(error, 'No se pudo cambiar el estado'));
      },
    });
  }

  // La API respondió 202: el mensaje salió hacia RabbitMQ. Se consulta la cita hasta ver el cambio
  // aplicado por el procesador y se refresca la lista.
  private watch(id: string, isApplied: (saved: Appointment) => boolean, done: string): void {
    this.toast.info('Solicitud recibida: el procesador de salud la está aplicando');
    this.mark(id, true);
    this.appointmentService.waitUntil(id, isApplied).subscribe((saved) => {
      this.mark(id, false);
      if (saved) {
        this.toast.success(done);
      } else {
        this.toast.info(
          'Aún no se ve el cambio. Revisa que el procesador de salud esté encendido y mira su registro',
        );
      }
      this.refresh.update((value) => value + 1);
    });
  }

  private mark(id: string, processing: boolean): void {
    this.processing.update((current) => {
      const next = new Set(current);
      if (processing) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}

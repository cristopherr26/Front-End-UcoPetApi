import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { ProcedureService } from '../../../services/procedure/procedure.service';
import { HealthPlan } from '../../../models/health-plan/health-plan.model';
import { HealthPlanCoverage } from '../../../models/health-plan/health-plan-coverage.model';
import { Procedure } from '../../../models/procedure/procedure.model';
import { HEALTH_PLAN_COVERAGE_RULES } from '../../../utils/health-plan/form-rules';

@Component({
  selector: 'app-health-plan-coverage-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './health-plan-coverage-modal.html'
})
export class HealthPlanCoverageModal implements OnInit {
  private _plan!: HealthPlan;

  @Input()
  set plan(value: HealthPlan) {
    this._plan = value;
    if (this._plan?.id) {
      this.loadCoverages();
    }
  }
  get plan(): HealthPlan {
    return this._plan;
  }

  @Output() closeModal = new EventEmitter<void>();

  coverages: HealthPlanCoverage[] = [];
  servicesCatalog: any[] = [];
  proceduresCatalog: Procedure[] = [];

  coverageForm: FormGroup;
  isEditing = false;
  editingCoverageId: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private healthPlanService: HealthPlanService,
    private procedureService: ProcedureService,
    private cdr: ChangeDetectorRef
  ) {
    this.coverageForm = this.fb.group({
      serviceId: ['', HEALTH_PLAN_COVERAGE_RULES.serviceId],
      procedureId: ['', HEALTH_PLAN_COVERAGE_RULES.procedureId],
      coveragePercentage: [80, HEALTH_PLAN_COVERAGE_RULES.coveragePercentage],
      coverageLimit: [100000, HEALTH_PLAN_COVERAGE_RULES.coverageLimit]
    });
  }

  ngOnInit(): void {
    this.loadServicesCatalog();
    this.loadProceduresCatalog();
  }

  loadServicesCatalog(): void {
    this.healthPlanService.getServices().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
        this.servicesCatalog = list.filter(
          (s: any) => s && s.id && s.name && s.active !== false && isNaN(Number(s.name))
        );
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error al cargar el catálogo de servicios desde la BD:', err);
        this.servicesCatalog = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadProceduresCatalog(): void {
    this.procedureService.getActive().subscribe({
      next: (data: Procedure[]) => {
        this.proceduresCatalog = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error al cargar procedimientos desde la API:', err);
        this.proceduresCatalog = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadCoverages(): void {
    if (!this.plan?.id) return;

    this.healthPlanService.getCoverages(this.plan.id).subscribe({
      next: (response: any) => {
        this.coverages = Array.isArray(response)
          ? response
          : (response?.data || response?.content || response?.body || []);
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error al cargar coberturas:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getServiceName(serviceId: string): string {
    const service = this.servicesCatalog.find((s) => s.id === serviceId);
    return service ? service.name : serviceId;
  }

  getProcedureName(procedureId?: string): string {
    if (!procedureId) return 'N/A';
    const procedure = this.proceduresCatalog.find((p) => p.id === procedureId);
    if (!procedure) return procedureId;

    // Formato limpio para la tabla: Tipo (Código - Descripción)
    const typePart = procedure.type ? `${procedure.type}` : '';
    const codePart = procedure.code ? `[${procedure.code}]` : '';
    const descPart = procedure.description ? ` - ${procedure.description}` : '';

    return `${typePart} ${codePart}${descPart}`;
  }

  // Método auxiliar para obtener el procedimiento seleccionado actualmente en el formulario
  getSelectedProcedure(): Procedure | undefined {
    const procedureId = this.coverageForm.get('procedureId')?.value;
    if (!procedureId) return undefined;
    return this.proceduresCatalog.find((p) => p.id === procedureId);
  }

  saveCoverage(): void {
    if (this.coverageForm.invalid || !this.plan.id) {
      this.coverageForm.markAllAsTouched();
      return;
    }

    const formValue = this.coverageForm.getRawValue();

    const isDuplicate = this.coverages.some(
      (c) =>
        c.serviceId === formValue.serviceId &&
        c.procedureId === formValue.procedureId &&
        c.id !== this.editingCoverageId
    );

    if (isDuplicate) {
      this.errorMessage = 'Esta póliza ya tiene registrada una cobertura para el servicio y procedimiento seleccionados.';
      return;
    }

    this.errorMessage = null;

    const payload: HealthPlanCoverage = {
      healthPlanId: this.plan.id,
      serviceId: formValue.serviceId,
      procedureId: formValue.procedureId,
      coveragePercentage: Number(formValue.coveragePercentage),
      coverageLimit: Number(formValue.coverageLimit)
    };

    if (this.isEditing && this.editingCoverageId) {
      this.healthPlanService.updateCoverage(this.plan.id, this.editingCoverageId, payload).subscribe({
        next: () => {
          this.resetForm();
          this.loadCoverages();
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Error al actualizar la cobertura.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.healthPlanService.createCoverage(this.plan.id, payload).subscribe({
        next: () => {
          this.resetForm();
          this.loadCoverages();
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Error al asociar la cobertura.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  editCoverage(cov: HealthPlanCoverage): void {
    this.isEditing = true;
    this.editingCoverageId = cov.id || null;
    
    this.coverageForm.patchValue({
      serviceId: cov.serviceId,
      procedureId: cov.procedureId,
      coveragePercentage: cov.coveragePercentage,
      coverageLimit: cov.coverageLimit
    });

    this.coverageForm.get('serviceId')?.disable();
    this.cdr.detectChanges();
  }

  deleteCoverage(coverageId?: string): void {
    if (!coverageId || !this.plan.id || !confirm('¿Desea desactivar esta cobertura?')) return;

    this.healthPlanService.deleteCoverage(this.plan.id, coverageId).subscribe({
      next: () => this.loadCoverages(),
      error: (err: unknown) => {
        console.error('Error al desactivar cobertura:', err);
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingCoverageId = null;
    
    this.coverageForm.reset({
      serviceId: '',
      procedureId: '',
      coveragePercentage: 80,
      coverageLimit: 100000
    });

    this.coverageForm.get('serviceId')?.enable();
    this.cdr.detectChanges();
  }

  close(): void {
    this.closeModal.emit();
  }
}
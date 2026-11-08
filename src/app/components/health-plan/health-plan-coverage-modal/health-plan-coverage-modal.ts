import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { HealthPlan } from '../../../models/health-plan/health-plan.model';
import { HealthPlanCoverage } from '../../../models/health-plan/health-plan-coverage.model';
import { HEALTH_PLAN_COVERAGE_RULES } from '../../../utils/health-plan/form-rules';

@Component({
  selector: 'app-health-plan-coverage-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './health-plan-coverage-modal.html'
})
export class HealthPlanCoverageModal implements OnInit {
  
  // Usamos un setter para asegurar que cargue las coberturas apenas llegue el plan
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
  proceduresCatalog: any[] = [];

  coverageForm: FormGroup;
  isEditing = false;
  editingCoverageId: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private healthPlanService: HealthPlanService
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
    if (this.plan?.id) {
      this.loadCoverages();
    }
  }

  loadServicesCatalog(): void {
    this.healthPlanService.getServices().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          this.servicesCatalog = list.filter(
            (s: any) => s && s.id && s.name && s.active !== false && isNaN(Number(s.name))
          );
        } else {
          this.servicesCatalog = this.getServicesFallback();
        }
      },
      error: () => {
        this.servicesCatalog = this.getServicesFallback();
      }
    });
  }

  private getServicesFallback(): any[] {
    return [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Consulta veterinaria', price: 50000 },
      { id: '4fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Vacunación', price: 50000 }
    ];
  }

  loadProceduresCatalog(): void {
    this.proceduresCatalog = [
      { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Consulta Médica General' },
      { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'Vacunación Completa Canina/Felina' },
      { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Procedimiento Profiláctico / Limpieza' }
    ];
  }

  loadCoverages(): void {
    if (!this.plan?.id) return;
    
    this.healthPlanService.getCoverages(this.plan.id).subscribe({
      next: (response: any) => {
        const list = Array.isArray(response) ? response : (response?.data || response?.body || []);
        this.coverages = list;
      },
      error: (err: unknown) => {
        console.error('Error al cargar coberturas:', err);
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
    return procedure ? procedure.name : procedureId;
  }

  saveCoverage(): void {
    if (this.coverageForm.invalid || !this.plan.id) {
      this.coverageForm.markAllAsTouched();
      return;
    }

    const formValue = this.coverageForm.value;

    const isDuplicate = this.coverages.some(
      (c) => c.serviceId === formValue.serviceId && 
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
        error: (err: any) => (this.errorMessage = err?.error?.message || 'Error al actualizar la cobertura.')
      });
    } else {
      this.healthPlanService.createCoverage(this.plan.id, payload).subscribe({
        next: () => {
          this.resetForm();
          this.loadCoverages(); // Refresca la tabla automáticamente
        },
        error: (err: any) => (this.errorMessage = err?.error?.message || 'Error al asociar la cobertura.')
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
  }

  deleteCoverage(coverageId?: string): void {
    if (!coverageId || !this.plan.id || !confirm('¿Desea desactivar esta cobertura?')) return;

    this.healthPlanService.deleteCoverage(this.plan.id, coverageId).subscribe({
      next: () => this.loadCoverages(),
      error: (err: unknown) => console.error('Error al desactivar cobertura:', err)
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
  }

  close(): void {
    this.closeModal.emit();
  }
}
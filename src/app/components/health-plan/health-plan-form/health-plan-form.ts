import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { HEALTH_PLAN_RULES } from '../../../utils/health-plan/form-rules';

@Component({
  selector: 'app-health-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './health-plan-form.html'
})
export class HealthPlanForm implements OnInit {
  planForm: FormGroup;
  isEditMode = false;
  planId: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private healthPlanService: HealthPlanService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.planForm = this.fb.group({
      name: ['', HEALTH_PLAN_RULES.name],
      insuranceCompany: ['', HEALTH_PLAN_RULES.insuranceCompany],
      description: ['', HEALTH_PLAN_RULES.description]
    });
  }

  ngOnInit(): void {
    this.planId = this.route.snapshot.paramMap.get('id');
    if (this.planId) {
      this.isEditMode = true;

      // Deshabilitar la edición del campo Aseguradora
      this.planForm.get('insuranceCompany')?.disable();

      this.healthPlanService.getHealthPlanById(this.planId).subscribe({
        next: (plan) => {
          this.planForm.patchValue(plan);
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Error al cargar la póliza:', err);
          this.errorMessage = 'No se pudo cargar la información de la póliza.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;

    // getRawValue() extrae los valores incluyendo los campos deshabilitados
    const planPayload = {
      ...this.planForm.getRawValue(),
      status: 'ACTIVA'
    };

    if (this.isEditMode && this.planId) {
      this.healthPlanService.updateHealthPlan(this.planId, planPayload).subscribe({
        next: () => this.router.navigate(['/polizas']),
        error: (err: any) => {
          console.error('Error al actualizar póliza:', err);
          this.errorMessage = err?.error?.message || 'Ocurrió un error al actualizar la póliza.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.healthPlanService.createHealthPlan(planPayload).subscribe({
        next: () => this.router.navigate(['/polizas']),
        error: (err: any) => {
          console.error('Error al crear póliza:', err);
          this.errorMessage = err?.error?.message || 'Ocurrió un error al guardar la póliza en la base de datos.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
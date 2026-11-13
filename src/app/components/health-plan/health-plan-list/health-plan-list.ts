import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { HealthPlan } from '../../../models/health-plan/health-plan.model';
import { HealthPlanCoverageModal } from '../health-plan-coverage-modal/health-plan-coverage-modal';

@Component({
  selector: 'app-health-plan-list',
  standalone: true,
  imports: [CommonModule, RouterLink, HealthPlanCoverageModal],
  templateUrl: './health-plan-list.html'
})
export class HealthPlanList implements OnInit {
  healthPlans: HealthPlan[] = [];
  selectedPlanForCoverage: HealthPlan | null = null;

  constructor(
    private healthPlanService: HealthPlanService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHealthPlans();
  }

  loadHealthPlans(): void {
    this.healthPlanService.getHealthPlans().subscribe({
      next: (data: any) => {
        console.log('Pólizas recibidas desde la API:', data);
        if (Array.isArray(data)) {
          this.healthPlans = data;
        } else if (Array.isArray(data?.content)) {
          this.healthPlans = data.content;
        } else if (Array.isArray(data?.data)) {
          this.healthPlans = data.data;
        } else {
          this.healthPlans = [];
        }
        // Forzamos a Angular a refrescar el DOM con el nuevo arreglo
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('Error al cargar pólizas:', err)
    });
  }

  deletePlan(id?: string): void {
    if (!id || !confirm('¿Desea desactivar este plan de salud?')) return;

    this.healthPlanService.deleteHealthPlan(id).subscribe({
      next: () => this.loadHealthPlans(),
      error: (err: unknown) => console.error('Error al desactivar el plan:', err)
    });
  }

  openCoverageModal(plan: HealthPlan): void {
    this.selectedPlanForCoverage = plan;
  }

  closeCoverageModal(): void {
    this.selectedPlanForCoverage = null;
  }
}
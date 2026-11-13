import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthPlan } from '../../models/health-plan/health-plan.model';
import { HealthPlanCoverage } from '../../models/health-plan/health-plan-coverage.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthPlanService {
  private apiUrl = `${environment.apiUrl}/healthplans`;
  private servicesUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  // Pólizas
  getHealthPlans(): Observable<HealthPlan[]> {
    return this.http.get<HealthPlan[]>(this.apiUrl);
  }

  getHealthPlanById(id: string): Observable<HealthPlan> {
    return this.http.get<HealthPlan>(`${this.apiUrl}/${id}`);
  }

  createHealthPlan(plan: HealthPlan): Observable<HealthPlan> {
    return this.http.post<HealthPlan>(this.apiUrl, plan);
  }

  updateHealthPlan(id: string, plan: HealthPlan): Observable<HealthPlan> {
    return this.http.put<HealthPlan>(`${this.apiUrl}/${id}`, plan);
  }

  deleteHealthPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Coberturas
  getCoverages(planId: string): Observable<HealthPlanCoverage[]> {
    return this.http.get<HealthPlanCoverage[]>(`${this.apiUrl}/${planId}/coverages`);
  }

  createCoverage(planId: string, coverage: HealthPlanCoverage): Observable<HealthPlanCoverage> {
    return this.http.post<HealthPlanCoverage>(`${this.apiUrl}/${planId}/coverages`, coverage);
  }

  updateCoverage(planId: string, coverageId: string, coverage: HealthPlanCoverage): Observable<HealthPlanCoverage> {
    return this.http.put<HealthPlanCoverage>(`${this.apiUrl}/${planId}/coverages/${coverageId}`, coverage);
  }

  deleteCoverage(planId: string, coverageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${planId}/coverages/${coverageId}`);
  }

  // Catálogo de Servicios
  getServices(): Observable<any[]> {
    return this.http.get<any[]>(this.servicesUrl);
  }
}
import { Validators } from '@angular/forms';

const PATTERN_PLAN_NAME = /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\+\-]+$/;
const PATTERN_COMPANY = /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\.\-\&]+$/;
const PATTERN_DESCRIPTION = /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\.\,\;\:\(\)\"\'\%\+\-]+$/;

export const HEALTH_PLAN_RULES = {
  name: [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(80),
    Validators.pattern(PATTERN_PLAN_NAME)
  ],
  insuranceCompany: [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(100),
    Validators.pattern(PATTERN_COMPANY)
  ],
  description: [
    Validators.required,
    Validators.minLength(10),
    Validators.maxLength(500),
    Validators.pattern(PATTERN_DESCRIPTION)
  ]
};

export const HEALTH_PLAN_COVERAGE_RULES = {
  serviceId: [
    Validators.required
  ],
  procedureId: [
    Validators.required
  ],
  coveragePercentage: [
    Validators.required,
    Validators.min(1),
    Validators.max(80)
  ],
  coverageLimit: [
    Validators.required,
    Validators.min(1000),   
    Validators.max(5000000),  
    Validators.pattern(/^[0-9]+$/)
  ]
};
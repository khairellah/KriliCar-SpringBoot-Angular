// Frontend/src/app/features/company/kpi/company-kpi.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CompanyKpiService } from '../services/company-kpi.service';
import { CompanyKpiDTO } from '../../../core/models/company/company-kpi.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

/**
 * US-8.2 : Dashboard KPI de la Company connectée (§5.5 Spec Globale, §4.3 Spec Frontend).
 * GET /api/v1/companies/kpi/my -> CompanyKpiDTO. Lecture seule, aucune action
 * de mutation sur cet écran.
 *
 * État 100% local (Signals) : cet écran est le seul consommateur de ces
 * données, donc hors du périmètre "état global transverse" défini au §1 de
 * la Spec Frontend — pas de Store NgRx ici (même choix que AdminKpiComponent, US-8.1).
 */
@Component({
  selector: 'app-company-kpi',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './company-kpi.component.html',
  styleUrl: './company-kpi.component.scss'
})
export class CompanyKpiComponent {
  private readonly companyKpiService = inject(CompanyKpiService);

  readonly kpi = signal<CompanyKpiDTO | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadKpi();
  }

  private loadKpi(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.companyKpiService.getMyKpi().subscribe({
      next: (kpi) => {
        this.kpi.set(kpi);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage.set(
          body?.message ?? 'Impossible de charger vos indicateurs. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}
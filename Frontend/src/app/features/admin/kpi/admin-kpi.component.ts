// Frontend/src/app/features/admin/kpi/admin-kpi.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminKpiService } from '../services/admin-kpi.service';
import { AdminKpiDTO } from '../../../core/models/admin/admin-kpi.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

/**
 * US-8.1 : Dashboard KPI globaux de la plateforme (Admin).
 * GET /api/v1/admins/kpi/global -> AdminKpiDTO. Lecture seule, aucune action
 * de mutation sur cet écran (cf. AdminCompanyListComponent / AdminClientListComponent
 * pour les actions d'activation/désactivation, hors périmètre ici).
 *
 * État 100% local (Signals) : cet écran est le seul consommateur de ces
 * données, donc hors du périmètre "état global transverse" défini au §1 de
 * la Spec Frontend (réservé à la session utilisateur et au badge de
 * notifications Company) — pas de Store NgRx ici.
 */
@Component({
  selector: 'app-admin-kpi',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './admin-kpi.component.html',
  styleUrl: './admin-kpi.component.scss'
})
export class AdminKpiComponent {
  private readonly adminKpiService = inject(AdminKpiService);

  readonly kpi = signal<AdminKpiDTO | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadKpi();
  }

  private loadKpi(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminKpiService.getGlobalKpi().subscribe({
      next: (kpi) => {
        this.kpi.set(kpi);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage.set(
          body?.message ?? 'Impossible de charger les indicateurs. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}
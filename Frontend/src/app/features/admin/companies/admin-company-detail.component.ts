import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { AdminCompanyService } from '../services/admin-company.service';
import { CompanyDetailResponse } from '../../../core/models/admin/company-detail-response.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { City, CarAvailability } from '../../../core/models/enums';

/**
 * US-7.5 : Détail complet d'une société (vue Admin), lecture seule.
 * GET /api/v1/admins/companies/{code} -> CompanyDetailResponse
 * (profil complet + liste des voitures + statistiques).
 *
 * Aucune action de mutation ici : activation/désactivation (US-7.2) et
 * validation du Boost (US-6.2) restent pilotées depuis leurs écrans dédiés
 * (AdminCompanyListComponent / AdminBoostPendingComponent).
 */
@Component({
  selector: 'app-admin-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './admin-company-detail.component.html',
  styleUrl: './admin-company-detail.component.scss'
})
export class AdminCompanyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminCompanyService = inject(AdminCompanyService);

  private readonly code = this.route.snapshot.paramMap.get('code')!;

  readonly company = signal<CompanyDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly carsDisplayedColumns = ['brandModel', 'vin', 'year', 'price', 'availability'] as const;

  readonly cityLabels: Record<City, string> = {
    RABAT: 'Rabat',
    CASABLANCA: 'Casablanca',
    MARRAKECH: 'Marrakech',
    TANGIER: 'Tanger'
  };

  readonly availabilityLabels: Record<CarAvailability, string> = {
    AVAILABLE: 'Disponible',
    MAINTENANCE: 'En maintenance',
    RESERVED: 'Réservée'
  };

  constructor() {
    this.loadDetail();
  }

  private loadDetail(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminCompanyService.getCompanyDetail(this.code).subscribe({
      next: (company) => {
        this.company.set(company);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage.set(
          body?.message ??
            'Impossible de charger le détail de cette société. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  availabilityClass(availability: CarAvailability): string {
    return 'status-' + availability.toLowerCase();
  }

  getAvailabilityLabel(availability: CarAvailability): string {
    return this.availabilityLabels[availability];
  }
}
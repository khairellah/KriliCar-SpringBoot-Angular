import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { CompanyService } from '../services/company.service';
import { CompanyProfileResponse } from '../../../core/models/company/company-profile-response.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

/**
 * US-6.1 : Écran "Boost" de la Company connectée.
 * Un seul bouton "Demander le Boost", désactivé si `isBooster === true`
 * ou `boostRequested === true` (règle d'idempotence, §4.3 Spec Frontend).
 * La validation Admin (US-6.2) et la mise en avant en recherche (US-6.3)
 * sont hors périmètre de cette US.
 */
@Component({
  selector: 'app-company-boost',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './company-boost.component.html',
  styleUrl: './company-boost.component.scss'
})
export class CompanyBoostComponent {
  private readonly companyService = inject(CompanyService);

  readonly profile = signal<CompanyProfileResponse | null>(null);
  readonly isInitialLoading = signal(true);
  readonly initialLoadError = signal<string | null>(null);

  readonly isRequesting = signal(false);
  readonly requestErrorMessage = signal<string | null>(null);
  readonly requestSuccessMessage = signal<string | null>(null);

  // Idempotence : reflète exactement la règle backend (CompanyServiceImpl.requestBoost)
  readonly canRequestBoost = computed(() => {
    const p = this.profile();
    return !!p && !p.isBooster && !p.boostRequested;
  });

  readonly statusLabel = computed(() => {
    const p = this.profile();
    if (!p) return '';
    if (p.isBooster) return 'Boost actif';
    if (p.boostRequested) return 'Demande en attente de validation';
    return 'Boost non activé';
  });

  readonly statusClass = computed(() => {
    const p = this.profile();
    if (!p) return '';
    if (p.isBooster) return 'status-active';
    if (p.boostRequested) return 'status-pending';
    return 'status-none';
  });

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isInitialLoading.set(true);
    this.initialLoadError.set(null);

    this.companyService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isInitialLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isInitialLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.initialLoadError.set(
          body?.message ??
            'Impossible de charger les informations Boost. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  requestBoost(): void {
    if (!this.canRequestBoost()) {
      return;
    }

    this.requestErrorMessage.set(null);
    this.requestSuccessMessage.set(null);
    this.isRequesting.set(true);

    this.companyService.requestBoost().subscribe({
      next: (updated) => {
        this.isRequesting.set(false);
        this.profile.set(updated);
        this.requestSuccessMessage.set(
          "Votre demande de Boost a été enregistrée. L'administrateur va la traiter prochainement."
        );
      },
      error: (err: HttpErrorResponse) => {
        this.isRequesting.set(false);
        const body = err.error as ErrorResponse | undefined;
        // 409 : idempotence (Boost déjà actif ou demande déjà en attente),
        // cf. CompanyServiceImpl.requestBoost — message backend affiché tel quel.
        this.requestErrorMessage.set(
          body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}
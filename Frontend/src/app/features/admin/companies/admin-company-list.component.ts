import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminCompanyService } from '../services/admin-company.service';
import { CompanyAdminSummaryDTO } from '../../../core/models/admin/company-admin-summary.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { City } from '../../../core/models/enums';

/** Filtre à 3 états : '' = Tous, 'true' = Oui, 'false' = Non (jamais transmis tel quel au backend). */
type TriStateFilter = '' | 'true' | 'false';

interface FiltersForm {
  active: FormControl<TriStateFilter>;
  boosted: FormControl<TriStateFilter>;
}

/**
 * US-7.1 : Liste des sociétés (vue Admin), filtrable par statut de compte
 * (active) et statut Boost (boosted), filtres optionnels et combinables.
 *
 * US-7.2 : Ajoute l'action d'activation/désactivation de compte
 * (PATCH /api/v1/admins/companies/{code}/activate|deactivate) :
 * - Un seul bouton contextuel par ligne : "Désactiver" si le compte est actif,
 *   "Activer" s'il est inactif — jamais les deux boutons simultanément, pour
 *   ne jamais laisser l'utilisateur déclencher une erreur 409 évitable
 *   (idempotence stricte côté backend, cf. CompanyServiceImpl.setCompanyActiveStatus).
 * - Confirmation inline avant l'appel API (même pattern que
 *   AdminBoostPendingComponent / CompanyReservationListComponent).
 * - Effet immédiat côté backend : login bloqué + JWT déjà émis inopérant dès
 *   la requête suivante — un avertissement est affiché avant confirmation
 *   d'une désactivation.
 *
 * US-7.5 (détail complet) reste hors périmètre de ce composant.
 */
@Component({
  selector: 'app-admin-company-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './admin-company-list.component.html',
  styleUrl: './admin-company-list.component.scss'
})
export class AdminCompanyListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminCompanyService = inject(AdminCompanyService);

  readonly displayedColumns = [
    'companyName',
    'email',
    'phone',
    'city',
    'active',
    'boostStatus',
    'createdAt',
    'actions'
  ] as const;

  readonly cityOptions: ReadonlyArray<{ value: City; label: string }> = [
    { value: 'RABAT', label: 'Rabat' },
    { value: 'CASABLANCA', label: 'Casablanca' },
    { value: 'MARRAKECH', label: 'Marrakech' },
    { value: 'TANGIER', label: 'Tanger' }
  ];

  private cityLabel(city: City): string {
    return this.cityOptions.find((o) => o.value === city)?.label ?? city;
  }

  getCityLabel(city: City): string {
    return this.cityLabel(city);
  }

  readonly activeFilterOptions: ReadonlyArray<{ value: TriStateFilter; label: string }> = [
    { value: '', label: 'Tous' },
    { value: 'true', label: 'Actifs' },
    { value: 'false', label: 'Inactifs' }
  ];

  readonly boostedFilterOptions: ReadonlyArray<{ value: TriStateFilter; label: string }> = [
    { value: '', label: 'Tous' },
    { value: 'true', label: 'Boostées' },
    { value: 'false', label: 'Non boostées' }
  ];

  readonly form: FormGroup<FiltersForm> = this.fb.nonNullable.group({
    active: this.fb.nonNullable.control<TriStateFilter>(''),
    boosted: this.fb.nonNullable.control<TriStateFilter>('')
  });

  readonly companies = signal<CompanyAdminSummaryDTO[]>([]);
  readonly isListLoading = signal(true);
  readonly listErrorMessage = signal<string | null>(null);

  // Filtre "active" réellement appliqué à la dernière recherche : utilisé
  // pour décider si une ligne doit être retirée de la liste après un
  // changement de statut qui ne correspond plus au filtre actif (US-7.2).
  private lastActiveFilter: boolean | undefined = undefined;

  // ============================ US-7.2 : Activation / Désactivation ============================
  /** Code de la société en attente de confirmation inline, et action ciblée. */
  readonly confirmingAction = signal<{ code: string; targetActive: boolean } | null>(null);
  readonly updatingCode = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadCompanies();
  }

  onSubmit(): void {
    this.loadCompanies();
  }

  onReset(): void {
    this.form.reset({ active: '', boosted: '' });
    this.loadCompanies();
  }

  /** Convertit le filtre 3-états du formulaire ('' | 'true' | 'false') en boolean|undefined. */
  private toBooleanOrUndefined(value: TriStateFilter): boolean | undefined {
    if (value === '') {
      return undefined;
    }
    return value === 'true';
  }

  private loadCompanies(): void {
    this.isListLoading.set(true);
    this.listErrorMessage.set(null);
    this.actionErrorMessage.set(null);

    const { active, boosted } = this.form.getRawValue();
    const activeFilter = this.toBooleanOrUndefined(active);
    this.lastActiveFilter = activeFilter;

    this.adminCompanyService.getCompanies(activeFilter, this.toBooleanOrUndefined(boosted)).subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.isListLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isListLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.listErrorMessage.set(
          body?.message ?? 'Impossible de charger les sociétés. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  // ============================ US-7.2 : Actions activation/désactivation ============================

  /** true = demande d'activation, false = demande de désactivation. */
  askToggleActive(code: string, targetActive: boolean): void {
    this.actionErrorMessage.set(null);
    this.confirmingAction.set({ code, targetActive });
  }

  cancelToggleActive(): void {
    this.confirmingAction.set(null);
  }

  isConfirming(code: string): boolean {
    return this.confirmingAction()?.code === code;
  }

  confirmToggleActive(code: string): void {
    const action = this.confirmingAction();
    if (!action || action.code !== code) {
      return;
    }

    this.actionErrorMessage.set(null);
    this.updatingCode.set(code);

    const request$ = action.targetActive
      ? this.adminCompanyService.activateCompany(code)
      : this.adminCompanyService.deactivateCompany(code);

    request$.subscribe({
      next: (updated) => {
        this.updatingCode.set(null);
        this.confirmingAction.set(null);

        // Si un filtre "active" est appliqué et que le nouvel état ne
        // correspond plus, la société n'apparaîtrait plus dans une vraie
        // recherche : on la retire directement de la liste locale plutôt
        // que de forcer un rechargement complet.
        if (this.lastActiveFilter !== undefined && updated.active !== this.lastActiveFilter) {
          this.companies.update((list) => list.filter((c) => c.code !== code));
          return;
        }

        this.companies.update((list) =>
          list.map((c) => (c.code === updated.code ? updated : c))
        );
      },
      error: (err: HttpErrorResponse) => {
        this.updatingCode.set(null);
        this.confirmingAction.set(null);
        const body = err.error as ErrorResponse | undefined;

        if (err.status === 409) {
          // Idempotence : déjà dans l'état demandé (traité entre-temps par un
          // autre Admin) — on recharge la liste pour refléter l'état réel serveur.
          this.actionErrorMessage.set(
            body?.message ?? 'Cette société a déjà été traitée. La liste va être actualisée.'
          );
          this.loadCompanies();
          return;
        }

        if (err.status === 404) {
          this.actionErrorMessage.set(
            body?.message ?? 'Cette société est introuvable. La liste va être actualisée.'
          );
          this.loadCompanies();
          return;
        }

        this.actionErrorMessage.set(
          body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}
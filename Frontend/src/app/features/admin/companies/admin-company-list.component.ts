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
 * Écran en LECTURE SEULE : l'activation/désactivation (US-7.2) et le détail
 * complet (US-7.5) sont hors périmètre de cette US, volontairement absents
 * de ce composant.
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
    MatProgressSpinnerModule
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
    'createdAt'
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

    const { active, boosted } = this.form.getRawValue();

    this.adminCompanyService
      .getCompanies(this.toBooleanOrUndefined(active), this.toBooleanOrUndefined(boosted))
      .subscribe({
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
}
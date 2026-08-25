import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CarService } from '../services/car.service';
import { BrandService } from '../../admin/services/brand.service';
import { ModelService } from '../../admin/services/model.service';
import { Brand } from '../../../core/models/brand.model';
import { Model } from '../../../core/models/model.model';
import { CarDTO } from '../../../core/models/car/car.model';
import { CompanyFleetSearchParams } from '../../../core/models/car/company-fleet-search-params.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { CarAvailability } from '../../../core/models/enums';

interface MyFleetForm {
  brandCode: FormControl<string>;
  modelCode: FormControl<string>;
  availability: FormControl<CarAvailability | ''>;
  minPrice: FormControl<number | null>;
  maxPrice: FormControl<number | null>;
  minMileage: FormControl<number | null>;
  maxMileage: FormControl<number | null>;
  nbrSeats: FormControl<number | null>;
}

/**
 * US-3.4 : "Mon parc" — recherche/filtrage interne du parc de la Company
 * connectée (GET /api/v1/cars/my-fleet). Scope automatique via le token,
 * jamais de companyCode transmis (cf. CarService.searchMyFleet).
 *
 * Reprend le pattern de filtres de CarSearchComponent (US-3.3), avec un
 * filtre `availability` supplémentaire (la Company voit tout son parc,
 * AVAILABLE/MAINTENANCE/RESERVED) et sans filtre `city` (non pertinent).
 */
@Component({
  selector: 'app-my-fleet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './my-fleet.component.html',
  styleUrl: './my-fleet.component.scss'
})
export class MyFleetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carService = inject(CarService);
  private readonly brandService = inject(BrandService);
  private readonly modelService = inject(ModelService);
  private readonly router = inject(Router);

  readonly displayedColumns = ['brandModel', 'vin', 'year', 'price', 'availability', 'actions'] as const;

  readonly availabilityOptions: ReadonlyArray<{ value: CarAvailability | ''; label: string }> = [
    { value: '', label: 'Tous les statuts' },
    { value: 'AVAILABLE', label: 'Disponible' },
    { value: 'MAINTENANCE', label: 'En maintenance' },
    { value: 'RESERVED', label: 'Réservée' }
  ];

  readonly availabilityLabels: Record<CarAvailability, string> = {
    AVAILABLE: 'Disponible',
    MAINTENANCE: 'En maintenance',
    RESERVED: 'Réservée'
  };

  // ============================ Marques / Modèles (selects dépendants) ============================
  readonly brands = signal<Brand[]>([]);
  readonly isBrandsLoading = signal(true);
  readonly brandsErrorMessage = signal<string | null>(null);

  readonly models = signal<Model[]>([]);
  readonly isModelsLoading = signal(false);

  // ============================ Toggle filtres avancés ============================
  readonly showAdvanced = signal(false);

  toggleAdvanced(): void {
    this.showAdvanced.update((v) => !v);
  }

  // ============================ Résultats ============================
  readonly results = signal<CarDTO[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly isSearching = signal(false);
  readonly searchErrorMessage = signal<string | null>(null);
  readonly hasSearched = signal(false);

  // Filtres réellement soumis (distincts des valeurs courantes du formulaire
  // tant que "Rechercher" n'a pas été cliqué — utilisés lors du changement de page).
  private activeFilters: CompanyFleetSearchParams = {};

  readonly form: FormGroup<MyFleetForm> = this.fb.nonNullable.group({
    brandCode: this.fb.nonNullable.control(''),
    modelCode: this.fb.nonNullable.control(''),
    availability: this.fb.nonNullable.control<CarAvailability | ''>(''),
    minPrice: this.fb.control<number | null>(null),
    maxPrice: this.fb.control<number | null>(null),
    minMileage: this.fb.control<number | null>(null),
    maxMileage: this.fb.control<number | null>(null),
    nbrSeats: this.fb.control<number | null>(null)
  });

  constructor() {
    this.loadBrands();

    // Select dépendant Marque -> Modèles (même pattern que CarSearchComponent).
    this.form.controls.brandCode.valueChanges.subscribe((brandCode) => {
      this.form.controls.modelCode.setValue('');
      this.models.set([]);
      if (!brandCode) {
        return;
      }
      this.isModelsLoading.set(true);
      this.modelService.getModelsByBrand(brandCode).subscribe({
        next: (models) => {
          this.models.set(models);
          this.isModelsLoading.set(false);
        },
        error: () => this.isModelsLoading.set(false)
      });
    });

    // Chargement initial : tout le parc, sans filtre.
    this.performSearch();
  }

  private loadBrands(): void {
    this.isBrandsLoading.set(true);
    this.brandsErrorMessage.set(null);

    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.isBrandsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isBrandsLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.brandsErrorMessage.set(
          body?.message ?? 'Impossible de charger les marques. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  onSubmit(): void {
    const raw = this.form.getRawValue();

    // ⚠️ Le backend filtre "brand"/"model" par NOM (LIKE), pas par code
    // (cf. CarRepository.searchCompanyCars) : on résout le nom correspondant
    // au code sélectionné, comme dans CarSearchComponent (US-3.3).
    const selectedBrand = this.brands().find((b) => b.code === raw.brandCode);
    const selectedModel = this.models().find((m) => m.code === raw.modelCode);

    this.activeFilters = {
      brand: selectedBrand?.name,
      model: selectedModel?.name,
      availability: raw.availability || undefined,
      minPrice: raw.minPrice ?? undefined,
      maxPrice: raw.maxPrice ?? undefined,
      minMileage: raw.minMileage ?? undefined,
      maxMileage: raw.maxMileage ?? undefined,
      nbrSeats: raw.nbrSeats ?? undefined
    };

    this.pageIndex.set(0);
    this.performSearch();
  }

  onReset(): void {
    this.form.reset({
      brandCode: '',
      modelCode: '',
      availability: '',
      minPrice: null,
      maxPrice: null,
      minMileage: null,
      maxMileage: null,
      nbrSeats: null
    });
    this.models.set([]);
    this.activeFilters = {};
    this.pageIndex.set(0);
    this.performSearch();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.performSearch();
  }

  goToEdit(code: string): void {
    this.router.navigateByUrl(`/company/cars/${code}/edit`);
  }

  getAvailabilityLabel(availability: CarAvailability): string {
    return this.availabilityLabels[availability];
  }

  private performSearch(): void {
    this.isSearching.set(true);
    this.searchErrorMessage.set(null);

    this.carService.searchMyFleet(this.activeFilters, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.results.set(page.content);
        this.totalElements.set(page.totalElements);
        this.isSearching.set(false);
        this.hasSearched.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isSearching.set(false);
        this.hasSearched.set(true);
        const body = err.error as ErrorResponse | undefined;
        this.searchErrorMessage.set(
          body?.message ?? 'Une erreur est survenue lors de la recherche. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}
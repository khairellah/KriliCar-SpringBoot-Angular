import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CarSearchService } from './services/car-search.service';
import { BrandService } from '../admin/services/brand.service';
import { ModelService } from '../admin/services/model.service';
import { AuthService } from '../../core/auth/auth.service';
import { WishlistService } from '../client/services/wishlist.service';
import { Brand } from '../../core/models/brand.model';
import { Model } from '../../core/models/model.model';
import { CarDTO } from '../../core/models/car/car.model';
import { CarSearchParams } from '../../core/models/car/car-search-params.model';
import { ErrorResponse } from '../../core/models/errors/error-response.model';
import { CarColor, City, FuelType, Gearbox } from '../../core/models/enums';
import { Observable, map } from 'rxjs';

interface SearchForm {
  brandCode: FormControl<string>;
  modelCode: FormControl<string>;
  city: FormControl<City | null>;
  minPrice: FormControl<number | null>;
  maxPrice: FormControl<number | null>;
  minMileage: FormControl<number | null>;
  maxMileage: FormControl<number | null>;
  nbrSeats: FormControl<number | null>;
}

/**
 * US-3.3 : Recherche publique simple/avancée de voitures.
 * US-4.1 (ajout) : toggle cœur sur les cartes résultat, visible uniquement
 * pour un Client connecté, synchronisé avec sa wishlist (WishlistService).
 */
@Component({
  selector: 'app-car-search',
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
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './car-search.component.html',
  styleUrl: './car-search.component.scss'
})
export class CarSearchComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carSearchService = inject(CarSearchService);
  private readonly brandService = inject(BrandService);
  private readonly modelService = inject(ModelService);
  private readonly authService = inject(AuthService);
  private readonly wishlistService = inject(WishlistService);

  readonly cityOptions: ReadonlyArray<{ value: City; label: string }> = [
    { value: 'RABAT', label: 'Rabat' },
    { value: 'CASABLANCA', label: 'Casablanca' },
    { value: 'MARRAKECH', label: 'Marrakech' },
    { value: 'TANGIER', label: 'Tanger' }
  ];

  readonly gearboxLabels: Record<Gearbox, string> = {
    MANUAL: 'Manuelle',
    AUTOMATIC: 'Automatique'
  };

  readonly fuelTypeLabels: Record<FuelType, string> = {
    GASOLINE: 'Essence',
    DIESEL: 'Diesel',
    HYBRID: 'Hybride',
    ELECTRIC: 'Électrique'
  };

  readonly colorLabels: Record<CarColor, string> = {
    WHITE: 'Blanc',
    BLACK: 'Noir',
    GREY: 'Gris',
    RED: 'Rouge',
    BLUE: 'Bleu',
    SILVER: 'Argent',
    GREEN: 'Vert',
    YELLOW: 'Jaune'
  };

  // ============================ Marques / Modèles (selects dépendants) ============================
  readonly brands = signal<Brand[]>([]);
  readonly isBrandsLoading = signal(true);
  readonly brandsErrorMessage = signal<string | null>(null);

  readonly models = signal<Model[]>([]);
  readonly isModelsLoading = signal(false);

  // ============================ Toggle recherche avancée ============================
  readonly showAdvanced = signal(false);

  toggleAdvanced(): void {
    this.showAdvanced.update((v) => !v);
  }

  // ============================ US-4.1 : WishList (toggle cœur) ============================
  readonly isClient = computed(() => this.authService.role() === 'CLIENT');
  readonly togglingWishlistCode = signal<string | null>(null);
  readonly wishlistErrorMessage = signal<string | null>(null);

  // ============================ Résultats ============================
  readonly results = signal<CarDTO[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(12);
  readonly isSearching = signal(false);
  readonly searchErrorMessage = signal<string | null>(null);
  readonly hasSearched = signal(false);

  private activeFilters: CarSearchParams = {};

  readonly form: FormGroup<SearchForm> = this.fb.nonNullable.group({
    brandCode: this.fb.nonNullable.control(''),
    modelCode: this.fb.nonNullable.control(''),
    city: this.fb.control<City | null>(null),
    minPrice: this.fb.control<number | null>(null),
    maxPrice: this.fb.control<number | null>(null),
    minMileage: this.fb.control<number | null>(null),
    maxMileage: this.fb.control<number | null>(null),
    nbrSeats: this.fb.control<number | null>(null)
  });

  constructor() {
    this.loadBrands();

    // US-4.1 : si un Client est connecté, on précharge sa wishlist pour
    // synchroniser l'état des cœurs dès le premier rendu des résultats.
    if (this.isClient()) {
      this.wishlistService.getWishlist().subscribe({ error: () => {} });
    }

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

    const selectedBrand = this.brands().find((b) => b.code === raw.brandCode);
    const selectedModel = this.models().find((m) => m.code === raw.modelCode);

    this.activeFilters = {
      brand: selectedBrand?.name,
      model: selectedModel?.name,
      city: raw.city ?? undefined,
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
      city: null,
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

  private performSearch(): void {
    this.isSearching.set(true);
    this.searchErrorMessage.set(null);

    this.carSearchService
      .searchCars(this.activeFilters, this.pageIndex(), this.pageSize())
      .subscribe({
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
            body?.message ??
              'Une erreur est survenue lors de la recherche. Veuillez réessayer plus tard.'
          );
        }
      });
  }

  // ============================ US-4.1 : Actions WishList ============================

  isInWishlist(carCode: string): boolean {
    return this.wishlistService.isInWishlist(carCode);
  }

    toggleWishlist(carCode: string): void {
    this.wishlistErrorMessage.set(null);
    this.togglingWishlistCode.set(carCode);

    const request$: Observable<unknown> = this.wishlistService.isInWishlist(carCode)
      ? this.wishlistService.removeFromWishlist(carCode)
      : this.wishlistService.addToWishlist(carCode).pipe(map(() => undefined));

    request$.subscribe({
      next: () => this.togglingWishlistCode.set(null),
      error: (err: HttpErrorResponse) => {
        this.togglingWishlistCode.set(null);
        const body = err.error as ErrorResponse | undefined;
        this.wishlistErrorMessage.set(
          body?.message ?? 'Une erreur est survenue lors de la mise à jour de votre wishlist.'
        );
      }
    });
  }
}
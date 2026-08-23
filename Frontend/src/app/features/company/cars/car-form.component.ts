import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CarService } from '../services/car.service';
import { BrandService } from '../../admin/services/brand.service';
import { ModelService } from '../../admin/services/model.service';
import { Brand } from '../../../core/models/brand.model';
import { Model } from '../../../core/models/model.model';
import { CarDTO } from '../../../core/models/car/car.model';
import { CarCreateRequest, CarUpdateRequest } from '../../../core/models/car/car-request.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { CarAvailability, CarColor, FuelType, Gearbox } from '../../../core/models/enums';

interface CarForm {
  vin: FormControl<string>;
  year: FormControl<number | null>;
  mileage: FormControl<number | null>;
  gearbox: FormControl<Gearbox | null>;
  fuelType: FormControl<FuelType | null>;
  color: FormControl<CarColor | null>;
  nbrSeats: FormControl<number | null>;
  price: FormControl<number | null>;
  description: FormControl<string>;
  availability: FormControl<CarAvailability>;
  brandCode: FormControl<string>;
  modelCode: FormControl<string>;
}

@Component({
  selector: 'app-car-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './car-form.component.html',
  styleUrl: './car-form.component.scss'
})
export class CarFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carService = inject(CarService);
  private readonly brandService = inject(BrandService);
  private readonly modelService = inject(ModelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // US-3.1 : le paramètre :code de l'URL (/company/cars/:code/edit) détermine
  // le mode. Absent sur /company/cars/new -> mode création. Deux routes
  // distinctes -> nouvelle instance de composant à chaque navigation entre
  // les deux, donc lecture au snapshot suffit (pas besoin de paramMap$).
  readonly editingCode = signal<string | null>(this.route.snapshot.paramMap.get('code'));
  readonly isEditMode = computed(() => this.editingCode() !== null);

  readonly brands = signal<Brand[]>([]);
  readonly isBrandsLoading = signal(true);
  readonly brandsErrorMessage = signal<string | null>(null);

  readonly models = signal<Model[]>([]);
  readonly isModelsLoading = signal(false);

  readonly isInitialLoading = signal(false);
  readonly initialLoadError = signal<string | null>(null);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly gearboxOptions: ReadonlyArray<{ value: Gearbox; label: string }> = [
    { value: 'MANUAL', label: 'Manuelle' },
    { value: 'AUTOMATIC', label: 'Automatique' }
  ];

  readonly fuelTypeOptions: ReadonlyArray<{ value: FuelType; label: string }> = [
    { value: 'GASOLINE', label: 'Essence' },
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'HYBRID', label: 'Hybride' },
    { value: 'ELECTRIC', label: 'Électrique' }
  ];

  readonly colorOptions: ReadonlyArray<{ value: CarColor; label: string }> = [
    { value: 'WHITE', label: 'Blanc' },
    { value: 'BLACK', label: 'Noir' },
    { value: 'GREY', label: 'Gris' },
    { value: 'RED', label: 'Rouge' },
    { value: 'BLUE', label: 'Bleu' },
    { value: 'SILVER', label: 'Argent' },
    { value: 'GREEN', label: 'Vert' },
    { value: 'YELLOW', label: 'Jaune' }
  ];

  // RESERVED volontairement exclu : jamais sélectionnable manuellement,
  // piloté automatiquement par le cycle de réservation (§5.2 spec globale) —
  // et rejeté par le backend en update (CarServiceImpl.updateCar -> 400).
  readonly availabilityOptions: ReadonlyArray<{ value: CarAvailability; label: string }> = [
    { value: 'AVAILABLE', label: 'Disponible' },
    { value: 'MAINTENANCE', label: 'En maintenance' }
  ];

  readonly form: FormGroup<CarForm> = this.fb.nonNullable.group({
    vin: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(17),
      Validators.maxLength(17)
    ]),
    year: this.fb.control<number | null>(null, [Validators.required, Validators.min(1980)]),
    mileage: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    gearbox: this.fb.control<Gearbox | null>(null, [Validators.required]),
    fuelType: this.fb.control<FuelType | null>(null, [Validators.required]),
    color: this.fb.control<CarColor | null>(null, [Validators.required]),
    nbrSeats: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(9)
    ]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
    availability: this.fb.nonNullable.control<CarAvailability>('AVAILABLE'),
    brandCode: this.fb.nonNullable.control('', [Validators.required]),
    modelCode: this.fb.nonNullable.control('', [Validators.required])
  });

  constructor() {
    this.loadBrands();

    const code = this.editingCode();
    if (code) {
      this.loadCarForEdit(code);
    }

    // Select dépendant Marque -> Modèles. Uniquement actif en création :
    // en édition, brandCode/modelCode sont désactivés (cf. loadCarForEdit),
    // donc aucune sélection utilisateur ne peut déclencher ce flux.
    this.form.controls.brandCode.valueChanges.subscribe((brandCode) => {
      if (this.isEditMode()) {
        return;
      }
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

    private loadCarForEdit(code: string): void {
    this.isInitialLoading.set(true);
    this.initialLoadError.set(null);

    this.carService.getCarByCode(code).subscribe({
      next: (car: CarDTO) => {
        this.form.patchValue(
          {
            vin: car.vin,
            year: car.year,
            mileage: car.mileage,
            gearbox: car.gearbox,
            fuelType: car.fuelType,
            color: car.color,
            nbrSeats: car.nbrSeats,
            price: car.price,
            description: car.description ?? '',
            availability: car.availability === 'RESERVED' ? 'AVAILABLE' : car.availability,
            brandCode: car.brandCode,
            modelCode: car.modelCode
          },
          { emitEvent: false }
        );
        this.form.controls.brandCode.disable({ emitEvent: false });
        this.form.controls.modelCode.disable({ emitEvent: false });

        // 🔧 CORRECTIF : en édition, le subscriber brandCode.valueChanges est
        // court-circuité (isEditMode() === true), donc `models` reste vide et
        // le <mat-select modelCode> n'a aucune option à afficher, même si la
        // valeur du FormControl est correcte. On charge donc explicitement
        // les modèles de la marque de la voiture pour que le select affiche
        // la bonne option sélectionnée.
        this.isModelsLoading.set(true);
        this.modelService.getModelsByBrand(car.brandCode).subscribe({
          next: (models) => {
            this.models.set(models);
            this.isModelsLoading.set(false);
          },
          error: () => this.isModelsLoading.set(false)
        });

        this.isInitialLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isInitialLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.initialLoadError.set(
          body?.message ?? 'Impossible de charger cette voiture. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();

    if (this.isEditMode()) {
      const payload: CarUpdateRequest = {
        vin: raw.vin,
        year: raw.year as number,
        mileage: raw.mileage,
        gearbox: raw.gearbox,
        fuelType: raw.fuelType,
        color: raw.color,
        nbrSeats: raw.nbrSeats,
        price: raw.price,
        description: raw.description,
        availability: raw.availability
      };

      this.carService.updateCar(this.editingCode()!, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigateByUrl('/company/cars');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.applyServerErrors(err);
        }
      });
    } else {
      const payload: CarCreateRequest = {
        vin: raw.vin,
        year: raw.year as number,
        mileage: raw.mileage,
        gearbox: raw.gearbox,
        fuelType: raw.fuelType,
        color: raw.color,
        nbrSeats: raw.nbrSeats,
        price: raw.price,
        description: raw.description,
        availability: raw.availability,
        brandCode: raw.brandCode,
        modelCode: raw.modelCode
      };

      this.carService.createCar(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigateByUrl('/company/cars');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.applyServerErrors(err);
        }
      });
    }
  }

  private applyServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 400 && body?.errors?.length) {
      for (const fieldError of body.errors) {
        const control = this.form.get(fieldError.field);
        if (control) {
          control.setErrors({ backend: fieldError.message });
          control.markAsTouched();
        }
      }
      this.errorMessage.set(body.message ?? 'Veuillez corriger les champs invalides.');
      return;
    }

    if (err.status === 409) {
      // DuplicateResourceException : VIN déjà utilisé
      const message = body?.message ?? 'Ce VIN est déjà utilisé par une autre voiture.';
      this.form.controls.vin.setErrors({ backend: message });
      this.form.controls.vin.markAsTouched();
      this.errorMessage.set(message);
      return;
    }

    if (err.status === 400) {
      // IllegalArgumentException : ex. "Le modèle spécifié n'appartient pas à la marque fournie."
      this.errorMessage.set(body?.message ?? 'Requête invalide.');
      return;
    }

    if (err.status === 404) {
      this.errorMessage.set(
        body?.message ?? 'Marque, modèle ou voiture introuvable. Veuillez rafraîchir la page.'
      );
      return;
    }

    this.errorMessage.set(body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.');
  }
}
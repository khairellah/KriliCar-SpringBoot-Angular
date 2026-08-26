import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WishlistService } from '../services/wishlist.service';
import { CarDTO } from '../../../core/models/car/car.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { Gearbox, FuelType, CarColor } from '../../../core/models/enums';

/**
 * US-4.1 : Consultation + retrait de la wishlist du Client connecté.
 * L'ajout se fait via le toggle cœur sur les cartes voiture (CarSearchComponent),
 * conformément à la règle UI §4.2 de la Spec Frontend.
 */
@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent {
  private readonly wishlistService = inject(WishlistService);

  readonly cars = signal<CarDTO[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly removingCode = signal<string | null>(null);
  readonly removeErrorMessage = signal<string | null>(null);

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

  constructor() {
    this.loadWishlist();
  }

  private loadWishlist(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.wishlistService.getWishlist().subscribe({
      next: (cars) => {
        this.cars.set(cars);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage.set(
          body?.message ?? 'Impossible de charger votre wishlist. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  removeFromWishlist(carCode: string): void {
    this.removingCode.set(carCode);
    this.removeErrorMessage.set(null);

    this.wishlistService.removeFromWishlist(carCode).subscribe({
      next: () => {
        this.removingCode.set(null);
        this.cars.update((list) => list.filter((c) => c.code !== carCode));
      },
      error: (err: HttpErrorResponse) => {
        this.removingCode.set(null);
        const body = err.error as ErrorResponse | undefined;
        this.removeErrorMessage.set(
          body?.message ??
            'Impossible de retirer cette voiture de la wishlist. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}
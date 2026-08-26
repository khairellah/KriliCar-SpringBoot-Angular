import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CarDTO } from '../../../core/models/car/car.model';

/**
 * US-4.1 : Service WishList, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/WishlistController.java
 * (rôle CLIENT uniquement côté backend).
 *
 * `wishlistCodes` est un état partagé (signal) — pas de Store NgRx : cet état
 * n'est consommé que par deux écrans (recherche + wishlist), donc hors du
 * périmètre "état global transverse" défini en §1 de la Spec Frontend.
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/wishlist`;

  /** Codes métier des voitures présentes dans la wishlist du client connecté. */
  readonly wishlistCodes = signal<Set<string>>(new Set());

  /** GET /api/v1/wishlist */
  getWishlist(): Observable<CarDTO[]> {
    return this.http
      .get<CarDTO[]>(this.apiUrl)
      .pipe(tap((cars) => this.wishlistCodes.set(new Set(cars.map((c) => c.code)))));
  }

  /** POST /api/v1/wishlist/{carCode} */
  addToWishlist(carCode: string): Observable<CarDTO> {
    return this.http.post<CarDTO>(`${this.apiUrl}/${carCode}`, {}).pipe(
      tap(() =>
        this.wishlistCodes.update((set) => {
          const next = new Set(set);
          next.add(carCode);
          return next;
        })
      )
    );
  }

  /** DELETE /api/v1/wishlist/{carCode} */
  removeFromWishlist(carCode: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${carCode}`).pipe(
      tap(() =>
        this.wishlistCodes.update((set) => {
          const next = new Set(set);
          next.delete(carCode);
          return next;
        })
      )
    );
  }

  isInWishlist(carCode: string): boolean {
    return this.wishlistCodes().has(carCode);
  }
}
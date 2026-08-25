import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CarDTO } from '../../../core/models/car/car.model';
import { CarSearchParams } from '../../../core/models/car/car-search-params.model';
import { PageResponse } from '../../../core/models/page-response.model';

/**
 * US-3.3 : Service de recherche publique de voitures, aligné sur
 * Backend/src/main/java/com/kriliCar/controllers/CarController.java (GET /cars/search).
 *
 * Endpoint public (permitAll côté SecurityConfig) : aucun token requis.
 * Les résultats sont filtrés côté backend aux voitures AVAILABLE uniquement
 * (CarServiceImpl.searchCars) — ne jamais re-filtrer côté Front.
 *
 * Distinct de CarService (features/company/services) qui est scopé COMPANY
 * (gestion du propre parc) : ici, aucune authentification, aucune mutation.
 */
@Injectable({ providedIn: 'root' })
export class CarSearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cars/search`;

  searchCars(
    filters: CarSearchParams,
    page: number,
    size: number
  ): Observable<PageResponse<CarDTO>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (filters.brand) {
      params = params.set('brand', filters.brand);
    }
    if (filters.model) {
      params = params.set('model', filters.model);
    }
    if (filters.city) {
      params = params.set('city', filters.city);
    }
    if (filters.minPrice != null) {
      params = params.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice != null) {
      params = params.set('maxPrice', filters.maxPrice);
    }
    if (filters.minMileage != null) {
      params = params.set('minMileage', filters.minMileage);
    }
    if (filters.maxMileage != null) {
      params = params.set('maxMileage', filters.maxMileage);
    }
    if (filters.nbrSeats != null) {
      params = params.set('nbrSeats', filters.nbrSeats);
    }

    return this.http.get<PageResponse<CarDTO>>(this.apiUrl, { params });
  }
}
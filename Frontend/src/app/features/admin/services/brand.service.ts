import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Brand } from '../../../core/models/brand.model';
import { BrandRequest } from '../../../core/models/brand-request.model';

/**
 * US-2.1 : Service CRUD Marques, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/BrandController.java
 *
 * GET (liste + détail) : public côté backend, mais cet écran est réservé
 * à l'Admin (roleGuard). POST/PUT/DELETE : ADMIN uniquement côté backend.
 */
@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/brands`;

  /** GET /api/v1/brands */
  getAllBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.apiUrl);
  }

  /** POST /api/v1/brands */
  createBrand(data: BrandRequest): Observable<Brand> {
    return this.http.post<Brand>(this.apiUrl, data);
  }

  /** PUT /api/v1/brands/{code} */
  updateBrand(code: string, data: BrandRequest): Observable<Brand> {
    return this.http.put<Brand>(`${this.apiUrl}/${code}`, data);
  }

  /** DELETE /api/v1/brands/{code} */
  deleteBrand(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${code}`);
  }
}
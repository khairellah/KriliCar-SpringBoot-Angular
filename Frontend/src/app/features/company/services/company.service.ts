// Frontend/src/app/features/company/services/company.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CompanyProfileRequest } from '../../../core/models/company/company-profile-request.model';
import { CompanyProfileResponse } from '../../../core/models/company/company-profile-response.model';
import { ChangePasswordRequest } from '../../../core/models/auth/change-password-request.model';

/**
 * US-1.7 : Service dédié au profil Company, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/CompanyController.java
 * (endpoints /profile et /profile/change-password — le endpoint /boost/request
 * reste hors périmètre, cf. US-6.1).
 */
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/companies`;

  /**
   * US-1.7 (extension) : GET /api/v1/companies/profile
   * Récupère le profil de la Company connectée (email résolu côté backend
   * via Principal) — utilisé pour pré-remplir le formulaire de modification.
   */
  getMyProfile(): Observable<CompanyProfileResponse> {
    return this.http.get<CompanyProfileResponse>(`${this.apiUrl}/profile`);
  }

  /**
   * PUT /api/v1/companies/profile (multipart/form-data)
   * Part "data" (JSON) + part "image" (optionnelle).
   * L'intercepteur JWT ajoute automatiquement le Bearer token (URL sous
   * environment.apiUrl et hors préfixe /auth/).
   */
  updateProfile(
    data: CompanyProfileRequest,
    imageFile?: File | null
  ): Observable<CompanyProfileResponse> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.put<CompanyProfileResponse>(`${this.apiUrl}/profile`, formData);
  }

  /** PUT /api/v1/companies/profile/change-password (application/json) */
  changePassword(request: ChangePasswordRequest): Observable<CompanyProfileResponse> {
    return this.http.put<CompanyProfileResponse>(
      `${this.apiUrl}/profile/change-password`,
      request
    );
  }
}
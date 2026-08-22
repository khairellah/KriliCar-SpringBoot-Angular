// Frontend/src/app/features/admin/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AdminProfileRequest } from '../../../core/models/admin/admin-profile-request.model';
import { UserDisplayDTO } from '../../../core/models/admin/user-display.model';
import { ChangePasswordRequest } from '../../../core/models/auth/change-password-request.model';

/**
 * US-1.6 : Service dédié au profil Admin, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/AdminController.java
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins`;

  /**
   * GET /api/v1/admins/profile
   * Récupère le profil de l'Admin connecté (email résolu côté backend via
   * Principal) — utilisé pour pré-remplir le formulaire de modification.
   */
  getMyProfile(): Observable<UserDisplayDTO> {
    return this.http.get<UserDisplayDTO>(`${this.apiUrl}/profile`);
  }

  /**
   * PUT /api/v1/admins/profile (multipart/form-data)
   * Part "data" (JSON) + part "image" (optionnelle).
   * L'intercepteur JWT ajoute automatiquement le Bearer token.
   */
  updateProfile(data: AdminProfileRequest, imageFile?: File | null): Observable<UserDisplayDTO> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.put<UserDisplayDTO>(`${this.apiUrl}/profile`, formData);
  }

  /** PUT /api/v1/admins/profile/change-password (application/json) */
  changePassword(request: ChangePasswordRequest): Observable<UserDisplayDTO> {
    return this.http.put<UserDisplayDTO>(`${this.apiUrl}/profile/change-password`, request);
  }
}
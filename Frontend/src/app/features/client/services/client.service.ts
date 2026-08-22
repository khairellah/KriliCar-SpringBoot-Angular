// Frontend/src/app/features/client/services/client.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ClientProfileRequest } from '../../../core/models/client/client-profile-request.model';
import { ClientDisplayDTO } from '../../../core/models/client/client-display.model';
import { ChangePasswordRequest } from '../../../core/models/auth/change-password-request.model';

/**
 * US-1.5 : Service dédié au profil Client, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/ClientController.java
 */
@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  /**
   * US-1.5 (extension) : GET /api/v1/clients/profile
   * Récupère le profil du client connecté (email résolu côté backend via
   * Principal) — utilisé pour pré-remplir le formulaire de modification.
   */
  getMyProfile(): Observable<ClientDisplayDTO> {
    return this.http.get<ClientDisplayDTO>(`${this.apiUrl}/profile`);
  }
  
  /**
   * PUT /api/v1/clients/profile (multipart/form-data)
   * Part "data" (JSON) + part "image" (optionnelle).
   * L'intercepteur JWT ajoute automatiquement le Bearer token (URL sous
   * environment.apiUrl et hors préfixe /auth/).
   */
  updateProfile(data: ClientProfileRequest, imageFile?: File | null): Observable<ClientDisplayDTO> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.put<ClientDisplayDTO>(`${this.apiUrl}/profile`, formData);
  }

  /** PUT /api/v1/clients/profile/change-password (application/json) */
  changePassword(request: ChangePasswordRequest): Observable<ClientDisplayDTO> {
    return this.http.put<ClientDisplayDTO>(`${this.apiUrl}/profile/change-password`, request);
  }
}
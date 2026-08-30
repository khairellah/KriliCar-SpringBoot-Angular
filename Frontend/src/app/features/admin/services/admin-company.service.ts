// Frontend/src/app/features/admin/services/admin-company.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CompanyProfileResponse } from '../../../core/models/company/company-profile-response.model';
import { CompanyAdminSummaryDTO } from '../../../core/models/admin/company-admin-summary.model';

/**
 * Service Admin dédié aux sociétés, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/AdminCompanyController.java
 * (@PreAuthorize("hasAuthority('ADMIN')") côté backend sur tous les endpoints).
 *
 * US-6.2 : getPendingBoostRequests() / activateBoost()
 * US-7.1 : getCompanies() — liste filtrable (active, boosted)
 *
 * ⚠️ Périmètre : US-7.2 (activation/désactivation) et US-7.5 (détail complet)
 * restent hors périmètre de ce service pour l'instant — à compléter lors de
 * ces US ultérieures, sans jamais dupliquer ce fichier.
 */
@Injectable({ providedIn: 'root' })
export class AdminCompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins/companies`;

  /**
   * US-7.1 : GET /api/v1/admins/companies?active=&boosted=
   *
   * Filtres optionnels et combinables. `undefined` = paramètre omis (jamais
   * envoyé comme "active=null" en query string), conformément à la règle UI
   * §4.4 Spec Frontend : "Tous" -> paramètre omis, "Oui" -> true, "Non" -> false.
   */
  getCompanies(active?: boolean, boosted?: boolean): Observable<CompanyAdminSummaryDTO[]> {
    let params = new HttpParams();
    if (active !== undefined) {
      params = params.set('active', active);
    }
    if (boosted !== undefined) {
      params = params.set('boosted', boosted);
    }
    return this.http.get<CompanyAdminSummaryDTO[]>(this.apiUrl, { params });
  }

  /**
   * GET /api/v1/admins/companies/boost/pending
   * Liste des sociétés ayant une demande de Boost en attente
   * (boostRequested = true). Le tri par ancienneté (boostRequestedAt croissant)
   * est effectué côté Frontend (cf. AdminBoostPendingComponent), le backend
   * ne garantit pas d'ordre particulier.
   */
  getPendingBoostRequests(): Observable<CompanyProfileResponse[]> {
    return this.http.get<CompanyProfileResponse[]>(`${this.apiUrl}/boost/pending`);
  }

  /**
   * PATCH /api/v1/admins/companies/{code}/boost/activate
   * Valide et active le Boost pour la société donnée.
   * Idempotent côté backend : 409 (IllegalStateException) si le Boost est déjà
   * actif ou si aucune demande n'est en attente pour cette société.
   */
  activateBoost(code: string): Observable<CompanyProfileResponse> {
    return this.http.patch<CompanyProfileResponse>(`${this.apiUrl}/${code}/boost/activate`, null);
  }
}
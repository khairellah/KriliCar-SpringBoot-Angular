import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ReservationCreateRequest } from '../../../core/models/reservation/reservation-request.model';

/**
 * US-5.1 / US-5.2 : Service Réservations, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/ReservationController.java.
 *
 * Réutilisé tel quel côté Company (import cross-feature, même pattern déjà
 * établi pour CarService/BrandService/ModelService dans ce projet) : le
 * endpoint GET /reservations/my est commun aux deux rôles, le backend
 * résout le scope (Client -> ses réservations, Company -> son parc) via
 * le token, sans paramètre à envoyer par le Front.
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reservations`;

  /** POST /api/v1/reservations — US-5.1, rôle CLIENT uniquement côté backend */
  createReservation(data: ReservationCreateRequest): Observable<ReservationDTO> {
    return this.http.post<ReservationDTO>(this.apiUrl, data);
  }

  /**
   * GET /api/v1/reservations/my — US-5.2, rôles CLIENT et COMPANY.
   * Aucun paramètre à envoyer : le scope (Client vs Company) est résolu
   * côté backend via le token (Authentication.getName()).
   */
  getMyReservations(): Observable<ReservationDTO[]> {
    return this.http.get<ReservationDTO[]>(`${this.apiUrl}/my`);
  }

  /**
   * US-5.3 : GET /api/v1/reservations/{code}
   * Rôles CLIENT/COMPANY/ADMIN — l'autorisation (propriétaire ou Admin) est
   * intégralement vérifiée côté backend (@PreAuthorize), aucun paramètre
   * supplémentaire à envoyer par le Frontend.
   */
  getByCode(code: string): Observable<ReservationDTO> {
    return this.http.get<ReservationDTO>(`${this.apiUrl}/${code}`);
  }
}
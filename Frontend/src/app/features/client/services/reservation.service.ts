import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ReservationCreateRequest } from '../../../core/models/reservation/reservation-request.model';
import { ReservationStatus } from '../../../core/models/enums';

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

  /**
   * US-5.4 : PATCH /api/v1/reservations/{code}/status
   * Réservé à la Company propriétaire du véhicule (ou Admin), vérifié côté
   * backend via @PreAuthorize + isCarOfReservationOwnedByCompany.
   *
   * ⚠️ `status` est transmis en query param (@RequestParam côté backend),
   * jamais en body — cf. ReservationController.updateStatus.
   *
   * Le backend n'impose aucune restriction sur le statut courant lors de
   * cette transition (pas de 409 métier ici) : c'est au Frontend de
   * n'afficher les actions "Confirmer"/"Annuler" que pour les transitions
   * valides du cycle de vie (§8 Spec Frontend), pour ne jamais proposer une
   * action incohérente à l'utilisateur.
   */
  updateStatus(code: string, status: ReservationStatus): Observable<ReservationDTO> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ReservationDTO>(`${this.apiUrl}/${code}/status`, null, { params });
  }

  /**
   * US-5.6 : PATCH /api/v1/reservations/{code}/cancel
   * Réservé au Client propriétaire de la réservation
   * (@PreAuthorize("hasAuthority('CLIENT') and isReservationOwnedByClient(...)")
   * côté backend). Endpoint DISTINCT de updateStatus() : la règle métier est
   * stricte et non paramétrable — le backend refuse (409 via IllegalStateException
   * dans ReservationServiceImpl.cancelReservationByClient) toute annulation si
   * le statut courant n'est pas PENDING. Contrairement à l'annulation Company
   * (US-5.4, /status), qui reste possible sur PENDING et CONFIRMED, ce flux
   * Client n'accepte jamais CONFIRMED — c'est alors à la Company d'agir
   * (§6.4 Spec Globale : éviter les annulations client sans contact préalable).
   */
  cancelReservation(code: string): Observable<ReservationDTO> {
    return this.http.patch<ReservationDTO>(`${this.apiUrl}/${code}/cancel`, null);
  }
}
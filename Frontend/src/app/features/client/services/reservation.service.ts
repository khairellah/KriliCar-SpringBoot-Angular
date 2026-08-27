import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ReservationCreateRequest } from '../../../core/models/reservation/reservation-request.model';

/**
 * US-5.1 : Service Réservations (Client), aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/ReservationController.java
 * (POST /api/v1/reservations — @PreAuthorize("hasAuthority('CLIENT')")).
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reservations`;

  /** POST /api/v1/reservations */
  createReservation(data: ReservationCreateRequest): Observable<ReservationDTO> {
    return this.http.post<ReservationDTO>(this.apiUrl, data);
  }
}
import { ReservationDTO } from '../reservation/reservation.model';
import { CarDTO } from '../car/car.model';
import { ClientStatsDTO } from './client-stats.model';

// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/ClientDetailResponse.java
// US-7.5 : détail complet client (vue Admin), lecture seule.
export interface ClientDetailResponse {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  reservations: ReservationDTO[];
  wishlist: CarDTO[];
  stats: ClientStatsDTO;
}
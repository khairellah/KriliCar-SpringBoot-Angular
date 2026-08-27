import { ReservationStatus } from '../enums';
import { CarDTO } from '../car/car.model';
import { ClientDisplayDTO } from '../client/client-display.model';

// Reflète Backend/src/main/java/com/kriliCar/dtos/ReservationDTO.java (lecture)
export interface ReservationDTO {
  code: string;
  startDate: string; // LocalDate sérialisé en 'yyyy-MM-dd'
  endDate: string;
  totalPrice: number | null;
  status: ReservationStatus;
  createdAt: string;
  carCode: string;
  car: CarDTO | null;
  client: ClientDisplayDTO | null;
}
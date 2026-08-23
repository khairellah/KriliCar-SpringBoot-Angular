import { CarAvailability, CarColor, FuelType, Gearbox } from '../enums';
import { CarImageDTO } from './car-image.model';

// Reflète Backend/src/main/java/com/kriliCar/dtos/CarDTO.java (lecture)
// Pas de champ `id` ni `companyId` : uniquement des codes métier (§5 Spec Frontend).
export interface CarDTO {
  code: string;
  vin: string;
  year: number;
  mileage: number | null;
  gearbox: Gearbox | null;
  fuelType: FuelType | null;
  color: CarColor | null;
  description: string | null;
  nbrSeats: number | null;
  price: number | null;
  availability: CarAvailability;
  brandCode: string;
  modelCode: string;
  brandName: string;
  modelName: string;
  companyCode: string;
  images: CarImageDTO[];
}
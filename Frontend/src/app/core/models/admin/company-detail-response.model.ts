import { City } from '../enums';
import { CarDTO } from '../car/car.model';
import { CompanyStatsDTO } from './company-stats.model';

// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/CompanyDetailResponse.java
// US-7.5 : détail complet société (vue Admin), lecture seule.
export interface CompanyDetailResponse {
  code: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string | null;
  landline: string | null;
  city: City;
  description: string | null;
  active: boolean;
  isBooster: boolean;
  boostRequested: boolean;
  boostRequestedAt: string | null;
  boostActivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cars: CarDTO[];
  stats: CompanyStatsDTO;
}
import { City } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/CompanyProfileResponse.java
// N'expose jamais le password. Les champs isBooster/boostRequested/boostRequestedAt/
// boostActivatedAt sont présents côté backend mais ne sont PAS pilotés par ce formulaire
// (hors périmètre US-1.7 — cf. US-6.1/6.2 pour le flux Boost).
export interface CompanyProfileResponse {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string | null;
  companyName: string;
  landline: string | null;
  city: City;
  description: string | null;
  isBooster: boolean;
  boostRequested: boolean;
  boostRequestedAt: string | null;
  boostActivatedAt: string | null;
  updatedAt: string;
}
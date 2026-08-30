import { City } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/CompanyAdminSummaryDTO.java
// DTO de SYNTHÈSE destiné exclusivement à la vue Admin (US-7.1) — à ne pas
// confondre avec CompanyProfileResponse (self-service Company, US-1.7) qui
// n'expose pas `active`.
export interface CompanyAdminSummaryDTO {
  code: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: City;
  active: boolean;
  isBooster: boolean;
  boostRequested: boolean;
  createdAt: string;
  updatedAt: string;
}
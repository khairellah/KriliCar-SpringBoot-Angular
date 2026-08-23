import { City } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/CompanyProfileRequest.java
// Volontairement absents : email, role (non modifiables - règle commune §2)
// password retiré : géré exclusivement par changePassword() (cf. ChangePasswordRequest)
// isBooster/boostRequested absents : gérés exclusivement par le flux Boost (US-6.1/6.2),
// jamais par ce formulaire de profil.
export interface CompanyProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  landline: string;
  city: City | null;
  description: string;
}
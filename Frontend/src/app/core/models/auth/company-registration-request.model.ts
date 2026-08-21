import { City } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/registration/CompanyRegistrationDTO.java
// Le champ `image` du DTO backend n'est volontairement pas repris ici : l'image transite
// uniquement via la part multipart "image" (gérée séparément par AuthService.registerCompany()).
// ⚠️ SÉCURITÉ (US-1.3) : `isBooster` n'existe plus dans le DTO backend — ne JAMAIS
// l'ajouter ici ni l'exposer dans le formulaire.
export interface CompanyRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
  landline?: string;
  city: City;
  description?: string;
}
import { City } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/registration/CompanyRegistrationResponseDTO.java
export interface CompanyRegistrationResponse {
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
}
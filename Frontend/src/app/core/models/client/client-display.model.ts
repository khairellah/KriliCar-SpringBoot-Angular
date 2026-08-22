// Frontend/src/app/core/models/client/client-display.model.ts
import { Role } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/ClientDisplayDTO.java
// (hérite de UserDisplayDTO : code, firstName, lastName, phone, email, image, role)
export interface ClientDisplayDTO {
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  image: string | null;
  role: Role;
}

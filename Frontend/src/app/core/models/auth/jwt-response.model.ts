import { Role } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/auth/JwtResponseDTO.java
export interface JwtResponse {
  token: string;
  email: string;
  role: Role;
  code: string;
}
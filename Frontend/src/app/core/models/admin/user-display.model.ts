// Frontend/src/app/core/models/admin/user-display.model.ts
import { Role } from '../enums';

// Reflète Backend/src/main/java/com/kriliCar/dtos/UserDisplayDTO.java
// DTO générique retourné par AdminController (getMyProfile, updateProfile,
// changePassword) — pas de DTO "AdminDisplayDTO" dédié côté backend.
export interface UserDisplayDTO {
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  image: string | null;
  role: Role;
}
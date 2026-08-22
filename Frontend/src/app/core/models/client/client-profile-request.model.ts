
// Frontend/src/app/core/models/client/client-profile-request.model.ts
// Reflète Backend/src/main/java/com/kriliCar/dtos/ClientProfileRequest.java
// Volontairement absents : email, role (non modifiables), password (géré via
// ChangePasswordRequest). Aucun champ n'est obligatoire côté backend : une
// mise à jour partielle est possible (StringUtils.hasText côté service).
export interface ClientProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

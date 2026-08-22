// Frontend/src/app/core/models/admin/admin-profile-request.model.ts
// Reflète Backend/src/main/java/com/kriliCar/dtos/AdminProfileRequest.java
// Volontairement absents : email, role (non modifiables), password (géré
// exclusivement via ChangePasswordRequest, cf. /profile/change-password).
export interface AdminProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}
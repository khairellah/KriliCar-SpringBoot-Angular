
// Frontend/src/app/core/models/auth/change-password-request.model.ts
// Reflète Backend/src/main/java/com/kriliCar/dtos/auth/ChangePasswordRequest.java
// La confirmation (newPassword === confirmPassword) est gérée 100% côté
// Angular, jamais transmise au backend (même pattern que ClientRegistrationDTO).
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
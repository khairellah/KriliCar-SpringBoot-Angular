// Frontend/src/app/core/models/admin/client-admin-summary.model.ts
// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/ClientAdminSummaryDTO.java
//
// DTO de SYNTHÈSE destiné exclusivement à la vue Admin (US-7.3) — à ne pas
// confondre avec ClientDisplayDTO (self-service Client, US-1.5) qui n'expose
// pas `active`.
//
// Pas de champs Boost (concept propre à Company, cf. CompanyAdminSummaryDTO) :
// volontairement absent, conformément au DTO backend.
export interface ClientAdminSummaryDTO {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Statut du compte (US-1.8 / US-7.4) — piloté exclusivement par l'Admin,
  // affiché en lecture seule sur cet écran (activation/désactivation = US-7.4).
  active: boolean;

  createdAt: string;
  updatedAt: string;
}
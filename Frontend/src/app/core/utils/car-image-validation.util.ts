// Frontend/src/app/core/utils/car-image-validation.util.ts
// Reflète strictement la validation KC-20 côté backend :
// Backend/src/main/java/com/kriliCar/services/impl/CarServiceImpl.java
// (ALLOWED_IMAGE_CONTENT_TYPES / ALLOWED_IMAGE_EXTENSIONS).
// But : rejeter côté client les fichiers qui seraient de toute façon refusés
// par le backend (évite un aller-retour réseau inutile), sans jamais se
// substituer à la validation serveur (qui reste la seule autorité de sécurité).

const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export function isValidCarImageFile(file: File): boolean {
  const validContentType = ALLOWED_IMAGE_CONTENT_TYPES.includes(file.type.toLowerCase());
  const lowerName = file.name.toLowerCase();
  const validExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  return validContentType && validExtension;
}
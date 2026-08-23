// Reflète Backend/src/main/java/com/kriliCar/dtos/ModelDTO.java (écriture)
// `code` et `brandName` sont volontairement absents : `code` est toujours
// généré/ignoré côté backend, `brandName` est un champ de lecture seule
// résolu depuis `brandCode`.
export interface ModelRequest {
  name: string;
  brandCode: string;
}
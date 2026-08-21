// Reflète Backend/src/main/java/com/kriliCar/dtos/registration/ClientRegistrationDTO.java
// Le champ `image` du DTO backend n'est volontairement pas repris ici :
// il n'est pas exploité côté serveur (l'image transite uniquement via la
// part multipart "image", gérée séparément par AuthService.registerClient()).
export interface ClientRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}
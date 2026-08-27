// Payload d'écriture pour POST /api/v1/reservations (US-5.1).
// Reflète les seuls champs réellement exploités de ReservationDTO côté backend :
// - startDate / endDate : @NotNull, startDate doit être @FutureOrPresent (ReservationDTO.java)
// - carCode : @NotBlank, résolution de la voiture côté service
// ⚠️ code / status / totalPrice / car / client sont volontairement absents : générés
// ou recalculés côté backend (ReservationServiceImpl.createReservation — calculatePrice,
// status forcé à PENDING), jamais pilotés par le client.
export interface ReservationCreateRequest {
  startDate: string; // 'yyyy-MM-dd'
  endDate: string; // 'yyyy-MM-dd'
  carCode: string;
}
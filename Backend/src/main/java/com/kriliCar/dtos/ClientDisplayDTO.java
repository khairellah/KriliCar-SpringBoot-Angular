package com.kriliCar.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ClientDisplayDTO extends UserDisplayDTO {
    // Les champs spécifiques à Client (s'ils existent, ex: address) seraient ici.
    // Pour l'instant, il hérite juste des champs de base.
}
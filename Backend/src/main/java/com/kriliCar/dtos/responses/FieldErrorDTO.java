package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * US-9.2 : Représente une erreur de validation associée à un champ précis,
 * pour permettre au frontend Angular d'afficher l'erreur directement sous
 * le champ de formulaire concerné.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldErrorDTO {
    private String field;
    private String message;
}
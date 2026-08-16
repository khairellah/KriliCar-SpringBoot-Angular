package com.kriliCar.dtos.responses;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private String path;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // 🆕 US-9.2 : détail champ par champ pour les erreurs de validation.
    // null pour toutes les erreurs non liées à de la validation (404, 403, 500...)
    // -> aucune régression sur les handlers existants qui n'utilisent pas ce champ.
    private List<FieldErrorDTO> errors;
}
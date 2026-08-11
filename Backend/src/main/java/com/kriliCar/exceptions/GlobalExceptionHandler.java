package com.kriliCar.exceptions;


import com.kriliCar.dtos.responses.ErrorResponse;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.FieldError;
import java.util.stream.Collectors;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException; import org.springframework.http.converter.HttpMessageNotReadableException;


@ControllerAdvice
public class GlobalExceptionHandler {

    // 1. Erreurs 400 - Validation / Arguments incorrects
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // 2. Erreurs 404 - Ressource non trouvée
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // 3. Erreurs 409 - Conflits / Doublons (ex: Email déjà pris)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // 4. Erreurs 403/401 - Sécurité (AccessDenied)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return buildErrorResponse(HttpStatus.UNAUTHORIZED,
                    "Accès refusé. Un jeton d'authentification valide est requis (401).", request);
        }

        return buildErrorResponse(HttpStatus.FORBIDDEN,
                "Accès refusé. Vous n'avez pas le rôle nécessaire pour cette ressource (403).", request);
    }

    // 5. Erreurs d'actions non autorisées (Horizontales)
    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedAction(UnauthorizedActionException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, WebRequest request) {
        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) cause;
            if (ife.getTargetType() != null && ife.getTargetType().equals(com.kriliCar.enums.City.class)) {
                return buildErrorResponse(HttpStatus.BAD_REQUEST, "Valeur de city invalide: " + ife.getValue(), request);
            }
        }
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Requête mal formée.", request);
    }

    // 6. Fallback 500 - Erreur interne générique
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex, WebRequest request) {
        // En production, on loggue l'erreur complète mais on ne l'affiche pas à l'utilisateur
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur inattendue est survenue. Veuillez réessayer plus tard.", request);
    }

    // 7. Erreurs 400 - Validation des DTO (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(" ; "));

        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    // 8. Erreurs 400 - Partie multipart manquante (ex: "user" absent)
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException ex, WebRequest request) {
        String message = "La partie obligatoire '" + ex.getRequestPartName() + "' est manquante dans la requête.";
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    // 10. Erreurs 400 - Paramètres de requête invalides (ex: ville/statut hors enum)
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleCoyoteBadRequest(BadRequestException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Helper pour centraliser la création de la ResponseEntity
     */
    private ResponseEntity<ErrorResponse> buildErrorResponse(HttpStatus status, String message, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        return new ResponseEntity<>(error, status);
    }
}
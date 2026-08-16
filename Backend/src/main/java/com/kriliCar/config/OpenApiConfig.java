package com.kriliCar.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * US-9.1 : Configuration Swagger / OpenAPI pour la documentation publique de l'API KriliCar.
 *
 * - Accessible sans authentification (chemins déjà exclus du filtre de sécurité
 *   dans SecurityConfig#webSecurityCustomizer -> /v3/api-docs/**, /swagger-ui/**).
 * - Définit un schéma de sécurité "bearerAuth" (JWT) réutilisable sur chaque
 *   endpoint protégé, afin de permettre les tests via le bouton "Authorize"
 *   directement depuis Swagger UI (http://localhost:8282/swagger-ui.html).
 *
 * Aucune annotation supplémentaire n'est requise sur les contrôleurs existants :
 * springdoc génère automatiquement la documentation à partir des annotations
 * Spring MVC déjà présentes (@RequestMapping, @PathVariable, @RequestParam...).
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI kriliCarOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("KriliCar API")
                        .description("""
                                Documentation de l'API REST de l'application KriliCar : \
                                gestion de la location de voitures entre sociétés de location \
                                (COMPANY) et clients (CLIENT), supervisée par un administrateur (ADMIN).
 
                                Authentification : JWT Bearer Token.
                                1. Appeler POST /api/v1/auth/login avec email + password
                                2. Copier le "token" retourné
                                3. Cliquer sur "Authorize" ci-dessus et coller le token (sans le préfixe "Bearer ")
                                """)
                        .version("v1")
                        .contact(new Contact()
                                .name("Équipe KriliCar")
                                .email("contact@krilicar.com")))
                // Déclaration du schéma de sécurité JWT (Bearer)
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                // Application du schéma de sécurité par défaut à tous les endpoints
                // (Swagger UI affichera le cadenas ; les endpoints permitAll restent
                // bien entendu appelables sans token malgré le cadenas affiché)
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}
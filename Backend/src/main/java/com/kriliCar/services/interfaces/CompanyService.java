package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.CompanyProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.dtos.responses.CompanyAdminSummaryDTO;
import com.kriliCar.dtos.responses.CompanyProfileResponse;
import com.kriliCar.exceptions.UnauthorizedActionException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
/**
 * Interface pour la gestion des profils Company.
 *
 * Responsabilités :
 * - US-1.4 : Modification du profil (infos personnelles + image)
 * - US-1.4 (ext) : Changement sécurisé du mot de passe
 * - US-6.1 : Demande de Boost (Company)
 * - US-6.2 : Validation/Activation du Boost (Admin)
 */
public interface CompanyService {

    /**
     * US-1.4 : Modifie le profil d'une Company.
     *
     * ✅ Email et rôle non modifiables
     * ✅ Gestion de l'image de profil (upload/suppression)
     * ✅ Validation des champs
     *
     * @param email Email de la Company (du token JWT)
     * @param request Données de modification
     * @param imageFile Image de profil optionnelle
     * @return DTO de réponse contenant les données mises à jour (sans password)
     * @throws 'IOException' En cas d'erreur lors du traitement du fichier
     */
    CompanyProfileResponse updateProfile(
            String email,
            CompanyProfileRequest request,
            MultipartFile imageFile) throws IOException;

    /**
     * US-1.4 (extension) : Change le mot de passe d'une Company.
     *
     * ✅ Vérifie l'ancien mot de passe avant modification
     * ✅ Confirmation du nouveau mot de passe requise
     * ✅ Encodage sécurisé en BCrypt
     *
     * @param email Email de la Company (du token JWT)
     * @param request Ancien + nouveau mot de passe + confirmation
     * @return DTO de réponse (confirmation de changement)
     * @throws 'UnauthorizedActionException' Si l'ancien mot de passe est incorrect
     */
    CompanyProfileResponse changePassword(
            String email,
            ChangePasswordRequest request);

    /**
     * US-6.1 : Demande d'activation du Boost par la Company.
     *
     * Règles métier :
     * - Impossible de redemander si le Boost est déjà actif (isBooster = true).
     * - Impossible de redemander si une demande est déjà en attente (boostRequested = true).
     * - Ne positionne JAMAIS isBooster à true : seule l'validation Admin (US-6.2) le fera.
     *
     * @param email Email de la Company (du token JWT)
     * @return DTO de réponse reflétant le nouvel état de la demande
     */
    CompanyProfileResponse requestBoost(String email);

    /**
     * US-6.2 : Liste des sociétés ayant une demande de Boost en attente.
     * Destiné à l'Admin pour traiter les demandes (tri par ancienneté via boostRequestedAt).
     *
     * @return Liste des Company avec boostRequested = true
     */
    List<CompanyProfileResponse> getPendingBoostRequests();

    /**
     * US-6.2 : Validation/Activation du Boost par l'Admin.
     *
     * Règles métier :
     * - Une demande doit être en attente (boostRequested = true), sinon 409 Conflict.
     * - Le Boost ne doit pas être déjà actif, sinon 409 Conflict.
     * - Passe isBooster = true, boostRequested = false, boostActivatedAt = now().
     *
     * @param code Code métier de la Company à activer
     * @return DTO reflétant le nouvel état (Boost actif)
     */
    CompanyProfileResponse activateBoost(String code);

    /**
     * US-7.1 : Liste des sociétés, filtrable par statut de compte et statut Boost.
     * Filtres optionnels et combinables ; null = pas de restriction sur ce critère.
     *
     * @param active  true = actives uniquement, false = inactives uniquement, null = toutes
     * @param boosted true = boostées uniquement, false = non boostées uniquement, null = toutes
     */
    List<CompanyAdminSummaryDTO> getCompanies(Boolean active, Boolean boosted);

    /**
     * US-7.2 : Active ou désactive le compte d'une Company.
     *
     * Règles métier :
     * - Idempotence stricte : si le compte est déjà dans l'état demandé, 409 Conflict.
     * - Ne supprime aucune donnée (voitures, réservations conservées) : bloque uniquement
     *   l'accès (login + toute requête authentifiée via JwtAuthTokenFilter, déjà en place).
     *
     * @param code   Code métier de la Company
     * @param active true = activation, false = désactivation
     */
    CompanyAdminSummaryDTO setCompanyActiveStatus(String code, boolean active);
}
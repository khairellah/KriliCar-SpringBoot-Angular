package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.CompanyProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.dtos.responses.CompanyProfileResponse;
import com.kriliCar.exceptions.UnauthorizedActionException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Interface pour la gestion des profils Company.
 *
 * Responsabilités :
 * - US-1.4 : Modification du profil (infos personnelles + image)
 * - US-1.4 (ext) : Changement sécurisé du mot de passe
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
     * @throws IOException En cas d'erreur lors du traitement du fichier
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
     * @throws UnauthorizedActionException Si l'ancien mot de passe est incorrect
     */
    CompanyProfileResponse changePassword(
            String email,
            ChangePasswordRequest request);
}
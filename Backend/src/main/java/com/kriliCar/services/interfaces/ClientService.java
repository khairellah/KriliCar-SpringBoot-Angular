package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.dtos.responses.ClientAdminSummaryDTO;
import com.kriliCar.dtos.responses.ClientDetailResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ClientService {
    // US-1.5 : Modification du profil (infos perso + image)
    ClientDisplayDTO updateProfile(String email, ClientProfileRequest request, MultipartFile imageFile) throws IOException;

    // US-1.5 (ext) : Changement sécurisé du mot de passe
    ClientDisplayDTO changePassword(String email, ChangePasswordRequest request);

    // US-1.5 (ext) : Récupération du profil courant (pré-remplissage formulaire Front)
    ClientDisplayDTO getMyProfile(String email);

    /**
     * US-7.3 : Liste des clients, filtrable par statut de compte.
     *
     * @param active true = actifs uniquement, false = inactifs uniquement, null = tous
     */
    List<ClientAdminSummaryDTO> getClients(Boolean active);

    /**
     * US-7.4 : Active ou désactive le compte d'un Client.
     *
     * Règles métier :
     * - Idempotence stricte : si le compte est déjà dans l'état demandé, 409 Conflict.
     * - Ne supprime aucune donnée (réservations, wishlist conservées) : bloque uniquement
     *   l'accès (login + toute requête authentifiée via JwtAuthTokenFilter, déjà en place).
     *
     * @param code   Code métier du Client
     * @param active true = activation, false = désactivation
     */
    ClientAdminSummaryDTO setClientActiveStatus(String code, boolean active);

    /**
     * US-7.5 : Détail complet d'un client pour l'Admin.
     * Regroupe : profil complet, réservations, wishlist, statistiques.
     *
     * @param code Code métier du Client
     */
    ClientDetailResponse getClientDetail(String code);
}
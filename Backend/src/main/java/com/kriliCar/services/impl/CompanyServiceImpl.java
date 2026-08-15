package com.kriliCar.services.impl;

import com.kriliCar.dtos.CompanyProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.dtos.responses.CompanyAdminSummaryDTO;
import com.kriliCar.dtos.responses.CompanyDetailResponse;
import com.kriliCar.dtos.responses.CompanyProfileResponse;
import com.kriliCar.dtos.responses.CompanyStatsDTO;
import com.kriliCar.entities.Car;
import com.kriliCar.entities.Company;
import com.kriliCar.entities.Reservation;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.exceptions.UnauthorizedActionException;
import com.kriliCar.mappers.CarMapper;
import com.kriliCar.mappers.CompanyMapper;
import com.kriliCar.repositories.CarRepository;
import com.kriliCar.repositories.CompanyRepository;
import com.kriliCar.repositories.ReservationRepository;
import com.kriliCar.services.interfaces.CompanyService;
import com.kriliCar.services.interfaces.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des profils Company.
 * - Modification des informations personnelles
 * - Changement de mot de passe sécurisé (avec vérification de l'ancien)
 * - Gestion des images de profil
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;
    private final CompanyMapper companyMapper; // MapStruct pour DTO

    // 🆕 Dépendances nécessaires à l'agrégation US-7.5 (voitures + réservations)
    private final CarRepository carRepository;
    private final CarMapper carMapper;
    private final ReservationRepository reservationRepository;

    /**
     * US-1.4 : Modifier le profil Company.
     *
     * ✅ Email et rôle sont NON modifiables
     * ✅ Gestion sécurisée de l'image (suppression avant upload)
     * ✅ @Transactional assure la cohérence
     *
     * @param email Email de la Company (du token JWT)
     * @param request Données de modification
     * @param imageFile Image de profil optionnelle
     * @return DTO de réponse (sans password)
     * @throws 'IOException' En cas d'erreur lors du traitement du fichier
     */
    @Override
    @Transactional
    public CompanyProfileResponse updateProfile(
            String email,
            CompanyProfileRequest request,
            MultipartFile imageFile) throws IOException {

        // 1. Récupération sécurisée de la Company
        Company company = companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", email));

        log.info("Début de modification du profil pour la société : {}", company.getCode());

        // 2. Mise à jour des champs modifiables
        // ⚠️ Email et Rôle ne sont JAMAIS modifiés (assurance double)
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            company.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            company.setLastName(request.getLastName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            company.setPhone(request.getPhone().trim());
        }
        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            company.setCompanyName(request.getCompanyName().trim());
        }
        if (request.getLandline() != null && !request.getLandline().isBlank()) {
            company.setLandline(request.getLandline().trim());
        }
        if (request.getCity() != null) {
            company.setCity(request.getCity());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            company.setDescription(request.getDescription().trim());
        }

        // 3. Gestion de l'image de profil
        if (imageFile != null && !imageFile.isEmpty()) {
            // Suppression de l'ancienne image si elle existe
            if (company.getImage() != null && !company.getImage().isBlank()) {
                try {
                    fileService.deleteFile(company.getImage());
                    log.debug("Ancienne image supprimée pour {}", company.getCode());
                } catch (Exception e) {
                    log.warn("Impossible de supprimer l'ancienne image pour {} : {}", company.getCode(), e.getMessage());
                    // On continue même si la suppression échoue
                }
            }
            // Upload de la nouvelle image
            String imagePath = fileService.uploadFile(imageFile, "Company");
            company.setImage(imagePath);
            log.debug("Nouvelle image uploadée pour {} : {}", company.getCode(), imagePath);
        }

        // 4. Sauvegarde et retour du DTO
        Company updated = companyRepository.save(company);
        log.info("Profil modifié avec succès pour la société : {}", company.getCode());

        return companyMapper.toProfileResponse(updated);
    }

    /**
     * US-1.4 (extension) : Changement sécurisé du mot de passe.
     *
     * ✅ Vérifie l'ancien mot de passe avant de le modifier
     * ✅ Encodage du nouveau mot de passe en BCrypt
     *
     * ⚠️ La confirmation (newPassword == confirmPassword) est déjà validée
     * côté Frontend (Angular). Le Backend ne reçoit que oldPassword et newPassword.
     *
     * @param email Email de la Company
     * @param request Ancien + nouveau mot de passe
     * @return DTO de réponse (confirmation de changement)
     */
    @Override
    @Transactional
    public CompanyProfileResponse changePassword(
            String email,
            ChangePasswordRequest request) {

        // 1. Récupération sécurisée de la Company
        Company company = companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", email));

        log.info("Début du changement de mot de passe pour la société : {}", company.getCode());

        // 2. Vérification de l'ancien mot de passe
        if (!passwordEncoder.matches(request.getOldPassword(), company.getPassword())) {
            log.warn("Tentative de changement de mot de passe avec ancien mot de passe incorrect pour : {}",
                    company.getCode());
            throw new UnauthorizedActionException("L'ancien mot de passe est incorrect.");
        }

        // 3. Vérification que le nouveau mot de passe est différent de l'ancien
        if (passwordEncoder.matches(request.getNewPassword(), company.getPassword())) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit être différent de l'ancien.");
        }

        // 4. Encodage et mise à jour
        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        company.setPassword(hashedPassword);

        Company updated = companyRepository.save(company);
        log.info("Mot de passe modifié avec succès pour la société : {}", company.getCode());

        return companyMapper.toProfileResponse(updated);
    }

    // ------------------------- US-6.1 : DEMANDE DE BOOST -------------------------
    @Override
    @Transactional
    public CompanyProfileResponse requestBoost(String email) {

        Company company = companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", email));

        // 1. Idempotence : Boost déjà actif
        if (Boolean.TRUE.equals(company.getIsBooster())) {
            throw new IllegalStateException(
                    "Votre société bénéficie déjà de l'option Boost. Aucune nouvelle demande n'est nécessaire.");
        }

        // 2. Idempotence : demande déjà en attente
        if (Boolean.TRUE.equals(company.getBoostRequested())) {
            throw new IllegalStateException(
                    "Une demande de Boost est déjà en attente de validation par l'administrateur.");
        }

        // 3. Enregistrement de la demande
        company.setBoostRequested(true);
        company.setBoostRequestedAt(LocalDateTime.now());

        Company updated = companyRepository.save(company);
        log.info("Demande de Boost enregistrée pour la société : {}", company.getCode());

        return companyMapper.toProfileResponse(updated);
    }

    // ------------------------- US-6.2 : LISTE DES DEMANDES EN ATTENTE -------------------------
    @Override
    @Transactional(readOnly = true)
    public List<CompanyProfileResponse> getPendingBoostRequests() {
        return companyRepository.findByBoostRequestedTrue().stream()
                .map(companyMapper::toProfileResponse)
                .collect(Collectors.toList());
    }

    // ------------------------- US-6.2 : VALIDATION/ACTIVATION PAR L'ADMIN -------------------------
    @Override
    @Transactional
    public CompanyProfileResponse activateBoost(String code) {

        Company company = companyRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "code", code));

        // 1. Idempotence : Boost déjà actif
        if (Boolean.TRUE.equals(company.getIsBooster())) {
            throw new IllegalStateException("Cette société bénéficie déjà de l'option Boost.");
        }

        // 2. Cohérence du flux en 2 temps : pas de demande en attente = rien à valider
        if (!Boolean.TRUE.equals(company.getBoostRequested())) {
            throw new IllegalStateException(
                    "Aucune demande de Boost en attente pour cette société. Impossible d'activer.");
        }

        // 3. Activation
        company.setIsBooster(true);
        company.setBoostRequested(false);
        company.setBoostActivatedAt(LocalDateTime.now());

        Company updated = companyRepository.save(company);
        log.info("Boost activé par l'administrateur pour la société : {}", company.getCode());

        return companyMapper.toProfileResponse(updated);
    }

    // ------------------------- US-7.1 : LISTE FILTRÉE (ADMIN) -------------------------
    @Override
    @Transactional(readOnly = true)
    public List<CompanyAdminSummaryDTO> getCompanies(Boolean active, Boolean boosted) {
        return companyRepository.findCompaniesByFilters(active, boosted).stream()
                .map(companyMapper::toAdminSummary)
                .collect(Collectors.toList());
    }

    // ------------------------- US-7.2 : ACTIVATION / DÉSACTIVATION (ADMIN) -------------------------
    @Override
    @Transactional
    public CompanyAdminSummaryDTO setCompanyActiveStatus(String code, boolean active) {

        Company company = companyRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "code", code));

        if (Boolean.valueOf(active).equals(company.getActive())) {
            String state = active ? "déjà active" : "déjà désactivée";
            throw new IllegalStateException("Cette société est " + state + ".");
        }

        company.setActive(active);
        Company updated = companyRepository.save(company);

        log.info("Statut du compte Company {} modifié par l'Admin -> active={}", company.getCode(), active);

        return companyMapper.toAdminSummary(updated);
    }

    // ------------------------- US-7.5 : DÉTAIL COMPLET (ADMIN) -------------------------
    @Override
    @Transactional(readOnly = true)
    public CompanyDetailResponse getCompanyDetail(String code) {

        Company company = companyRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "code", code));

        List<Car> cars = carRepository.findByCompany_Code(code);
        List<Reservation> reservations = reservationRepository.findByCarCompany(company);

        CompanyStatsDTO stats = CompanyStatsDTO.builder()
                .totalCars(cars.size())
                .availableCars(cars.stream().filter(c -> c.getAvailability() == CarAvailability.AVAILABLE).count())
                .maintenanceCars(cars.stream().filter(c -> c.getAvailability() == CarAvailability.MAINTENANCE).count())
                .reservedCars(cars.stream().filter(c -> c.getAvailability() == CarAvailability.RESERVED).count())
                .totalReservations(reservations.size())
                .pendingReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count())
                .confirmedReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .cancelledReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .completedReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.COMPLETED).count())
                .build();

        return CompanyDetailResponse.builder()
                .code(company.getCode())
                .companyName(company.getCompanyName())
                .firstName(company.getFirstName())
                .lastName(company.getLastName())
                .email(company.getEmail())
                .phone(company.getPhone())
                .image(company.getImage())
                .landline(company.getLandline())
                .city(company.getCity())
                .description(company.getDescription())
                .active(company.getActive())
                .isBooster(company.getIsBooster())
                .boostRequested(company.getBoostRequested())
                .boostRequestedAt(company.getBoostRequestedAt())
                .boostActivatedAt(company.getBoostActivatedAt())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .cars(cars.stream().map(carMapper::toDTO).collect(Collectors.toList()))
                .stats(stats)
                .build();
    }
}
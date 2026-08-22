package com.kriliCar.services.impl;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.dtos.responses.ClientAdminSummaryDTO;
import com.kriliCar.dtos.responses.ClientDetailResponse;
import com.kriliCar.dtos.responses.ClientStatsDTO;
import com.kriliCar.entities.Client;
import com.kriliCar.entities.Reservation;
import com.kriliCar.entities.WishList;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.exceptions.UnauthorizedActionException;
import com.kriliCar.mappers.CarMapper;
import com.kriliCar.mappers.ClientMapper;
import com.kriliCar.mappers.ReservationMapper;
import com.kriliCar.repositories.ClientRepository;
import com.kriliCar.repositories.ReservationRepository;
import com.kriliCar.repositories.WishlistRepository;
import com.kriliCar.services.interfaces.ClientService;
import com.kriliCar.services.interfaces.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;
    private final ClientMapper clientMapper;

    // 🆕 Dépendances nécessaires à l'agrégation US-7.5 (réservations + wishlist)
    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final WishlistRepository wishlistRepository;
    private final CarMapper carMapper;

    /**
     * US-1.5 (extension) : Récupérer le profil du client connecté.
     * Utilisé par le Front pour pré-remplir le formulaire de modification.
     */
    @Override
    @Transactional(readOnly = true)
    public ClientDisplayDTO getMyProfile(String email) {
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "email", email));

        return clientMapper.toDisplayDTO(client);
    }

    /**
     * US-1.5 : Modifier le profil Client (infos perso + image).
     * ⚠️ Email et rôle non modifiables. Mot de passe non modifiable ici (cf. changePassword).
     */
    @Override
    @Transactional
    public ClientDisplayDTO updateProfile(String email, ClientProfileRequest request, MultipartFile imageFile) throws IOException {

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "email", email));

        if (StringUtils.hasText(request.getFirstName())) {
            client.setFirstName(request.getFirstName().trim());
        }
        if (StringUtils.hasText(request.getLastName())) {
            client.setLastName(request.getLastName().trim());
        }
        if (StringUtils.hasText(request.getPhone())) {
            client.setPhone(request.getPhone().trim());
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            if (StringUtils.hasText(client.getImage())) {
                fileService.deleteFile(client.getImage());
            }
            String path = fileService.uploadFile(imageFile, "Client");
            client.setImage(path);
        }

        Client saved = clientRepository.save(client);
        log.info("Profil modifié avec succès pour le client : {}", saved.getCode());

        return clientMapper.toDisplayDTO(saved);
    }

    /**
     * US-1.5 (extension) : Changement sécurisé du mot de passe.
     * ✅ Vérifie l'ancien mot de passe avant modification
     * ✅ Encodage BCrypt du nouveau mot de passe
     */
    @Override
    @Transactional
    public ClientDisplayDTO changePassword(String email, ChangePasswordRequest request) {

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "email", email));

        if (!passwordEncoder.matches(request.getOldPassword(), client.getPassword())) {
            log.warn("Tentative de changement de mot de passe avec ancien mot de passe incorrect pour : {}", client.getCode());
            throw new UnauthorizedActionException("L'ancien mot de passe est incorrect.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), client.getPassword())) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit être différent de l'ancien.");
        }

        client.setPassword(passwordEncoder.encode(request.getNewPassword()));
        Client saved = clientRepository.save(client);
        log.info("Mot de passe modifié avec succès pour le client : {}", saved.getCode());

        return clientMapper.toDisplayDTO(saved);
    }

    // ------------------------- US-7.3 : LISTE FILTRÉE (ADMIN) -------------------------
    @Override
    @Transactional(readOnly = true)
    public List<ClientAdminSummaryDTO> getClients(Boolean active) {
        return clientRepository.findClientsByFilter(active).stream()
                .map(clientMapper::toAdminSummary)
                .collect(Collectors.toList());
    }

    // ------------------------- US-7.4 : ACTIVATION / DÉSACTIVATION (ADMIN) -------------------------
    @Override
    @Transactional
    public ClientAdminSummaryDTO setClientActiveStatus(String code, boolean active) {

        Client client = clientRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "code", code));

        if (Boolean.valueOf(active).equals(client.getActive())) {
            String state = active ? "déjà actif" : "déjà désactivé";
            throw new IllegalStateException("Ce compte client est " + state + ".");
        }

        client.setActive(active);
        Client updated = clientRepository.save(client);

        log.info("Statut du compte Client {} modifié par l'Admin -> active={}", client.getCode(), active);

        return clientMapper.toAdminSummary(updated);
    }

    // ------------------------- US-7.5 : DÉTAIL COMPLET (ADMIN) -------------------------
    @Override
    @Transactional(readOnly = true)
    public ClientDetailResponse getClientDetail(String code) {

        Client client = clientRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "code", code));

        List<Reservation> reservations = reservationRepository.findByClient(client);
        List<WishList> wishlistEntries = wishlistRepository.findByClientId(client.getId());

        List<CarDTO> wishlist = wishlistEntries.stream()
                .map(WishList::getCar)
                .map(carMapper::toDTO)
                .collect(Collectors.toList());

        ClientStatsDTO stats = ClientStatsDTO.builder()
                .totalReservations(reservations.size())
                .pendingReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count())
                .confirmedReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .cancelledReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .completedReservations(reservations.stream().filter(r -> r.getStatus() == ReservationStatus.COMPLETED).count())
                .wishlistCount(wishlistEntries.size())
                .build();

        return ClientDetailResponse.builder()
                .code(client.getCode())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .image(client.getImage())
                .active(client.getActive())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .reservations(reservationMapper.toDTOList(reservations))
                .wishlist(wishlist)
                .stats(stats)
                .build();
    }
}
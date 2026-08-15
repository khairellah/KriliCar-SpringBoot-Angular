package com.kriliCar.mappers;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.responses.ClientAdminSummaryDTO;
import com.kriliCar.entities.Client;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ClientMapper {

    /**
     * Convertit une entité Client en DTO d'affichage de profil.
     * ✅ N'expose pas le password
     * ✅ Implémentation manuelle (default method) : la génération automatique
     *    MapStruct échoue silencieusement sur les entités en héritage JOINED
     *    (Client -> AppUser -> BaseEntity, getters Lombok sur les parents),
     *    produisant un DTO avec tous les champs à null (même défaut observé
     *    précédemment sur CompanyMapper). Le mapping explicite lève cette ambiguïté.
     */
    default ClientDisplayDTO toDisplayDTO(Client client) {
        if (client == null) {
            return null;
        }

        ClientDisplayDTO dto = new ClientDisplayDTO();
        dto.setCode(client.getCode());
        dto.setFirstName(client.getFirstName());
        dto.setLastName(client.getLastName());
        dto.setPhone(client.getPhone());
        dto.setEmail(client.getEmail());
        dto.setImage(client.getImage());
        dto.setRole(client.getRole());
        return dto;
    }

    // --- US-7.3 : vue de synthèse Admin (inclut `active`) ---
    default ClientAdminSummaryDTO toAdminSummary(Client client) {
        if (client == null) {
            return null;
        }
        return ClientAdminSummaryDTO.builder()
                .code(client.getCode())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .active(client.getActive())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }
}
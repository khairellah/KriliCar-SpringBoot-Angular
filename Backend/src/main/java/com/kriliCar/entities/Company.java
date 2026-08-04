package com.kriliCar.entities;


import com.kriliCar.enums.City;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "companies")
// @PrimaryKeyJoinColumn(name = "company_id")
@Getter @Setter @NoArgsConstructor
@SuperBuilder
public class Company extends AppUser {

    @Column(name = "company_name")
    private String companyName;

    private String landline; // Téléphone fixe

    @Enumerated(EnumType.STRING)
    private City city;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Boolean isBooster = false;
}
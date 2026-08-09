package com.kriliCar.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "brands")
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public class Brand extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String name;
}
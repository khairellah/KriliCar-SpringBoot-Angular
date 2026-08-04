package com.kriliCar.entities;


import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "clients")
// @PrimaryKeyJoinColumn(name = "client_id")
@Data
@NoArgsConstructor
@SuperBuilder
public class Client extends AppUser {
}
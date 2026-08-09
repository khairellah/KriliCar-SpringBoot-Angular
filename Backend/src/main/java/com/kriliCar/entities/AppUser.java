package com.kriliCar.entities;

import com.kriliCar.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public abstract class AppUser extends BaseEntity implements UserDetails {

    private String firstName;
    private String lastName;
    private String phone;
    private String image;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // --- US-1.8 : Statut d'activation du compte ---
    // Piloté exclusivement par l'Admin (US-7.2 / US-7.4), jamais par le titulaire du compte.
    // @ColumnDefault("true") assure que MySQL backfill les lignes existantes à TRUE
    // lors de l'ALTER TABLE (ddl-auto=update), sans casser les comptes déjà en base.
    @Column(nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private Boolean active = true;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(this.role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    // US-1.8 : le compte n'est utilisable (login + accès aux ressources) que si active == true.
    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(this.active);
    }
}
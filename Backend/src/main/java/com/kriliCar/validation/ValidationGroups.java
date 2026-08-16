package com.kriliCar.validation;

import jakarta.validation.groups.Default;

/**
 * US-9.2 : Groupes de validation Jakarta Bean Validation.
 *
 * Permet de différencier, pour un même DTO réutilisé en création ET en mise
 * à jour partielle (ex: CarDTO), les contraintes obligatoires uniquement à
 * la création (OnCreate) de celles toujours applicables si la valeur est
 * fournie (groupe par défaut, ex: @Positive, @Size).
 *
 * OnCreate / OnUpdate étendent Default : les contraintes SANS groupe explicite
 * (donc rattachées au groupe Default) restent validées dans les deux cas.
 */
public final class ValidationGroups {

    private ValidationGroups() {
    }

    public interface OnCreate extends Default {}

    public interface OnUpdate extends Default {}
}
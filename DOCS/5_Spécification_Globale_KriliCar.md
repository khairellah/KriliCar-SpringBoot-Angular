# Spécification Globale – Application KriliCar

> Ce document consolide le cahier des charges, la description fonctionnelle, le scénario de fonctionnement et l'analyse du code existant (repo Git) en un seul référentiel. Il sert de **source de vérité unique** pour la suite du développement et le découpage en User Stories / Sprints.

---

## 1. Stack technique

| Composant | Technologie | Statut |
|---|---|---|
| API Backend | Spring Boot 3.4.2 (Java 21) | Implémenté |
| Frontend Web | Angular | À développer |
| Application mobile | Dart / Flutter | Phase ultérieure (hors périmètre v1) |
| Base de données | **MySQL** (phase 1, sans Docker – instance locale) | Implémenté |
| Sécurité | JWT (stateless), BCrypt, rôles via `@PreAuthorize` | Implémenté |
| Documentation API | Swagger / OpenAPI (`springdoc-openapi`) | **À ajouter** |
| Mapping DTO ↔ Entité | MapStruct | Implémenté |
| Upload fichiers | `FileService` (stockage local, chemin relatif en base) | Implémenté |

**Décisions actées :**
- Pas de Docker en phase 1 → connexion directe à une instance MySQL locale (`application.properties`/`.yml` à configurer en conséquence, le `docker-compose.yml` existant reste en réserve pour une phase ultérieure).
- Swagger/OpenAPI sera ajouté au projet (dépendance manquante actuellement dans `pom.xml`).
- La gestion des erreurs HTTP 401 (non authentifié) et 403 (non autorisé) est confirmée comme exigence active — déjà partiellement en place (`AuthEntryPointJwt`, `AuthAccessDeniedHandler`), à compléter pour les erreurs de validation (`@Valid`).

---

## 2. Acteurs du système

Trois types d'utilisateurs, tous héritant d'une entité commune `AppUser` (email, mot de passe, prénom, nom, téléphone, photo, rôle) :

| Acteur | Rôle technique | Création |
|---|---|---|
| Administrateur | `ADMIN` | Compte unique créé automatiquement au démarrage de l'application (seed), mot de passe haché en base |
| Société de location | `COMPANY` | Inscription libre et gratuite |
| Client | `CLIENT` | Inscription libre et gratuite |

**Règles communes à tous les comptes :**
- L'**email et le rôle sont définis à la création et ne sont jamais modifiables** ensuite, quel que soit le type de compte.
- Chaque utilisateur peut modifier ses informations personnelles (mot de passe, photo, nom, téléphone...) via un endpoint de profil dédié à son rôle.

---

## 3. Authentification (JWT)

- Login unique par **email + mot de passe**, commun aux 3 rôles.
- Génération d'un token JWT signé contenant le rôle de l'utilisateur (`ROLE_ADMIN`, `ROLE_COMPANY`, `ROLE_CLIENT`).
- Gestion des erreurs :
  - **401 Unauthorized** : token absent, invalide ou expiré.
  - **403 Forbidden** : token valide mais rôle insuffisant pour la ressource demandée.
- Mot de passe stocké **haché** (BCrypt) en base, jamais en clair.

---

## 4. Administrateur (Admin)

### 4.1 Gestion du compte
- Modifier ses informations personnelles : mot de passe, photo, nom, prénom, téléphone.
- **Login/email non modifiable.**
- Compte créé automatiquement au démarrage de l'application (`CommandLineRunner` / seed), avec mot de passe haché en base.

### 4.2 Gestion des sociétés (Company)
- **Activer le Boost** d'une société — *dernière étape d'un flux en 2 temps* :
  1. La Company effectue une **demande de Boost** (bouton dédié).
  2. L'Admin **valide et active** le Boost (lié à un paiement géré hors ligne en v1, pas de paiement en ligne).
- **Activer / Désactiver un compte Company** (blocage d'accès sans suppression des données).
- **Lister toutes les sociétés**, avec filtres :
  - statut du compte (actif / inactif)
  - statut Boost (boostée / non boostée)
- Voir le détail complet d'une société (profil, voitures, statistiques).

### 4.3 Gestion des clients
- **Activer / Désactiver un compte Client.**
- **Lister tous les clients.**
- Voir le détail complet d'un client.

### 4.4 Gestion des marques
- CRUD complet (créer, modifier, supprimer, consulter).

### 4.5 Gestion des modèles
- CRUD complet, chaque modèle rattaché obligatoirement à une marque.
- Vérification de cohérence marque/modèle et unicité du nom de modèle par marque.

### 4.6 KPI (vue globale plateforme)
- **Sociétés (Company)**
  - nombre de comptes actifs
  - nombre de comptes inactifs
  - nombre de comptes avec Boost actif
- **Clients**
  - nombre de comptes actifs
  - nombre de comptes inactifs
- **Réservations**
  - nombre de réservations OK (confirmées + terminées)
  - nombre de réservations KO (annulées)
  - nombre de réservations en attente (PENDING)
- **WishList**
  - nombre total d'entrées WishList *(à préciser lors du développement : total brut, ou top voitures les plus ajoutées)*
- **Voitures**
  - nombre total de voitures, réparties par état (AVAILABLE / RESERVED / MAINTENANCE)

---

## 5. Société de location (Company)

### 5.1 Gestion du compte
- Créer un compte (inscription gratuite, rôle `COMPANY` assigné automatiquement, code métier généré).
- Modifier ses informations : mot de passe, photo, nom, téléphone, ville, description, raison sociale...
- **Login/email non modifiable.**

### 5.2 Gestion des voitures
- Ajouter une voiture (VIN, marque, modèle, année, kilométrage, boîte, carburant, couleur, nb places, prix/jour, description, images).
- Modifier une voiture.
- Supprimer une voiture.
- Définir/consulter l'état de la voiture :
  - `AVAILABLE` / `MAINTENANCE` : gérés manuellement par la Company.
  - `RESERVED` : piloté **automatiquement** par le cycle de réservation (voir §5.3).
- **Recherche simple** et **recherche avancée** sur son propre catalogue (marque, modèle, ville, prix, kilométrage, nb places) : ce sont les mêmes filtres que la recherche Client, réutilisés pour permettre à une Company de consulter/filtrer son propre parc de véhicules.

### 5.3 Gestion des réservations
- Consulter la liste des réservations reçues, avec leur statut.
- Recevoir une **notification** lorsqu'une nouvelle réservation est créée en statut `PENDING`.
- Contacter le client par téléphone pour confirmer les détails (processus manuel, hors système).
- Décider de :
  - **Valider** → statut `CONFIRMED`, la voiture passe automatiquement à `RESERVED`.
  - **Annuler** → statut `CANCELLED`, la voiture repasse à `AVAILABLE`.
- À la fin de la période de location → statut `COMPLETED`, la voiture repasse automatiquement à `AVAILABLE`.

### 5.4 Option Boost
- Demander l'activation du Boost via un bouton dédié.
- Une fois validé par l'Admin, les annonces de la Company sont **mises en avant** dans les résultats de recherche Client, par rapport aux sociétés non boostées.

### 5.5 Statistiques / KPI (vue Company)
- Nombre total de voitures, réparties par état (disponible / réservée / en maintenance).
- Nombre total de réservations.
- Nombre de réservations validées et annulées.

---

## 6. Client

### 6.1 Gestion du compte
- Créer un compte (inscription gratuite, rôle `CLIENT` assigné automatiquement).
- Modifier ses informations : mot de passe, photo, nom, téléphone...
- **Login/email non modifiable.**

### 6.2 Recherche de voitures
- Recherche simple : marque, modèle, ville.
- Recherche avancée : + prix, kilométrage, nombre de places.
- Seules les voitures au statut `AVAILABLE` apparaissent dans les résultats.

### 6.3 WishList
- Ajouter une voiture à la WishList.
- Consulter sa WishList.
- Retirer une voiture de la WishList.

### 6.4 Réservation
- Effectuer une réservation : sélection d'une voiture disponible, date de début + nombre de jours.
  - Vérification automatique de l'absence de conflit de dates sur la voiture.
  - Calcul automatique du prix total (prix/jour × nombre de jours).
  - Création avec le statut initial `PENDING`.
- Suivre l'état de sa réservation (`PENDING` → `CONFIRMED`/`CANCELLED` → `COMPLETED`).
- **Annuler sa réservation uniquement si elle est encore au statut `PENDING`** (« en cours » / non encore traitée par la Company). Au-delà (`CONFIRMED`), l'annulation redevient une action de la Company (cf. §5.3), afin d'éviter les annulations client sans contact préalable.

---

## 7. Fonctionnalités transverses

- **Documentation API** : Swagger/OpenAPI, accessible publiquement (`/swagger-ui.html`), pour documenter l'ensemble des endpoints REST.
- **Gestion des erreurs globale** : réponses JSON standardisées via `ErrorResponse` pour les codes 400, 401, 403, 404, 409, 500 — à compléter avec un handler dédié aux erreurs de validation (`@Valid` / `MethodArgumentNotValidException`).
- **Upload de fichiers** : photos de profil (Admin/Company/Client) et images de voitures, stockage local avec chemin relatif en base.
- **Sécurité par propriété (ownership)** : une Company ne peut agir que sur ses propres voitures et réservations ; un Client ne peut agir que sur ses propres réservations et sa propre WishList — contrôlé via des expressions `@PreAuthorize` combinées à des vérifications de propriété au niveau service.

---

## 8. Hors périmètre – Version 1

Ces éléments sont explicitement exclus du développement actuel :

- Paiement en ligne des réservations.
- Paiement en ligne du Boost (le paiement reste un processus externe/manuel validé par l'Admin).
- Application mobile Flutter.
- Notifications email/mobile automatisées et externes (seule la notification interne "nouvelle réservation PENDING" est prévue en v1).
- Système de notation / avis des sociétés.

---

## 9. Recommandations d'architecture (évolutions nécessaires du modèle de données)

L'analyse du code existant montre que certaines fonctionnalités demandées **nécessitent des ajouts au modèle de données actuel**, qui ne les prévoit pas :

1. **Activation/désactivation de compte** (§4.2, §4.3) : aucun champ `active`/`enabled` n'existe aujourd'hui sur `AppUser`. Il faut l'ajouter à la classe mère `AppUser`, et l'utiliser dans `UserDetails.isEnabled()` (déjà présent mais actuellement câblé en dur à `true`) pour bloquer réellement l'accès des comptes désactivés au login.
2. **Flux Boost en 2 étapes** (§4.2, §5.4) : le champ actuel `Company.isBooster` (booléen simple) ne suffit pas à représenter *demande en attente* vs *actif*. Recommandation : soit un statut enum (`NONE`, `REQUESTED`, `ACTIVE`), soit deux champs (`boostRequested: boolean`, `isBooster: boolean`), avec horodatage de la demande.
3. **Retrait du champ `isBooster` des DTO d'inscription Company** : actuellement exposé côté client à l'inscription, ce qui permettrait une auto-activation non désirée — à corriger dès que la US Boost sera traitée.
4. **Cohérence des identifiants du compte Admin par défaut** : à harmoniser entre le code (`DataInitializer`) et la documentation fonctionnelle (valeurs actuelles dans le code : `admin@krili.com` / `admin@2026`).

---

## 10. Roadmap – User Stories alignées avec l'historique Git

Cette section reprend les tickets déjà identifiables dans le code existant (commentaires `US-X.X`, `KC-XX`) et les complète avec les User Stories manquantes, afin de poursuivre le développement dans la continuité de l'existant plutôt que de le réécrire.

### Sprint 0 – Initialisation
- **US-0.1** – Structure monorepo, socle Spring Boot (JPA, Security, Web), MapStruct, Lombok — ✅ *Existant, réutilisable*

### Sprint 1 – Authentification & Comptes
- **US-1.1** – Authentification JWT (login) — ✅ *Existant, réutilisable*
- **US-1.2** – Inscription Client — ✅ *Existant, réutilisable*
- **US-1.3** – Inscription Company — ⚠️ *Existant, à corriger (retirer `isBooster` du DTO d'inscription)*
- **US-1.4** – Modification profil Company — ✅ *Existant, réutilisable*
- **US-1.5** – Modification profil Client — 🆕 *À développer*
- **US-1.6** – Modification profil Admin — 🆕 *À développer*
- **US-1.7** – Seed du compte Admin par défaut — ⚠️ *Existant, à harmoniser avec la doc*
- **US-1.8** – Ajout du champ `active` sur `AppUser` + blocage login si compte désactivé — 🆕 *À développer (prérequis technique pour US-7.x)*

### Sprint 2 – Référentiel Marques / Modèles
- **US-2.1** – CRUD Marques (Admin) — ✅ *Existant, réutilisable*
- **US-2.2** – CRUD Modèles (Admin) — ✅ *Existant, réutilisable*

### Sprint 3 – Voitures
- **US-3.1** – CRUD Voitures (Company) — ✅ *Existant, réutilisable*
- **KC-20** – Upload/suppression des images voiture — ✅ *Existant, réutilisable (à la création uniquement)*
- **US-3.2** – Modification des images lors de l'update d'une voiture — 🆕 *À développer (gap identifié : `updateCar` ne gère pas les images)*
- **US-3.3** – Recherche simple/avancée des voitures (Client) — ✅ *Existant, réutilisable*
- **US-3.4** – Réutilisation de la recherche pour le catalogue Company — 🆕 *À développer (adapter le filtre pour restreindre à `companyId` courant)*

### Sprint 4 – WishList
- **US-4.1** – Ajout/consultation/suppression WishList (Client) — ✅ *Existant, complet et réutilisable*

### Sprint 5 – Réservations
- **US-5.1** – Création de réservation (Client) — ✅ *Existant, réutilisable*
- **US-5.2** – Consultation des réservations (Client/Company) — ✅ *Existant, réutilisable*
- **US-5.3** – Confirmation/Annulation par la Company — ✅ *Existant, réutilisable*
- **US-5.4** – Passage automatique de la voiture à `RESERVED` — ✅ *Existant, réutilisable*
- **US-5.5** – Fin de réservation (`COMPLETED`) et remise à `AVAILABLE` — ✅ *Existant, réutilisable*
- **US-5.6** – Annulation de la réservation par le Client si statut `PENDING` — 🆕 *À développer*
- **US-5.7** – Notification Company à la création d'une réservation `PENDING` — 🆕 *À développer*

### Sprint 6 – Boost
- **US-6.1** – Demande de Boost (Company) — 🆕 *À développer*
- **US-6.2** – Validation/Activation du Boost (Admin) — 🆕 *À développer*
- **US-6.3** – Mise en avant des sociétés boostées dans les résultats de recherche — 🆕 *À développer*

### Sprint 7 – Gestion des comptes par l'Admin
- **US-7.1** – Liste des sociétés avec filtres (statut, Boost) — 🆕 *À développer*
- **US-7.2** – Activation/Désactivation d'un compte Company — 🆕 *À développer*
- **US-7.3** – Liste des clients — 🆕 *À développer*
- **US-7.4** – Activation/Désactivation d'un compte Client — 🆕 *À développer*
- **US-7.5** – Détail complet d'une société / d'un client (vue Admin) — 🆕 *À développer*

### Sprint 8 – KPI
- **US-8.1** – KPI globaux (vue Admin) — 🆕 *À développer*
- **US-8.2** – KPI Company (nb voitures par état, nb réservations) — 🆕 *À développer*

### Sprint 9 – Transverse / Qualité
- **US-9.1** – Intégration Swagger/OpenAPI — 🆕 *À développer*
- **US-9.2** – Gestion complète des erreurs de validation (400) — 🆕 *À développer*
- **US-9.3** – Tests unitaires et d'intégration (services, sécurité) — 🆕 *À développer*

---

## Légende
- ✅ Existant, réutilisable tel quel
- ⚠️ Existant, nécessite une correction avant réutilisation
- 🆕 Fonctionnalité absente du code actuel, à développer

---

*Document généré à partir de : Cahier des charges, Description fonctionnelle, Scénario général de fonctionnement, Product Backlog (modélisation des entités), et analyse du code source Git existant.*

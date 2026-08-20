# Spécification Frontend Angular – Application KriliCar

> Ce document **complète** `5_Spécification_Globale_KriliCar.md` (backend), sans le remplacer ni le contredire. La Spécification Globale reste la **source de vérité métier unique** (règles de gestion, entités, statuts, acteurs). Ce document ajoute la couche **présentation/consommation** : cartographie des écrans, routing, guards, mapping DTO ↔ modèles TypeScript.
>
> En cas de doute sur une règle métier (ex: qui peut annuler une réservation et quand), se référer systématiquement à `5_Spécification_Globale_KriliCar.md`, section correspondante.
>
> **Les deux documents doivent être présents ensemble** dans le projet Claude Angular : celui-ci ne duplique jamais les règles métier détaillées, il y renvoie.

---

## 0. Structure du dépôt (rappel)

Un **seul** dépôt Git `KriliCar-SpringBoot-Angular`, structuré ainsi en local :

```
KriliCar/
├── Backend/      # Spring Boot — développé et testé, source de vérité API
├── DOCS/         # Documents fonctionnels (.docx / .md)
├── Frontend/     # Angular — actuellement vide, projet à développer ici
├── .gitignore
└── ...
```

Le Frontend Angular sera créé à l'intérieur de `Frontend/`, dans ce même dépôt. Ne jamais raisonner comme s'il s'agissait de deux dépôts distincts.

---

## 1. Stack technique Frontend

Stack choisi pour correspondre aux compétences les plus demandées sur le marché de l'emploi Angular au **Maroc et au Canada** en 2026 (standalone + Signals + NgRx classique restent la combinaison la plus citée dans les offres "enterprise" francophones, Angular Material reste le framework UI le plus attendu) :

| Composant | Choix | Justification marché | Statut |
|---|---|---|---|
| Framework | Angular, dernière version stable (vérifier `Frontend/package.json` dès sa création) | Base incontournable, versions récentes systématiquement exigées | À développer |
| Style de composants | Standalone Components + nouveau control flow (`@if`/`@for`/`@switch`), pas de `NgModule` sauf nécessité justifiée | Compétence de base attendue depuis Angular 17+ | À développer |
| État local (UI) | Signals (formulaires, filtres, pagination, toggles) | Compétence désormais évaluée systématiquement en entretien | À développer |
| État global transverse | **NgRx classique** (Store/Actions/Reducers/Selectors) — réservé à la session utilisateur (token/rôle) et au compteur de notifications Company | Très demandé côté "enterprise" Canada, différenciateur CV/entretien | À développer |
| Async / appels serveur | RxJS avec `HttpClient` (`debounceTime`, `switchMap`, `shareReplay` si pertinent) | Toujours la référence pour l'asynchrone complexe, non remplacé par les Signals | À développer |
| UI Framework | **Angular Material** | Librairie de composants la plus citée dans les offres Angular francophones (Maroc/Québec) | À développer |
| Formulaires | Reactive Forms **typés** (`FormGroup<T>`, `FormControl<T>`) | Standard professionnel, jamais de Template-Driven Forms ni de `any` implicite | À développer |
| Style / CSS | SCSS + thème Angular Material centralisé | Cohérent avec le choix Angular Material | À développer |
| Tests | Jasmine/Karma (outillage par défaut Angular CLI) | Guards, intercepteurs et logique de cycle de vie réservation systématiquement testés | À développer |
| Auth | JWT stocké côté client, intercepteur HTTP dédié | Pattern standard JWT stateless, cohérent avec le backend | À développer |
| Communication API | `HttpClient` avec `provideHttpClient(withInterceptors([...]))` | Approche fonctionnelle moderne (plus de `HTTP_INTERCEPTORS` en classe) | À développer |

**Répartition Signals / RxJS / NgRx (règle de décision)** :
- **Signals** : état propre à un composant, jamais partagé (formulaire en cours de saisie, filtre de recherche local, état d'un toggle).
- **RxJS** : tout flux asynchrone temporel ou combiné (appel HTTP, recherche avec debounce, polling du badge de notifications).
- **NgRx** : uniquement l'état **global et partagé entre plusieurs features** (utilisateur connecté et son rôle décodé du JWT, compteur de réservations `PENDING` affiché dans plusieurs écrans Company). Ne pas y mettre l'état local d'un simple composant — ce serait de la sur-ingénierie pour cette taille d'application.

**Base URL API** : `/api/v1/...` — cohérent avec `SecurityConfig` et les `@RequestMapping` du dossier `Backend/` du dépôt.

---

## 2. Cartographie Rôles → Espaces applicatifs

Reprend exactement les 3 acteurs de la Spécification Globale (§2), sans ajout ni retrait :

| Espace | Accès | Rôle backend requis |
|---|---|---|
| Espace Public | Non authentifié | Aucun (`permitAll`) |
| Espace Client | Authentifié | `CLIENT` |
| Espace Company | Authentifié | `COMPANY` |
| Espace Admin | Authentifié | `ADMIN` |

**Règle transverse reprise du backend** : l'email et le rôle ne sont jamais modifiables après création, pour aucun des 3 acteurs. Aucun formulaire Frontend ne doit donc exposer ces champs en écriture sur les écrans de modification de profil.

---

## 3. Cartographie des routes Angular par rôle

```
/                              → Accueil public (recherche simple)
/search                        → Recherche avancée (public, résultats filtrés AVAILABLE)
/cars/:code                    → Détail d'une voiture (public)
/login                         → Connexion (public)
/register/client               → Inscription Client (public)
/register/company               → Inscription Company (public)

/client/**                     → protégé par roleGuard(['CLIENT'])
  /client/profile
  /client/wishlist
  /client/reservations
  /client/reservations/:code

/company/**                    → protégé par roleGuard(['COMPANY'])
  /company/profile
  /company/cars
  /company/cars/new
  /company/cars/:code/edit
  /company/my-fleet              (US-3.4 : recherche/filtre du parc propre)
  /company/reservations
  /company/reservations/:code
  /company/boost
  /company/kpi                   (US-8.2)

/admin/**                      → protégé par roleGuard(['ADMIN'])
  /admin/profile
  /admin/brands
  /admin/models
  /admin/companies                (US-7.1 : liste filtrable)
  /admin/companies/:code          (US-7.5 : détail complet)
  /admin/companies/boost-pending
  /admin/clients                  (US-7.3 : liste filtrable)
  /admin/clients/:code            (US-7.5 : détail complet)
  /admin/kpi                      (US-8.1)
```

**Guards** (cf. Instructions du projet) :
- `authGuard` : token présent et non expiré → sinon redirection `/login`.
- `roleGuard(...roles)` : rôle décodé du JWT ∈ rôles autorisés → sinon redirection vers une page 403 dédiée, jamais un simple retour silencieux.

---

## 4. Écrans par rôle, endpoints consommés et règles UI associées

Chaque ligne référence l'US backend correspondante (numérotation identique à `5_Spécification_Globale_KriliCar.md`, §10) pour garantir la traçabilité Front/Back. **Tous les endpoints listés ci-dessous sont livrés et testés côté backend.**

### 4.1 Authentification (transverse)

| Écran | Endpoint(s) | US Back liée | Règles UI clés |
|---|---|---|---|
| Login | `POST /api/v1/auth/login` | US-1.1 | Sur `403` avec message "compte désactivé" (`DisabledException`), afficher un message distinct d'un `401` classique. |
| Inscription Client | `POST /api/v1/auth/register/client` (multipart) | US-1.2 | Champ `image` optionnel ; validation front miroir des contraintes `@NotBlank`/`@Size`/`@Pattern` du DTO. |
| Inscription Company | `POST /api/v1/auth/register/company` (multipart) | US-1.3 | **Ne jamais exposer de champ `isBooster`** dans le formulaire : le backend l'ignore désormais côté DTO d'entrée (retiré pour raison de sécurité). |

### 4.2 Espace Client

| Écran | Endpoint(s) | US Back liée | Règles UI clés |
|---|---|---|---|
| Profil Client | `PUT /api/v1/clients/profile`, `PUT /api/v1/clients/profile/change-password` | US-1.5 | Email et rôle affichés en lecture seule uniquement. |
| Recherche simple/avancée | `GET /api/v1/cars/search` | US-3.3 | Résultats limités aux voitures `AVAILABLE` (filtré côté backend, ne pas re-filtrer côté Front). |
| Détail voiture | `GET /api/v1/cars/{code}` | US-3.1 | Bouton "Réserver" visible uniquement si `availability === 'AVAILABLE'`. |
| Wishlist | `GET/POST/DELETE /api/v1/wishlist` et `/api/v1/wishlist/{carCode}` | US-4.1 | Toggle cœur sur les cartes voiture, synchronisé avec l'état de la wishlist. |
| Mes réservations | `GET /api/v1/reservations/my` | US-5.2 | Affichage des statuts avec code couleur : `PENDING` (orange), `CONFIRMED` (bleu), `CANCELLED` (gris), `COMPLETED` (vert). |
| Détail réservation + annulation | `GET /api/v1/reservations/{code}`, `PATCH /api/v1/reservations/{code}/cancel` | US-5.1, US-5.6 | Bouton "Annuler" visible **uniquement** si `status === 'PENDING'` — règle stricte du backend (`IllegalStateException` sinon). |

### 4.3 Espace Company

| Écran | Endpoint(s) | US Back liée | Règles UI clés |
|---|---|---|---|
| Profil Company | `PUT /api/v1/companies/profile`, `.../change-password` | US-1.4 | Idem Client : email/rôle non éditables. |
| Gestion voitures (liste + CRUD) | `POST/PUT/DELETE /api/v1/cars`, `GET /api/v1/cars?companyCode=...` | US-3.1, US-3.2 | Formulaire d'édition d'image : gestion `newImages` (upload) + `imagesToDelete` (liste de **codes**, jamais d'IDs). Statut `RESERVED` non sélectionnable manuellement (rejeté par le backend). |
| Mon parc (recherche interne) | `GET /api/v1/cars/my-fleet` | US-3.4 | Mêmes filtres que la recherche Client, mais scope automatique à la Company connectée (aucun paramètre `companyCode` à envoyer, le backend le déduit du token). |
| Réservations reçues | `GET /api/v1/reservations/my`, `PATCH /api/v1/reservations/{code}/status` | US-5.2, US-5.3, US-5.4, US-5.5 | Actions "Confirmer"/"Annuler" visibles seulement si `status === 'PENDING'`. Badge de notification alimenté par `GET /api/v1/reservations/company/pending-count`. |
| Boost | `POST /api/v1/companies/boost/request` | US-6.1 | Bouton "Demander le Boost" désactivé si `boostRequested === true` ou `isBooster === true`, avec message explicite selon le cas (409 idempotent côté backend). |
| **Statistiques / KPI société** | `GET /api/v1/companies/kpi/my` | **US-8.2** | Aucun paramètre à envoyer — le backend résout la Company via le token (`Principal`). Réponse `CompanyKpiDTO` avec deux blocs : `cars` (total/available/reserved/maintenance) et `reservations` (totalCount/validatedCount/cancelledCount). Prévoir des cartes/compteurs, pas de graphique complexe imposé. |

### 4.4 Espace Admin

| Écran | Endpoint(s) | US Back liée | Règles UI clés |
|---|---|---|---|
| Profil Admin | `PUT /api/v1/admins/profile`, `.../change-password` | US-1.6 | Idem autres profils. |
| Gestion marques | `GET/POST/PUT/DELETE /api/v1/brands` | US-2.1 | CRUD simple, lecture publique déjà en place côté backend. |
| Gestion modèles | `GET/POST/PUT/DELETE /api/v1/models`, `/api/v1/models/brand/{brandCode}` | US-2.2 | Select dépendant Marque → Modèles filtré par `brandCode`. |
| **Liste des sociétés (filtrable)** | `GET /api/v1/admins/companies?active=&boosted=` | **US-7.1** | Deux filtres booléens **combinables et optionnels** (`active`, `boosted`). Prévoir 3 états par filtre dans l'UI : "Tous" (paramètre omis), "Oui" (`true`), "Non" (`false`) — ne jamais envoyer `active=null` en query string, simplement omettre le paramètre. Réponse : liste de `CompanyAdminSummaryDTO` (synthèse, pas le détail complet). |
| **Détail société** | `GET /api/v1/admins/companies/{code}` | **US-7.5** | Réponse `CompanyDetailResponse` : profil complet + `cars: CarDTO[]` + `stats: CompanyStatsDTO`. Vue agrégée en lecture seule — aucune action de mutation sur cet écran, uniquement de la consultation (les actions activate/deactivate/boost restent sur la liste ou des boutons dédiés qui rafraîchissent ensuite ce détail). |
| **Activation / désactivation Company** | `PATCH /api/v1/admins/companies/{code}/activate`, `PATCH /api/v1/admins/companies/{code}/deactivate` | **US-7.2** | Idempotent côté backend (409 si déjà dans l'état demandé) : désactiver le bouton correspondant à l'état courant plutôt que de laisser l'utilisateur déclencher une erreur évitable. Avertir que l'effet est immédiat (tout JWT déjà émis devient inopérant à la requête suivante). |
| **Liste des clients (filtrable)** | `GET /api/v1/admins/clients?active=` | **US-7.3** | Un seul filtre optionnel `active`. Réponse : liste de `ClientAdminSummaryDTO`. |
| **Détail client** | `GET /api/v1/admins/clients/{code}` | **US-7.5** | Réponse `ClientDetailResponse` : profil complet + `reservations: ReservationDTO[]` + `wishlist: CarDTO[]` + `stats: ClientStatsDTO`. Lecture seule. |
| **Activation / désactivation Client** | `PATCH /api/v1/admins/clients/{code}/activate`, `PATCH /api/v1/admins/clients/{code}/deactivate` | **US-7.4** | Même logique d'idempotence et d'effet immédiat que pour Company (US-7.2). |
| Demandes de Boost en attente | `GET /api/v1/admins/companies/boost/pending` | US-6.2 | Tri par `boostRequestedAt` (plus ancien en premier), cohérent avec la recommandation backend. |
| Activation Boost | `PATCH /api/v1/admins/companies/{code}/boost/activate` | US-6.2 | Bouton désactivé si la société n'a pas de demande en attente. |
| **KPI globaux (dashboard plateforme)** | `GET /api/v1/admins/kpi/global` | **US-8.1** | Réponse `AdminKpiDTO`, structure imbriquée par domaine : `companies` (active/inactive/boosted), `clients` (active/inactive), `reservations` (ok/ko/pending — **OK regroupe CONFIRMED + COMPLETED**, à bien restituer côté UI, ne pas les compter séparément sans clarté), `wishlistTotalCount` (nombre brut), `cars` (total/available/reserved/maintenance). Écran dashboard avec cartes de synthèse, éventuellement graphiques camembert pour la répartition voitures/réservations. |

> Tous les écrans listés ci-dessus (y compris ceux marqués US-7.x et US-8.x) sont désormais développables sans dépendance backend bloquante : le code correspondant est livré et testé.

---

## 5. Mapping DTO backend → Modèles TypeScript

Un fichier `*.model.ts` par DTO, dans `core/models/`. Nommage et champs strictement alignés sur l'état **actuel** du dossier `Backend/` du dépôt (ne jamais se baser sur une version antérieure d'un DTO déjà modifiée).

### 5.1 DTO transverses et cœur de métier

| DTO Backend | Champs clés actuels | Points d'attention |
|---|---|---|
| `JwtResponseDTO` | `token`, `email`, `role`, `code` | `role` est la valeur brute de l'enum (`ADMIN`/`COMPANY`/`CLIENT`), sans préfixe `ROLE_`. |
| `ErrorResponse` | `status`, `error`, `message`, `path`, `timestamp` | Base du modèle d'erreur uniforme dans `error.interceptor.ts`. |
| `CarDTO` | `code`, `vin`, `year`, `mileage`, `gearbox`, `fuelType`, `color`, `description`, `nbrSeats`, `price`, `availability`, `brandCode`, `modelCode`, `brandName`, `modelName`, `companyCode`, `images: CarImageDTO[]` | **Pas de champ `id`** ni `companyId` : utiliser exclusivement les `code` métier. |
| `CarImageDTO` | `code`, `path`, `sortOrder` | Pas d'`id` : les suppressions d'images se font par `code`. |
| `ReservationDTO` | `code`, `startDate`, `endDate`, `totalPrice`, `status`, `createdAt`, `carCode`, `car: CarDTO`, `client: ClientDisplayDTO` | `status` = `ReservationStatus`, piloter l'affichage des boutons dessus. |
| `PendingReservationCountDTO` | `pendingCount` | Utilisé pour le badge de notification Company. |
| `BrandDTO` | `code`, `name` | — |
| `ModelDTO` | `code`, `name`, `brandCode`, `brandName` | — |
| `CompanyProfileResponse` | `code`, `firstName`, `lastName`, `email`, `phone`, `image`, `companyName`, `landline`, `city`, `description`, `isBooster`, `boostRequested`, `boostRequestedAt`, `boostActivatedAt`, `updatedAt` | Ne contient jamais le `password`. Utilisé pour le **self-service** Company (profil + flux Boost), à ne pas confondre avec `CompanyAdminSummaryDTO`. |
| `ClientDisplayDTO` / `UserDisplayDTO` | `code`, `firstName`, `lastName`, `phone`, `email`, `image`, `role` | Base commune d'affichage pour Client/Admin en self-service. |

### 5.2 DTO dédiés à la vue Admin (US-7.x / US-8.x)

| DTO Backend | Champs clés | Usage Frontend |
|---|---|---|
| `CompanyAdminSummaryDTO` | `code`, `companyName`, `firstName`, `lastName`, `email`, `phone`, `city`, `active`, `isBooster`, `boostRequested`, `createdAt`, `updatedAt` | Ligne de tableau pour l'écran liste des sociétés (US-7.1). Contient `active`, absent de `CompanyProfileResponse`. |
| `ClientAdminSummaryDTO` | `code`, `firstName`, `lastName`, `email`, `phone`, `active`, `createdAt`, `updatedAt` | Ligne de tableau pour l'écran liste des clients (US-7.3). Pas de champs Boost (concept propre à Company). |
| `CompanyDetailResponse` | Profil complet (mêmes champs que `CompanyAdminSummaryDTO` + `landline`, `description`, `boostRequestedAt`, `boostActivatedAt`, `createdAt`) + `cars: CarDTO[]` + `stats: CompanyStatsDTO` | Écran détail société (US-7.5). Vue agrégée en lecture seule. |
| `ClientDetailResponse` | Profil complet + `reservations: ReservationDTO[]` + `wishlist: CarDTO[]` + `stats: ClientStatsDTO` | Écran détail client (US-7.5). Vue agrégée en lecture seule. |
| `CompanyStatsDTO` | `totalCars`, `availableCars`, `maintenanceCars`, `reservedCars`, `totalReservations`, `pendingReservations`, `confirmedReservations`, `cancelledReservations`, `completedReservations` | Bloc statistiques imbriqué dans `CompanyDetailResponse`. |
| `ClientStatsDTO` | `totalReservations`, `pendingReservations`, `confirmedReservations`, `cancelledReservations`, `completedReservations`, `wishlistCount` | Bloc statistiques imbriqué dans `ClientDetailResponse`. |
| `AdminKpiDTO` | `companies: { activeCount, inactiveCount, boostedCount }`, `clients: { activeCount, inactiveCount }`, `reservations: { okCount, koCount, pendingCount }`, `wishlistTotalCount`, `cars: { totalCount, availableCount, reservedCount, maintenanceCount }` | Dashboard KPI Admin (US-8.1). Structure **imbriquée par domaine** — répliquer des sous-interfaces TS correspondantes plutôt qu'un objet plat. |
| `CompanyKpiDTO` | `cars: { totalCount, availableCount, reservedCount, maintenanceCount }` (même forme que `AdminKpiDTO.CarKpi`), `reservations: { totalCount, validatedCount, cancelledCount }` | Dashboard KPI Company (US-8.2). Le sous-objet `cars` a exactement la même forme que celui d'`AdminKpiDTO` : possibilité de factoriser une interface TS `CarKpi` commune aux deux DTO. |

### 5.3 Enums à répliquer strictement (`core/models/enums.ts`)

```ts
export type Role = 'ADMIN' | 'COMPANY' | 'CLIENT';
export type City = 'RABAT' | 'CASABLANCA' | 'MARRAKECH' | 'TANGIER'; // à tenir à jour selon l'enum backend
export type CarAvailability = 'AVAILABLE' | 'MAINTENANCE' | 'RESERVED';
export type CarColor = 'WHITE' | 'BLACK' | 'GREY' | 'RED' | 'BLUE' | 'SILVER' | 'GREEN' | 'YELLOW';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
export type Gearbox = 'MANUAL' | 'AUTOMATIC';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
```

> ⚠️ La liste `City` backend contient un commentaire `// ... autres villes` : vérifier l'enum Java à jour avant de figer la liste TypeScript, elle est susceptible de s'étendre.

---

## 6. Gestion des erreurs — mapping HTTP → UX

Basé sur `GlobalExceptionHandler` backend (source de vérité pour les codes retournés) :

| Code HTTP | Origine backend typique | Comportement Frontend attendu |
|---|---|---|
| 400 | `IllegalArgumentException`, `MethodArgumentNotValidException`, `BadRequestException` | Afficher le(s) message(s) de validation près du champ concerné si possible, sinon en toast global. |
| 401 | Token absent/invalide/expiré (`AuthEntryPointJwt`) | Déconnexion automatique + redirection `/login`. |
| 403 | Rôle insuffisant (`AuthAccessDeniedHandler`) OU compte désactivé (`DisabledException` au login) | Distinguer les deux cas via le `message` renvoyé — page "accès refusé" pour le premier, message explicite pour le second. |
| 404 | `ResourceNotFoundException` | Page ou état "ressource introuvable", jamais un écran blanc. |
| 409 | `DuplicateResourceException`, `IllegalStateException` (ex: Boost déjà actif, voiture indisponible, compte déjà activé/désactivé) | Toast d'erreur avec le message backend tel quel (déjà rédigé en français, utilisateur final). Sur les écrans US-7.2/US-7.4, désactiver le bouton plutôt que de compter uniquement sur ce toast (cf. §4.4). |
| 500 | Erreur interne générique | Message générique "Une erreur est survenue, veuillez réessayer" — ne jamais exposer la stack. |

---

## 7. Flux d'authentification (détail)

1. `POST /auth/login` → réception `JwtResponseDTO`.
2. Stockage du `token` (mécanisme à trancher au démarrage : `localStorage` vs solution en mémoire + refresh — à date, le backend n'expose pas de refresh token, JWT valide 30 jours).
3. Décodage du payload JWT côté client pour extraire `roles` (claim `roles`) et gérer l'expiration (`exp`), sans jamais faire confiance à `role` de la réponse de login seul pour les vérifications ultérieures — c'est le token qui fait foi pour le guard.
4. `jwt.interceptor.ts` ajoute `Authorization: Bearer <token>` sur toutes les requêtes sauf routes publiques listées en §3 des Instructions du projet.
5. Sur `401` reçu à n'importe quel moment (token expiré en cours de session, ou compte désactivé en cours de session — cf. `JwtAuthTokenFilter.isEnabled()`) → purge du token + redirection `/login`.

---

## 8. Cycle de vie réservation côté UI (rappel visuel)

Reprend exactement la machine à états de la Spécification Globale §5.3/§6.4, traduite en règles d'affichage de boutons :

```
PENDING   → [Client] peut Annuler   → CANCELLED
PENDING   → [Company] peut Confirmer → CONFIRMED (voiture passe RESERVED)
PENDING   → [Company] peut Annuler   → CANCELLED (voiture reste/repasse AVAILABLE)
CONFIRMED → [Company] peut Annuler   → CANCELLED (voiture repasse AVAILABLE)
CONFIRMED → (fin de période, hors périmètre déclenchement auto UI)  → COMPLETED
CANCELLED / COMPLETED → état terminal, aucune action possible
```

Aucun bouton d'action ne doit être affiché en dehors de ces transitions, même si l'utilisateur tente de forcer l'appel API (le backend rejettera de toute façon avec un 409, mais l'UI doit éviter de proposer une action vouée à échouer).

**Comptage OK/KO côté KPI (§4.4, US-8.1)** : `okCount` = `CONFIRMED` + `COMPLETED` regroupés côté backend. Ne pas tenter de les re-séparer côté Frontend à partir d'un autre endpoint : c'est la définition officielle retenue pour ce KPI.

---

## 9. Hors périmètre – Version 1 (rappel, incidence Frontend)

Reprend `5_Spécification_Globale_KriliCar.md` §8, avec incidence directe sur l'UI :

- **Pas de paiement en ligne** → aucun formulaire de paiement à prévoir, ni pour les réservations ni pour le Boost (le Boost reste une simple demande/validation manuelle, cf. §4.3/§4.4).
- **Pas d'application mobile** → aucune contrainte de responsive au-delà d'un Frontend web responsive classique (desktop + mobile web), pas de PWA ou de spécificités natives à prévoir en V1.
- **Pas de notifications email/mobile externes** → seule la notification interne "réservation PENDING" existe, matérialisée uniquement par le badge de compteur (§4.3), pas de centre de notifications complexe à construire.
- **Pas de système de notation/avis** → aucun composant d'étoiles, de commentaires ou d'avis à prévoir sur les fiches Company/voiture.

---

## 10. Roadmap Frontend — alignement avec les Sprints backend

| Sprint | Contenu Frontend | Dépendance backend |
|---|---|---|
| Sprint F1 | Authentification (login, register Client/Company), guards, intercepteurs | US-1.1 à US-1.4 ✅ disponibles |
| Sprint F1bis | Profils (Client, Company, Admin) + changement de mot de passe | US-1.5, US-1.6 ✅ disponibles |
| Sprint F2 | Gestion Marques/Modèles (Admin) | US-2.1, US-2.2 ✅ disponibles |
| Sprint F3 | Gestion voitures (Company) + recherche publique + mon parc | US-3.1 à US-3.4 ✅ disponibles |
| Sprint F4 | Wishlist (Client) | US-4.1 ✅ disponible |
| Sprint F5 | Réservations (Client + Company), cycle de vie complet | US-5.1 à US-5.7 ✅ disponibles |
| Sprint F6 | Boost (demande Company + validation Admin) | US-6.1, US-6.2 ✅ disponibles |
| Sprint F7 | Gestion des comptes par l'Admin (liste filtrable + détail + activation/désactivation, Company et Client) | US-7.1 à US-7.5 ✅ disponibles |
| Sprint F8 | KPI (dashboard Admin global + dashboard Company scopé) | US-8.1, US-8.2 ✅ disponibles |
| Sprint F9 | Polish transverse : gestion d'erreurs globale, accessibilité, tests | US-9.x (Swagger n'a pas d'incidence Frontend directe) |

Sprint F1 — Authentification & Guards (socle)
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-1.1	Login (connexion JWT)	                          POST /api/v1/auth/login
US-1.2	Inscription Client	                            POST /api/v1/auth/register/client
US-1.3	Inscription Company	                            POST /api/v1/auth/register/company
US-1.4	Guards (authGuard, roleGuard) + intercepteurs (jwt.interceptor, error.interceptor) + Store NgRx session utilisateu

Sprint fondateur : tout le reste de l'application dépend de ces 4 US (token, rôle, protection des routes).

Sprint F1bis — Profils utilisateurs
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-1.5	Profil Client (modif infos + mot de passe)	    PUT /api/v1/clients/profile, PUT /api/v1/clients/profile/change-password
US-1.6	Profil Admin (modif infos + mot de passe)	      PUT /api/v1/admins/profile, PUT /api/v1/admins/profile/change-password

Note : Profil Company (US-1.4 côté Backend) a déjà son écran couvert par la doc §4.3 — à confirmer si tu veux le traiter ici ou séparément.

Sprint F2 — Référentiel Marques / Modèles (Admin)
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-2.1	Gestion des marques (CRUD)	                    GET/POST/PUT/DELETE /api/v1/brands
US-2.2	Gestion des modèles (CRUD, select dépendant marque)	GET/POST/PUT/DELETE /api/v1/models, /api/v1/models/brand/{brandCode}

Sprint F3 — Voitures & Recherche
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-3.1	Gestion voitures Company (liste + CRUD, sans images)	POST/PUT/DELETE /api/v1/cars, GET /api/v1/cars?companyCode=...
US-3.2	Gestion des images voiture (upload/suppression, à la création et à l'update)	Inclus dans POST/PUT /api/v1/cars, imagesToDelete par code
US-3.3	Recherche simple/avancée publique (Client)	GET /api/v1/cars/search
US-3.4	Mon parc (recherche interne Company, scope auto)	GET /api/v1/cars/my-fleet

Sprint F4 — WishList
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-4.1	Ajout / consultation / suppression WishList (Client)	GET/POST/DELETE /api/v1/wishlist, /api/v1/wishlist/{carCode}

Sprint F5 — Réservations (cycle de vie complet)
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-5.1	Création réservation (Client)	                  POST /api/v1/reservations
US-5.2	Consultation réservations (Client + Company)	  GET /api/v1/reservations/my
US-5.3	Détail réservation par code	                    GET /api/v1/reservations/{code}
US-5.4	Confirmation/Annulation par Company (+ impact état voiture)	PATCH /api/v1/reservations/{code}/status
US-5.5	Fin de réservation (COMPLETED) — affichage cycle de vie	(lecture seule côté Front, piloté backend)
US-5.6	Annulation par Client (uniquement si PENDING)	  PATCH /api/v1/reservations/{code}/cancel
US-5.7	Badge notification Company (compteur PENDING)	  GET /api/v1/reservations/company/pending-count

Sprint F6 — Boost
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-6.1	Demande de Boost (Company)	                    POST /api/v1/companies/boost/request
US-6.2	Demandes en attente + validation/activation (Admin)	GET /api/v1/admins/companies/boost/pending, PATCH /api/v1/admins/companies/{code}/boost/activate

Sprint F7 — Gestion des comptes par l'Admin
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-7.1	Liste des sociétés filtrable (active, boosted)	GET /api/v1/admins/companies?active=&boosted=
US-7.2	Activation / désactivation Company	            PATCH /api/v1/admins/companies/{code}/activate, .../deactivate
US-7.3	Liste des clients filtrable (active)	          GET /api/v1/admins/clients?active=
US-7.4	Activation / désactivation Client	              PATCH /api/v1/admins/clients/{code}/activate, .../deactivate
US-7.5	Détail complet société + détail complet client (vues Admin)	GET /api/v1/admins/companies/{code}, GET /api/v1/admins/clients/{code}

Sprint F8 — KPI / Dashboards
US	    Écran / Fonctionnalité	                        Endpoint(s) backend
US-8.1	Dashboard KPI globaux (Admin)	                  GET /api/v1/admins/kpi/global
US-8.2	Dashboard KPI Company (scopé)	                  GET /api/v1/companies/kpi/my

Sprint F9 — Transverse / Qualité
US	    Écran / Fonctionnalité	                                                    Portée
US-9.1	Gestion d'erreurs globale (mapping HTTP → UX, cf. §6 de la Spec Frontend)	  Transverse, tous écrans
US-9.2	Accessibilité de base (labels, aria, focus management)	                    Transverse
US-9.3	Tests (Vitest) : guards, intercepteurs, logique cycle de vie réservation	  Transverse

**Constat** : l'intégralité des Sprints backend (F1 à F8) est désormais livrée et testée. Le développement Frontend peut suivre l'ordre ci-dessus sans blocage, ou être réordonné selon la priorité produit (ex: traiter F5/F6 avant F7/F8 si la mise en avant commerciale de la réservation prime sur le back-office Admin).

---

## 11. Méthode de travail obligatoire
 
Chaque conversation de ce projet correspond à une seule User Story Angular (une conversation = une US = un commit/push dédié). 
Si l'US n'est pas explicitement indiquée en début de conversation, la demander avant de commencer.

## 12. Conclusion

Ce document sert de pont entre la Spécification Globale (métier + backend) et le développement Frontend Angular. Il n'introduit **aucune nouvelle règle métier** — toute divergence apparente avec `5_Spécification_Globale_KriliCar.md` doit être considérée comme une erreur à corriger dans ce document, jamais l'inverse.

À mettre à jour à chaque évolution significative du backend impactant un DTO, un endpoint, ou une règle de sécurité (`@PreAuthorize`).

---

*Document généré en complément de : Cahier des charges, Description fonctionnelle, Scénario général de fonctionnement, Product Backlog, Spécification Globale KriliCar (backend), et analyse du dossier `Backend/` du dépôt `KriliCar-SpringBoot-Angular` à jour (Sprints 0 à 8 livrés).*

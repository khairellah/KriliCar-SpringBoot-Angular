export const environment = {
  production: false,
  apiUrl: 'http://localhost:8282/api/v1',
  // US-3.2 : base URL pour l'accès en LECTURE aux fichiers uploadés (images voiture,
  // photos de profil), utilisée pour prévisualiser les images existantes d'une voiture.
  // ⚠️ HYPOTHÈSE À CONFIRMER CÔTÉ BACKEND : suppose un mapping de ressources statiques
  // Spring (WebMvcConfigurer#addResourceHandler) exposant le dossier configuré par
  // `file.upload.dir` (Backend/src/main/resources/application.properties, valeur
  // actuelle : "./uploads") sous le chemin public "/uploads/**". Aucune configuration
  // de ce type n'est présente dans le code Backend fourni à ce jour — à vérifier/ajouter
  // côté Backend. Sans cela, les vignettes d'images existantes ne s'afficheront pas
  // (404), mais l'upload et la suppression (cœur de cette US) restent pleinement
  // fonctionnels indépendamment de ce point.
  filesBaseUrl: 'http://localhost:8282/uploads/'
};
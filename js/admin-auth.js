/* Identifiants de l'espace admin.
   Ce fichier n'est chargé QUE par admin.html (jamais par index.html) afin de
   ne pas exposer ces informations à chaque visiteur du site public.

   Limite connue : toute vérification faite uniquement en JavaScript côté
   navigateur reste lisible par quiconque ouvre ce fichier directement
   (ex. /js/admin-auth.js). Ce n'est PAS une authentification sécurisée,
   seulement un verrou d'accès basique. Une vraie protection nécessite un
   backend (Supabase Auth ou une fonction serveur) qui valide le mot de
   passe et signe une session — voir README pour les étapes de migration. */
window.ADMIN_CREDENTIALS = {
  email: 'ls_signature@zohomail.eu',
  password: 'MOOG2026!'
};

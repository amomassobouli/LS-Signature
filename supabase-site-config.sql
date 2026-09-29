-- Table de configuration de site pour Supabase / PostgreSQL
-- Cette table stocke un seul enregistrement JSON pour la configuration de l'application.

create table if not exists public.site_config (
  id bigint primary key,
  config jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Exemple d'insertion de la configuration par défaut.
-- Remplacez le contenu JSON par l'objet complet de configuration trouvé dans js/content.js.

insert into public.site_config (id, config) values (
  1,
  $json${
    "site": {
      "pageTitle": "L&S Signature – Nail Art & Manicure",
      "description": "L&S Signature – Institut de manucure et nail art à Paris.",
      "heroBadge": "✦ Nail Art & Soin des Mains ✦",
      "heroTitle": "L&S Signature",
      "heroSubtitle": "L'art de la manucure raffinée. Des mains soignées, une élégance intemporelle.",
      "ctaPrimary": "Réserver maintenant",
      "ctaSecondary": "Nos prestations",
      "whatsappNumber": "33600000000",
      "whatsappText": "Bonjour L&S Signature ! Je souhaite prendre un rendez-vous. Pouvez-vous me confirmer vos disponibilités ?",
      "address": "Paris, France",
      "phone": "+33 6 00 00 00 00",
      "email": "ls_signature@zohomail.eu",
      "footerLinks": [
        { "label": "Mentions légales", "url": "mentions-legales.html" },
        { "label": "Confidentialité", "url": "confidentialite.html" },
        { "label": "Contact", "url": "mailto:ls_signature@zohomail.eu" }
      ],
      "zohoLink": "https://lssignature.zohobookings.eu/#/263452000000039045"
    },
    "services": [
      { "icon": "💅", "name": "Manucure Classique", "desc": "Soin complet des ongles, limage, cuticules, massage des mains et vernis couleur au choix.", "price": "À partir de 35 €" },
      { "icon": "✨", "name": "Pose Semi-Permanent", "desc": "Vernis semi-permanent longue durée jusqu'à 3 semaines. Large palette de couleurs tendance.", "price": "À partir de 45 €" },
      { "icon": "💎", "name": "Nail Art Signature", "desc": "Créations personnalisées : dégradé, chrome, nail art floraux, French artistique et décors sur mesure.", "price": "À partir de 60 €" },
      { "icon": "🌸", "name": "Pose Gel & Extensions", "desc": "Allongement et renforcement des ongles en gel UV. Résultat naturel et durable.", "price": "À partir de 70 €" },
      { "icon": "🫶", "name": "Soin Luxe Mains", "desc": "Gommage, bain de paraffine, masque nourrissant et massage relaxant.", "price": "À partir de 55 €" },
      { "icon": "🎀", "name": "Forfait Mariée", "desc": "Manucure soins + pose gel ou semi + nail art personnalisé pour votre grand jour.", "price": "Sur devis" },
      { "icon": "🚗", "name": "Déplacement Domicile", "desc": "Je me déplace chez vous le week-end. Profitez de toutes nos prestations dans le confort de votre foyer.", "price": "+ 20 € de déplacement" }
    ],
    "bookingInfo": {
      "hours": [
        { "label": "Samedi", "value": "09h – 18h" },
        { "label": "Dimanche", "value": "10h – 16h" },
        { "label": "🚗 Déplacement domicile", "value": "Disponible" },
        { "label": "📍 Adresse", "value": "Paris, France" },
        { "label": "📞 Téléphone", "value": "+33 6 00 00 00 00" }
      ],
      "homeVisitLabel": "Domicile (+20€)",
      "showZoho": true
    },
    "gallery": [
      { "image": "https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Nail Art Floral" },
      { "image": "https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "French Dorée" },
      { "image": "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Dégradé Rose Gold" },
      { "image": "../images/Gemini_Generated_Image_f8f4adf8f4adf8f4.png", "caption": "Chrome Miroir" },
      { "image": "https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Nail Art Bijoux" },
      { "image": "https://images.pexels.com/photos/4046316/pexels-photo-4046316.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Art Minimaliste" },
      { "image": "https://images.pexels.com/photos/3997384/pexels-photo-3997384.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Stiletto Bordeaux" },
      { "image": "https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Nude & Strass" },
      { "image": "https://images.pexels.com/photos/3997382/pexels-photo-3997382.jpeg?auto=compress&cs=tinysrgb&w=800", "caption": "Aquarelle Pastel" }
    ],
    "testimonials": [
      { "stars": "★★★★★", "text": "\"Un travail absolument magnifique. Mon nail art floral a fait l'unanimité lors de mon mariage. Je ne vais plus nulle part ailleurs !\"", "author": "— Camille D." },
      { "stars": "★★★★★", "text": "\"L'accueil est chaleureux, le cadre est sublime et la qualité irréprochable. Mon semi-permanent tient depuis 3 semaines sans écailler !\"", "author": "— Inès M." },
      { "stars": "★★★★★", "text": "\"Le soin luxe mains est un vrai moment de détente. Je repars à chaque fois avec de belles mains et le sourire. Merci L&S !\"", "author": "— Léa T." }
    ],
    "calendar": {
      "bookedSlots": {}
    }
  }$json$::jsonb
) on conflict (id) do nothing;

-- ============================================================
-- SÉCURITÉ — accès en lecture seule pour la clé publique (anon)
-- ============================================================
-- La clé "anon" est par nature publique : elle est visible dans le
-- navigateur de chaque visiteur du site. Elle ne doit donc JAMAIS avoir
-- le droit d'écrire dans cette table, sinon n'importe qui peut réécrire
-- tout le contenu du site (défacement, faux numéro de téléphone, XSS
-- stocké, etc.) sans jamais se connecter à /admin.html.
--
-- ⚠️ Si votre projet a déjà les anciennes policies "anon_insert" /
-- "anon_update" (écriture publique ouverte), exécutez ce script dans
-- Supabase → SQL Editor pour les remplacer par un accès lecture seule.

alter table public.site_config enable row level security;

drop policy if exists anon_select on public.site_config;
drop policy if exists anon_insert on public.site_config;
drop policy if exists anon_update on public.site_config;

create policy anon_select on public.site_config
  for select using (true);

-- L'écriture est réservée aux utilisateurs authentifiés via Supabase Auth
-- (pas à la clé "anon"). js/admin.js se connecte avec
-- supabaseSignIn(email, password) avant d'appeler supabaseSaveSiteConfig() ;
-- le jeton obtenu est envoyé comme Authorization Bearer et validé ici.
drop policy if exists authenticated_write on public.site_config;
create policy authenticated_write on public.site_config
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ⚠️ Étape manuelle restante (ce script ne peut pas la faire) : créez le
-- compte admin dans Supabase → Authentication → Users → "Add user", avec
-- le même e-mail/mot de passe que ceux utilisés pour se connecter à
-- /admin.html. Tant que ce compte n'existe pas, la connexion admin
-- fonctionne encore (verrou local de secours dans js/admin-auth.js), mais
-- le bouton "Enregistrer sur Supabase" échouera avec une erreur 401/403 —
-- c'est le comportement attendu : l'écriture publique reste fermée
-- jusqu'à ce qu'un vrai compte authentifié existe.

-- ============================================================
-- STOCKAGE — upload de photos depuis l'admin (bucket "gallery")
-- ============================================================
-- Bucket public en lecture (les photos doivent être visibles par tous les
-- visiteurs du site), mais l'upload est réservé aux comptes authentifiés,
-- même logique que pour site_config ci-dessus.

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists gallery_public_read on storage.objects;
create policy gallery_public_read on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists gallery_authenticated_upload on storage.objects;
create policy gallery_authenticated_upload on storage.objects
  for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

drop policy if exists gallery_authenticated_delete on storage.objects;
create policy gallery_authenticated_delete on storage.objects
  for delete using (bucket_id = 'gallery' and auth.role() = 'authenticated');

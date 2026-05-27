# 💅 L&S Signature — Site Web

Site vitrine et système de réservation pour L&S Signature, institut de manucure et nail art.

## 🎨 Palette de couleurs
- **Rose poudré** : `#f2c4ce` / `#fce8ed` / `#e8a0b0`
- **Blanc cassé** : `#faf6f0` / `#f5efe6`
- **Doré** : `#c9a96e` / `#e8d5b0` / `#a07840`

## 📁 Structure du projet

```
ls-signature/
├── index.html          ← Page principale
├── css/
│   └── style.css       ← Tous les styles
├── js/
│   ├── calendar.js     ← Logique du calendrier de réservation
│   └── main.js         ← Navigation, animations, menu mobile
├── images/             ← Vos photos (à ajouter)
└── README.md
```

## 🚀 Démarrage rapide

### Option 1 — Ouvrir directement
Double-cliquez sur `index.html` pour ouvrir dans votre navigateur.

### Option 2 — VS Code avec Live Server
1. Installez l'extension **Live Server** dans VS Code
2. Clic droit sur `index.html` → **Open with Live Server**
3. Le site s'ouvre sur `http://localhost:5500`

## 🖼️ Ajouter vos photos

Dans `css/style.css`, remplacez les dégradés des galeries par vos photos :

```css
/* Avant (dégradé par défaut) */
.gi-1 { background: linear-gradient(135deg, #f2c4ce, #fce8ed); }

/* Après (avec votre photo) */
.gi-1 {
  background-image: url('../images/nail1.jpg');
  background-size: cover;
  background-position: center;
}
```

## 📅 Configurer les créneaux réservés

Dans `js/calendar.js`, modifiez l'objet `BOOKED` :

```js
const BOOKED = {
  '2025-6-5': ['10:00', '14:00'],  // 5 juin 2025 : ces créneaux sont pris
  '2025-6-12': ['15:00'],
};
```

> **Pour une vraie gestion des réservations**, connectez un service comme :
> - [Formspree](https://formspree.io) (emails de confirmation)
> - [EmailJS](https://www.emailjs.com) (envoi d'email côté client)
> - [Calendly](https://calendly.com) (calendrier professionnel)

## 📧 Activer l'envoi d'emails (Formspree)

1. Créez un compte sur [formspree.io](https://formspree.io)
2. Créez un nouveau formulaire, copiez votre endpoint
3. Dans `js/calendar.js`, remplacez le commentaire par :

```js
async function sendBooking(data) {
  await fetch('https://formspree.io/f/VOTRE_ID', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
```

## 🌐 Déployer sur GitHub Pages

1. Créez un repo GitHub (ex: `ls-signature`)
2. Poussez les fichiers :
```bash
git init
git add .
git commit -m "Initial commit — L&S Signature"
git remote add origin https://github.com/VOTRE_USER/ls-signature.git
git push -u origin main
```
3. Dans Settings → Pages → Source : **main branch**
4. Votre site sera disponible sur : `https://VOTRE_USER.github.io/ls-signature`

## ✏️ Personnalisation rapide

| Ce que vous voulez changer | Où modifier |
|---|---|
| Nom, adresse, téléphone | `index.html` section `booking-info` |
| Horaires d'ouverture | `index.html` liste `hours-list` |
| Tarifs des prestations | `index.html` section `services-grid` |
| Couleurs | `css/style.css` variables `:root` |
| Polices | Lien Google Fonts dans `<head>` |
| Photos galerie | `css/style.css` classes `.gi-1` à `.gi-6` |

## 📱 Responsive
Le site est optimisé pour :
- 📱 Mobile (< 600px)
- 📟 Tablette (600px – 900px)
- 🖥️ Desktop (> 900px)

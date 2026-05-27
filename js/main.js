/* ============================================
   L&S Signature — Scripts principaux
   ============================================ */

/* ---- Navbar : ombre au scroll ---- */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

/* ---- Menu burger (mobile) ---- */
document.getElementById('burger').addEventListener('click', () => {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
});

function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

/* ---- Scroll doux vers une section ---- */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

/* ---- Fermer la modal de confirmation ---- */
function closeModal() {
  document.getElementById('modal').classList.remove('active');
  /* Réinitialiser le formulaire */
  document.getElementById('fname').value   = '';
  document.getElementById('lname').value   = '';
  document.getElementById('email').value   = '';
  document.getElementById('service').value = '';
}

/* Fermer la modal en cliquant sur l'overlay */
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* ---- Animation d'entrée au scroll (Intersection Observer) ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity  = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

/* Animer les cartes de service */
document.querySelectorAll('.service-card, .testi-card, .gallery-item').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

/* Décalage progressif pour les cartes */
document.querySelectorAll('.service-card').forEach((card, i) => {
  card.style.transitionDelay = (i * 0.08) + 's';
});

document.querySelectorAll('.testi-card').forEach((card, i) => {
  card.style.transitionDelay = (i * 0.1) + 's';
});

document.querySelectorAll('.gallery-item').forEach((item, i) => {
  item.style.transitionDelay = (i * 0.06) + 's';
});

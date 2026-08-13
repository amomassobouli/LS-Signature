const STORAGE_KEY = 'lsSignatureAdminData';

/* Schémas d'URL autorisés pour tout champ affiché comme lien/image
   provenant du contenu (admin ou Supabase) — bloque javascript:, data:, etc.
   Les caractères de contrôle sont retirés avant l'analyse : certains
   navigateurs les ignorent lors du parsing du schéma d'une URL, ce qui
   permettrait de contourner un filtre naïf (ex. "java\tscript:..."). */
function isSafeUrl(url) {
  if (typeof url !== 'string') return false;
  const value = url.trim().replace(/[\x00-\x1f\x7f]/g, '');
  if (value === '') return true;
  if (value.startsWith('#') || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return true;
  /* chemin relatif simple (ex. "mentions-legales.html") : sûr tant qu'il ne
     contient pas de ":" avant un "/", ce qui indiquerait un schéma d'URI */
  if (!value.includes(':')) return true;
  return false;
}

function normalizeAppData(data) {
  const defaults = window.APP_DATA;
  if (!data || typeof data !== 'object') return defaults;

  return {
    site: { ...defaults.site, ...(data.site || {}) },
    services: Array.isArray(data.services) && data.services.length ? data.services : defaults.services,
    gallery: Array.isArray(data.gallery) && data.gallery.length ? data.gallery : defaults.gallery,
    testimonials: Array.isArray(data.testimonials) && data.testimonials.length ? data.testimonials : defaults.testimonials,
    bookingInfo: { ...defaults.bookingInfo, ...(data.bookingInfo || {}) },
    calendar: { ...defaults.calendar, ...(data.calendar || {}) }
  };
}

async function loadAppData() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (typeof hasSupabaseConfig === 'function' && hasSupabaseConfig()) {
    try {
      const supaData = await supabaseFetchSiteConfig();
      if (supaData && typeof supaData === 'object') {
        return normalizeAppData(supaData);
      }
    } catch (err) {
      console.warn('Erreur lors du chargement Supabase :', err);
    }
  }

  if (stored) {
    try {
      return normalizeAppData(JSON.parse(stored));
    } catch (err) {
      console.warn('Impossible de charger la configuration admin depuis localStorage.', err);
    }
  }

  return normalizeAppData(window.APP_DATA);
}

function buildWhatsappUrl(number, text) {
  const message = encodeURIComponent(text);
  return `https://wa.me/${number}?text=${message}`;
}

function createServiceCard(service) {
  const card = document.createElement('div');
  card.className = 'service-card';

  const icon = document.createElement('div');
  icon.className = 'service-icon';
  icon.textContent = service.icon;

  const name = document.createElement('div');
  name.className = 'service-name';
  name.textContent = service.name;

  const desc = document.createElement('p');
  desc.className = 'service-desc';
  desc.textContent = service.desc;

  const price = document.createElement('div');
  price.className = 'service-price';
  price.textContent = service.price;

  card.append(icon, name, desc, price);
  return card;
}

function createGalleryItem(item) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-item';

  const bg = document.createElement('div');
  bg.className = 'gallery-item-bg';
  if (isSafeUrl(item.image)) {
    bg.style.backgroundImage = `url("${item.image.replace(/"/g, '%22')}")`;
  }
  galleryItem.appendChild(bg);

  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  const overlayText = document.createElement('span');
  overlayText.textContent = item.caption;
  overlay.appendChild(overlayText);
  galleryItem.appendChild(overlay);

  galleryItem.setAttribute('role', 'button');
  galleryItem.setAttribute('tabindex', '0');
  galleryItem.setAttribute('aria-label', `Agrandir la photo : ${item.caption}`);

  const open = () => openLightbox(item.image, item.caption);
  galleryItem.addEventListener('click', open);
  galleryItem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return galleryItem;
}

function createTestimonial(testimonial) {
  const card = document.createElement('div');
  card.className = 'testi-card';

  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.textContent = testimonial.stars;

  const text = document.createElement('p');
  text.className = 'testi-text';
  text.textContent = testimonial.text;

  const author = document.createElement('div');
  author.className = 'testi-author';
  author.textContent = testimonial.author;

  card.append(stars, text, author);
  return card;
}

function populateFooterLinks(links) {
  const list = document.querySelector('.footer-links');
  if (!list) return;
  list.innerHTML = '';
  links.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = isSafeUrl(link.url) ? link.url : '#';
    a.textContent = link.label;
    li.appendChild(a);
    list.appendChild(li);
  });
}

function populateServices(services) {
  const container = document.querySelector('.services-grid');
  if (!container) return;
  container.innerHTML = '';
  services.forEach(service => container.appendChild(createServiceCard(service)));
}

function populateGallery(gallery) {
  const container = document.querySelector('.gallery-grid');
  if (!container) return;
  container.innerHTML = '';
  gallery.forEach((item, index) => container.appendChild(createGalleryItem(item, index)));
}

function populateTestimonials(testimonials) {
  const container = document.querySelector('.testi-grid');
  if (!container) return;
  container.innerHTML = '';
  testimonials.forEach(item => container.appendChild(createTestimonial(item)));
}

function populateBookingInfo(bookingInfo, site) {
  const hoursList = document.getElementById('bookingHours');
  if (hoursList) {
    hoursList.innerHTML = '';
    bookingInfo.hours.forEach(item => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = item.label;
      const value = document.createElement('span');
      value.textContent = item.value;
      li.append(label, value);
      hoursList.appendChild(li);
    });
  }

  const whatsappButton = document.getElementById('whatsappButton');
  if (whatsappButton) {
    whatsappButton.href = buildWhatsappUrl(site.whatsappNumber, site.whatsappText);
  }

  const zohoButton = document.getElementById('zohoBookingLink');
  if (zohoButton && isSafeUrl(site.zohoLink)) {
    zohoButton.href = site.zohoLink;
  }

  if (site.address) {
    const addressEl = document.getElementById('bookingAddress');
    if (addressEl) addressEl.textContent = site.address;
  }
  if (site.phone) {
    const phoneEl = document.getElementById('bookingPhone');
    if (phoneEl) phoneEl.textContent = site.phone;
  }
}

function populateBookingText() {
  const bookingTitle = document.getElementById('bookingTitle');
  const bookingText = document.getElementById('bookingText');
  if (bookingTitle) bookingTitle.innerHTML = 'Réservez votre <em>moment</em>';
  if (bookingText) bookingText.textContent = 'Choisissez votre créneau directement en ligne, puis confirmez via WhatsApp — nous revenons vers vous rapidement.';
}

function populateHero(site) {
  const titleEl = document.getElementById('heroTitle');
  const subtitleEl = document.getElementById('heroSubtitle');
  const badgeEl = document.getElementById('heroBadge');
  const primaryBtn = document.getElementById('heroPrimaryBtn');
  const secondaryBtn = document.getElementById('heroSecondaryBtn');

  if (titleEl) titleEl.textContent = site.heroTitle;
  if (subtitleEl) subtitleEl.textContent = site.heroSubtitle;
  if (badgeEl) badgeEl.textContent = site.heroBadge;
  if (primaryBtn) primaryBtn.textContent = site.ctaPrimary;
  if (secondaryBtn) secondaryBtn.textContent = site.ctaSecondary;
}

function populateHead(site) {
  document.title = site.pageTitle;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.content = site.description;
  }
}

function populateFooter(site) {
  const emailLink = document.querySelector('.footer-email a');
  if (emailLink) {
    emailLink.href = `mailto:${site.email}`;
    emailLink.textContent = site.email;
  }
  populateFooterLinks(site.footerLinks);
}

function populateServiceSelect(services) {
  const select = document.getElementById('service');
  if (!select) return;
  select.innerHTML = '<option value="">Sélectionnez une prestation</option>';
  services.forEach(service => {
    const option = document.createElement('option');
    option.value = service.name;
    option.textContent = service.name;
    select.appendChild(option);
  });
}

async function renderSite() {
  const data = await loadAppData();
  window.LSSiteData = data;

  populateHead(data.site);
  populateHero(data.site);
  populateServices(data.services);
  populateGallery(data.gallery);
  populateTestimonials(data.testimonials);
  populateFooter(data.site);
  populateBookingInfo(data.bookingInfo, data.site);
  populateServiceSelect(data.services);
  populateBookingText();
}

window.addEventListener('DOMContentLoaded', renderSite);

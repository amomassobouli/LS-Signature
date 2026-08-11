const STORAGE_KEY = 'lsSignatureAdminData';

async function loadAppData() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (typeof hasSupabaseConfig === 'function' && hasSupabaseConfig()) {
    try {
      const supaData = await supabaseFetchSiteConfig();
      if (supaData && typeof supaData === 'object') {
        return supaData;
      }
    } catch (err) {
      console.warn('Erreur lors du chargement Supabase :', err);
    }
  }

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (err) {
      console.warn('Impossible de charger la configuration admin depuis localStorage.', err);
    }
  }

  return window.APP_DATA;
}

function buildWhatsappUrl(number, text) {
  const message = encodeURIComponent(text);
  return `https://wa.me/${number}?text=${message}`;
}

function createServiceCard(service) {
  const card = document.createElement('div');
  card.className = 'service-card';
  card.innerHTML = `
    <div class="service-icon">${service.icon}</div>
    <div class="service-name">${service.name}</div>
    <p class="service-desc">${service.desc}</p>
    <div class="service-price">${service.price}</div>
  `;
  return card;
}

function createGalleryItem(item, index) {
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-item';
  galleryItem.style.backgroundImage = `url('${item.image}')`;
  galleryItem.innerHTML = `
    <div class="gallery-overlay"><span>${item.caption}</span></div>
  `;
  galleryItem.addEventListener('click', () => openLightbox(item.image, item.caption));
  return galleryItem;
}

function createTestimonial(testimonial) {
  const card = document.createElement('div');
  card.className = 'testi-card';
  card.innerHTML = `
    <div class="stars">${testimonial.stars}</div>
    <p class="testi-text">${testimonial.text}</p>
    <div class="testi-author">${testimonial.author}</div>
  `;
  return card;
}

function populateFooterLinks(links) {
  const list = document.querySelector('.footer-links');
  if (!list) return;
  list.innerHTML = '';
  links.forEach(link => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${link.url}">${link.label}</a>`;
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
      li.innerHTML = `<span>${item.label}</span><span>${item.value}</span>`;
      hoursList.appendChild(li);
    });
  }

  const whatsappButton = document.getElementById('whatsappButton');
  if (whatsappButton) {
    whatsappButton.href = buildWhatsappUrl(site.whatsappNumber, site.whatsappText);
  }

  const zohoButton = document.getElementById('zohoBookingLink');
  if (zohoButton) {
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
  if (bookingText) bookingText.textContent = 'Choisissez votre créneau directement en ligne. Confirmation par e-mail dans les plus brefs délais.';
}

function populateHero(site) {
  const titleEl = document.getElementById('heroTitle');
  const subtitleEl = document.getElementById('heroSubtitle');
  const badgeEl = document.getElementById('heroBadge');
  const primaryBtn = document.getElementById('heroPrimaryBtn');
  const secondaryBtn = document.getElementById('heroSecondaryBtn');

  if (titleEl) titleEl.innerHTML = site.heroTitle;
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

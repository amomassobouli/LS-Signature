/* ============================================
   L&S Signature — Calendrier de réservation
   ============================================ */

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const SAT_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
];

const SUN_SLOTS = [
  '10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30'
];

/* Créneaux déjà réservés — format clé : "YYYY-M-D"
   À remplacer par une vraie API/base de données */
const BOOKED = {
  '2025-6-5':  ['10:00','11:00','14:00'],
  '2025-6-12': ['14:30','15:00','16:00','17:00'],
  '2025-6-19': ['10:30','11:30'],
  '2025-6-26': ['10:00','14:00','15:30'],
};

let currentDate  = new Date();
let selectedDay  = null;
let selectedSlot = null;

/* ---- Rendu du calendrier ---- */
function renderCalendar() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('calTitle').textContent = MONTHS[month] + ' ' + year;

  const grid  = document.getElementById('calGrid');
  const today = new Date();
  grid.innerHTML = '';

  /* Décalage : semaine commence lundi */
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  /* Cases vides avant le 1er */
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  /* Jours du mois */
  for (let d = 1; d <= daysInMonth; d++) {
    const el  = document.createElement('div');
    const dt       = new Date(year, month, d);
    const dayOfWeek = dt.getDay(); // 0=Dim, 6=Sam
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPast    = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (isPast || !isWeekend) {
      el.className = 'cal-day past';
    } else {
      el.className = 'cal-day available';

      /* Aujourd'hui */
      if (
        today.getFullYear() === year &&
        today.getMonth()    === month &&
        today.getDate()     === d
      ) { el.classList.add('today'); }

      /* Jour sélectionné */
      if (selectedDay === d && currentDate.getMonth() === month) {
        el.classList.add('selected');
      }

      el.addEventListener('click', () => selectDay(d));
    }

    el.textContent = d;
    grid.appendChild(el);
  }
}

/* ---- Sélection d'un jour ---- */
function selectDay(d) {
  selectedDay  = d;
  selectedSlot = null;
  renderCalendar();

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const key      = year + '-' + (month + 1) + '-' + d;
  const booked   = BOOKED[key] || [];
  const dayOfWeek = new Date(year, month, d).getDay();
  const slots    = dayOfWeek === 6 ? SAT_SLOTS : SUN_SLOTS;

  /* Label */
  document.getElementById('slotDateLabel').textContent =
    'Créneaux disponibles — ' + d + ' ' + MONTHS[month];

  /* Créneaux */
  const slotsGrid = document.getElementById('slotsGrid');
  slotsGrid.innerHTML = '';

  slots.forEach(time => {
    const slot = document.createElement('div');
    slot.textContent = time;

    if (booked.includes(time)) {
      slot.className = 'slot booked';
      slot.title     = 'Créneau réservé';
    } else {
      slot.className = 'slot';
      slot.addEventListener('click', () => selectSlot(time, slot));
    }

    slotsGrid.appendChild(slot);
  });

  document.getElementById('timeSlotsSection').style.display = 'block';
  document.getElementById('bookingForm').style.display      = 'none';

  /* Scroll vers le widget sur mobile */
  if (window.innerWidth < 700) {
    document.getElementById('timeSlotsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* ---- Sélection d'un créneau ---- */
function selectSlot(time, el) {
  selectedSlot = time;
  document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected-slot'));
  el.classList.add('selected-slot');
  document.getElementById('bookingForm').style.display = 'block';
}

/* ---- Navigation mois ---- */
function resetSelection() {
  selectedDay  = null;
  selectedSlot = null;
  document.getElementById('timeSlotsSection').style.display = 'none';
  document.getElementById('bookingForm').style.display      = 'none';
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  resetSelection();
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  resetSelection();
  renderCalendar();
});

/* ---- Validation & confirmation ---- */
document.getElementById('bookBtn').addEventListener('click', () => {
  const fname   = document.getElementById('fname').value.trim();
  const lname   = document.getElementById('lname').value.trim();
  const email   = document.getElementById('email').value.trim();
  const service = document.getElementById('service').value;

  if (!fname || !lname || !email || !service) {
    alert('Merci de remplir tous les champs avant de confirmer.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Veuillez entrer une adresse e-mail valide.');
    return;
  }

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const homeVisit = document.getElementById('homeVisit').checked;
  const lieu      = homeVisit ? 'Domicile (+20€)' : 'Salon';

  const message = encodeURIComponent(
    'Bonjour L&S Signature !\n\n' +
    'Je souhaite prendre rendez-vous :\n' +
    '👤 ' + fname + ' ' + lname + '\n' +
    '📅 ' + selectedDay + ' ' + MONTHS[month] + ' ' + year + '\n' +
    '🕐 ' + selectedSlot + '\n' +
    '💅 ' + service + '\n' +
    '📍 Lieu : ' + lieu + '\n' +
    '📧 ' + email + '\n\n' +
    'Merci !'
  );

  window.open('https://wa.me/33600000000?text=' + message, '_blank');

  document.getElementById('modal').classList.add('active');
  document.getElementById('modalDetail').innerHTML =
    '<strong>👤 Client·e :</strong> ' + fname + ' ' + lname + '<br>' +
    '<strong>📅 Date :</strong> ' + selectedDay + ' ' + MONTHS[month] + ' ' + year + '<br>' +
    '<strong>🕐 Heure :</strong> ' + selectedSlot + '<br>' +
    '<strong>💅 Prestation :</strong> ' + service + '<br>' +
    '<strong>📍 Lieu :</strong> ' + lieu + '<br>' +
    '<strong>📧 E-mail :</strong> ' + email;
});

/* ---- Init ---- */
renderCalendar();

let adminEmailInput;
let adminPasswordInput;
let adminLoginBtn;
let adminLoginBox;
let adminPanel;
let adminJson;
let adminMessage;
let adminStatus;
let saveConfigBtn;
let saveSupabaseBtn;
let loadSupabaseBtn;
let resetConfigBtn;
let restoreDefaultsBtn;
let logoutBtn;
let supabaseUrlInput;
let supabaseKeyInput;
let supabaseStatus;
let galleryFileInput;
let galleryCaptionInput;
let uploadImageBtn;
let uploadStatus;

const STORAGE_KEY = 'lsSignatureAdminData';
const AUTH_KEY = 'lsSignatureAdminAuth';
/* SUPABASE_CONFIG_STORAGE_KEY est déjà déclarée dans supabase.js (chargé avant ce fichier) */

function initAdminElements() {
  adminEmailInput = document.getElementById('adminEmail');
  adminPasswordInput = document.getElementById('adminPassword');
  adminLoginBtn = document.getElementById('adminLoginBtn');
  adminLoginBox = document.getElementById('adminLogin');
  adminPanel = document.getElementById('adminPanel');
  adminJson = document.getElementById('adminJson');
  adminMessage = document.getElementById('adminMessage');
  adminStatus = document.getElementById('adminStatus');
  saveConfigBtn = document.getElementById('saveConfigBtn');
  saveSupabaseBtn = document.getElementById('saveSupabaseBtn');
  loadSupabaseBtn = document.getElementById('loadSupabaseBtn');
  resetConfigBtn = document.getElementById('resetConfigBtn');
  logoutBtn = document.getElementById('logoutBtn');
  restoreDefaultsBtn = document.getElementById('restoreDefaultsBtn');
  supabaseUrlInput = document.getElementById('supabaseUrl');
  supabaseKeyInput = document.getElementById('supabaseKey');
  supabaseStatus = document.getElementById('supabaseStatus');
  galleryFileInput = document.getElementById('galleryFile');
  galleryCaptionInput = document.getElementById('galleryCaption');
  uploadImageBtn = document.getElementById('uploadImageBtn');
  uploadStatus = document.getElementById('uploadStatus');
}

function getSavedData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (err) {
    return null;
  }
}

/* getSupabaseConfig() est défini dans supabase.js (chargé avant ce fichier) */

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}

function saveSupabaseConfigLocal(config) {
  localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function setStatus(message, type = 'info') {
  adminStatus.textContent = message;
  adminStatus.style.color = type === 'error' ? '#bf0a30' : '#276749';
}

function setLoginMessage(message, type = 'error') {
  adminMessage.textContent = message;
  adminMessage.style.color = type === 'error' ? '#bf0a30' : '#276749';
}

function getCurrentData() {
  return getSavedData() || window.APP_DATA;
}

function renderEditor() {
  const data = getCurrentData();
  adminJson.value = JSON.stringify(data, null, 2);
}

function renderSupabaseConfig() {
  const config = getSupabaseConfig();
  supabaseUrlInput.value = config.url;
  supabaseKeyInput.value = config.key;
}

function setSupabaseStatus(message, type = 'info') {
  supabaseStatus.textContent = message;
  supabaseStatus.style.color = type === 'error' ? '#bf0a30' : '#276749';
}

function unlockAdminPanel(message) {
  localStorage.setItem(AUTH_KEY, 'true');
  adminLoginBox.style.display = 'none';
  adminPanel.style.display = 'block';
  renderEditor();
  renderSupabaseConfig();
  setLoginMessage(message, 'success');
}

async function loginAdmin() {
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value;

  /* Priorité à une vraie session Supabase Auth : c'est elle qui autorisera
     l'écriture une fois les policies RLS restreintes à "authenticated". */
  if (hasSupabaseConfig()) {
    try {
      await supabaseSignIn(email, password);
      unlockAdminPanel('Connecté avec succès (session Supabase active — la sauvegarde en ligne fonctionnera).');
      return;
    } catch (err) {
      /* pas de compte Supabase Auth pour ces identifiants : on retombe sur
         le verrou local ci-dessous (accès à l'éditeur, sans écriture distante) */
    }
  }

  const credentials = window.ADMIN_CREDENTIALS || {};
  if (email === credentials.email && password === credentials.password) {
    unlockAdminPanel('Connecté avec succès (mode local — créez un compte Supabase Auth avec ces identifiants pour activer la sauvegarde en ligne).');
  } else {
    setLoginMessage('Identifiants incorrects.', 'error');
  }
}

function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
  supabaseSignOut();
  adminLoginBox.style.display = 'block';
  adminPanel.style.display = 'none';
  adminEmailInput.value = '';
  adminPasswordInput.value = '';
  setLoginMessage('Vous êtes déconnecté.', 'success');
}

function saveConfig() {
  try {
    const parsed = JSON.parse(adminJson.value);
    if (!parsed || typeof parsed !== 'object') throw new Error('JSON invalide.');
    saveData(parsed);
    setStatus('Configuration enregistrée dans le stockage local. Rechargez index.html pour appliquer.', 'success');
  } catch (err) {
    setStatus('Erreur JSON : ' + err.message, 'error');
  }
}

async function saveConfigSupabase() {
  try {
    const config = getSupabaseConfig();
    if (!config.url || !config.key) {
      setSupabaseStatus('Veuillez configurer l’URL et la clé Supabase.', 'error');
      return;
    }

    const parsed = JSON.parse(adminJson.value);
    if (!parsed || typeof parsed !== 'object') throw new Error('JSON invalide.');

    saveSupabaseConfigLocal(config);
    await supabaseSaveSiteConfig(parsed);
    setSupabaseStatus('Configuration enregistrée sur Supabase.', 'success');
  } catch (err) {
    setSupabaseStatus('Erreur Supabase : ' + err.message, 'error');
  }
}

async function loadConfigSupabase() {
  try {
    const config = {
      url: supabaseUrlInput.value.trim(),
      key: supabaseKeyInput.value.trim()
    };
    if (!config.url || !config.key) {
      setSupabaseStatus('Veuillez saisir l’URL et la clé Supabase.', 'error');
      return;
    }
    saveSupabaseConfigLocal(config);

    const data = await supabaseFetchSiteConfig();
    if (!data) {
      setSupabaseStatus('Aucune configuration trouvée sur Supabase.', 'error');
      return;
    }

    adminJson.value = JSON.stringify(data, null, 2);
    setSupabaseStatus('Configuration chargée depuis Supabase.', 'success');
  } catch (err) {
    setSupabaseStatus('Erreur Supabase : ' + err.message, 'error');
  }
}

function setUploadStatus(message, type = 'info') {
  uploadStatus.textContent = message;
  uploadStatus.style.color = type === 'error' ? '#bf0a30' : '#276749';
}

async function uploadGalleryImage() {
  const file = galleryFileInput.files[0];
  if (!file) {
    setUploadStatus('Choisissez une image.', 'error');
    return;
  }

  const caption = galleryCaptionInput.value.trim() || file.name.replace(/\.[^.]+$/, '');

  uploadImageBtn.disabled = true;
  setUploadStatus('Envoi en cours…');

  try {
    const imageUrl = await supabaseUploadImage(file);

    const parsed = JSON.parse(adminJson.value);
    if (!parsed || typeof parsed !== 'object') throw new Error('JSON invalide.');
    parsed.gallery = Array.isArray(parsed.gallery) ? parsed.gallery : [];
    parsed.gallery.push({ image: imageUrl, caption });
    adminJson.value = JSON.stringify(parsed, null, 2);

    galleryFileInput.value = '';
    galleryCaptionInput.value = '';
    setUploadStatus('Photo ajoutée à la galerie ci-dessous — pensez à "Enregistrer" pour publier.', 'success');
  } catch (err) {
    setUploadStatus('Erreur : ' + err.message, 'error');
  } finally {
    uploadImageBtn.disabled = false;
  }
}

function resetConfig() {
  localStorage.removeItem(STORAGE_KEY);
  renderEditor();
  setStatus('Configuration réinitialisée à la version par défaut.', 'success');
}

function restoreDefaults() {
  adminJson.value = JSON.stringify(window.APP_DATA, null, 2);
  setStatus('Contenu par défaut restauré. Enregistrez pour appliquer.', 'success');
}

window.addEventListener('DOMContentLoaded', () => {
  initAdminElements();

  adminLoginBtn.addEventListener('click', loginAdmin);
  saveConfigBtn.addEventListener('click', saveConfig);
  saveSupabaseBtn.addEventListener('click', saveConfigSupabase);
  loadSupabaseBtn.addEventListener('click', loadConfigSupabase);
  uploadImageBtn.addEventListener('click', uploadGalleryImage);
  resetConfigBtn.addEventListener('click', resetConfig);
  restoreDefaultsBtn.addEventListener('click', restoreDefaults);
  logoutBtn.addEventListener('click', logoutAdmin);

  const auth = localStorage.getItem(AUTH_KEY) === 'true';
  if (auth) {
    adminLoginBox.style.display = 'none';
    adminPanel.style.display = 'block';
    renderEditor();
    renderSupabaseConfig();
    setLoginMessage('Connexion active.', 'success');
  }
});

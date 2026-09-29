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
let galleryManager;

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
  galleryManager = document.getElementById('galleryManager');
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

function renderEditor(data = getCurrentData()) {
  adminJson.value = JSON.stringify(data, null, 2);
  renderGalleryManager();
}

function renderGalleryManager() {
  if (!galleryManager) return;
  galleryManager.replaceChildren();

  let gallery;
  try {
    const data = JSON.parse(adminJson.value);
    gallery = Array.isArray(data.gallery) ? data.gallery : [];
  } catch (err) {
    galleryManager.textContent = 'Corrigez le JSON pour gérer les photos.';
    return;
  }

  if (gallery.length === 0) {
    galleryManager.textContent = 'Aucune photo dans la galerie.';
    return;
  }

  gallery.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'gallery-manager-item';
    const caption = document.createElement('span');
    caption.textContent = item.caption || `Photo ${index + 1}`;
    const removeButton = document.createElement('button');
    removeButton.className = 'btn-outline';
    removeButton.type = 'button';
    removeButton.dataset.galleryIndex = String(index);
    removeButton.textContent = 'Supprimer';
    row.append(caption, removeButton);
    galleryManager.appendChild(row);
  });
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

function updateRemoteActionState() {
  const hasSession = hasSupabaseSession();
  saveSupabaseBtn.disabled = !hasSession;
  uploadImageBtn.disabled = !hasSession;

  if (!hasSession && hasSupabaseConfig()) {
    setSupabaseStatus('Connexion Supabase requise : créez un compte Auth Supabase pour activer l’upload et la sauvegarde en ligne.', 'error');
  }
}

function unlockAdminPanel(message) {
  localStorage.setItem(AUTH_KEY, 'true');
  adminLoginBox.style.display = 'none';
  adminPanel.style.display = 'block';
  renderEditor();
  renderSupabaseConfig();
  updateRemoteActionState();
  setLoginMessage(message, 'success');
  loadRemoteConfigIntoEditor();
}

async function loadRemoteConfigIntoEditor() {
  if (!hasSupabaseConfig()) return;
  try {
    const data = await supabaseFetchSiteConfig();
    if (data && typeof data === 'object') renderEditor(data);
  } catch (err) {
    setSupabaseStatus('Impossible de charger la configuration Supabase : ' + err.message, 'error');
  }
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
  saveSupabaseBtn.disabled = true;
  uploadImageBtn.disabled = true;
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

    if (!hasSupabaseSession()) {
      setSupabaseStatus('Connexion Supabase requise pour enregistrer en ligne. Créez un compte Auth Supabase avec l’email admin puis reconnectez-vous.', 'error');
      return;
    }

    const parsed = JSON.parse(adminJson.value);
    if (!parsed || typeof parsed !== 'object') throw new Error('JSON invalide.');

    saveSupabaseConfigLocal(config);
    await supabaseSaveSiteConfig(parsed);
    saveData(parsed);
    setSupabaseStatus('Configuration enregistrée sur Supabase.', 'success');
    return true;
  } catch (err) {
    setSupabaseStatus('Erreur Supabase : ' + err.message, 'error');
    return false;
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

    renderEditor(data);
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

  if (!hasSupabaseSession()) {
    setUploadStatus('Connexion Supabase requise pour uploader une image. Créez un compte Auth Supabase avec le même email admin, puis reconnectez-vous.', 'error');
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
    renderEditor(parsed);

    galleryFileInput.value = '';
    galleryCaptionInput.value = '';
    if (await saveConfigSupabase()) {
      setUploadStatus('Photo envoyée et galerie enregistrée sur Supabase.', 'success');
    } else {
      setUploadStatus('Image envoyée, mais la galerie n’a pas été enregistrée. Corrigez l’erreur Supabase puis cliquez sur « Enregistrer sur Supabase ».', 'error');
    }
  } catch (err) {
    setUploadStatus('Erreur : ' + err.message, 'error');
  } finally {
    uploadImageBtn.disabled = false;
  }
}

async function removeGalleryImage(index) {
  let parsed;
  try {
    parsed = JSON.parse(adminJson.value);
  } catch (err) {
    setUploadStatus('JSON invalide : impossible de modifier la galerie.', 'error');
    return;
  }

  if (!Array.isArray(parsed.gallery) || !parsed.gallery[index]) return;
  const [removed] = parsed.gallery.splice(index, 1);
  renderEditor(parsed);

  if (hasSupabaseSession()) {
    if (!(await saveConfigSupabase())) {
      setUploadStatus('La photo est retirée du brouillon, mais la galerie n’a pas été enregistrée sur Supabase.', 'error');
      return;
    }

    try {
      const deletedFromStorage = await supabaseDeleteGalleryImage(removed.image);
      setUploadStatus(
        deletedFromStorage
          ? 'Photo supprimée de la galerie et du stockage Supabase.'
          : 'Photo retirée de la galerie. Le fichier externe n’a pas été supprimé du stockage.',
        'success'
      );
    } catch (err) {
      setUploadStatus('Photo retirée de la galerie en ligne, mais le fichier reste dans Supabase Storage : ' + err.message, 'error');
    }
  } else {
    saveData(parsed);
    setUploadStatus('Photo retirée du brouillon local. Connectez-vous à Supabase pour publier la modification.', 'success');
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
  adminJson.addEventListener('input', renderGalleryManager);
  galleryManager.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-index]');
    if (button) removeGalleryImage(Number(button.dataset.galleryIndex));
  });
  resetConfigBtn.addEventListener('click', resetConfig);
  restoreDefaultsBtn.addEventListener('click', restoreDefaults);
  logoutBtn.addEventListener('click', logoutAdmin);

  const auth = localStorage.getItem(AUTH_KEY) === 'true';
  if (auth) {
    adminLoginBox.style.display = 'none';
    adminPanel.style.display = 'block';
    renderEditor();
    renderSupabaseConfig();
    updateRemoteActionState();
    setLoginMessage('Connexion active.', 'success');
    loadRemoteConfigIntoEditor();
  } else {
    saveSupabaseBtn.disabled = true;
    uploadImageBtn.disabled = true;
  }
});

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
let logoutBtn;
let supabaseUrlInput;
let supabaseKeyInput;
let supabaseStatus;

const STORAGE_KEY = 'lsSignatureAdminData';
const AUTH_KEY = 'lsSignatureAdminAuth';
const SUPABASE_CONFIG_STORAGE_KEY = 'lsSignatureSupabaseConfig';

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
  supabaseUrlInput = document.getElementById('supabaseUrl');
  supabaseKeyInput = document.getElementById('supabaseKey');
  supabaseStatus = document.getElementById('supabaseStatus');
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

function getSupabaseConfig() {
  const stored = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
  const envConfig = window.SUPABASE_CONFIG || { url: '', apiKey: '', anonKey: '' };

  if (!stored) {
    return {
      url: envConfig.url || '',
      key: envConfig.anonKey || envConfig.apiKey || ''
    };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      url: parsed.url || envConfig.url || '',
      key: parsed.key || envConfig.anonKey || envConfig.apiKey || ''
    };
  } catch (err) {
    return {
      url: envConfig.url || '',
      key: envConfig.anonKey || envConfig.apiKey || ''
    };
  }
}

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

function loginAdmin() {
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value;

  if (email === window.APP_DATA.admin.email && password === window.APP_DATA.admin.password) {
    localStorage.setItem(AUTH_KEY, 'true');
    adminLoginBox.style.display = 'none';
    adminPanel.style.display = 'block';
    renderEditor();
    renderSupabaseConfig();
    setLoginMessage('Connecté avec succès.', 'success');
  } else {
    setLoginMessage('Identifiants incorrects.', 'error');
  }
}

function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
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

function resetConfig() {
  localStorage.removeItem(STORAGE_KEY);
  renderEditor();
  setStatus('Configuration réinitialisée à la version par défaut.', 'success');
}

adminLoginBtn.addEventListener('click', loginAdmin);
saveConfigBtn.addEventListener('click', saveConfig);
saveSupabaseBtn.addEventListener('click', saveConfigSupabase);
loadSupabaseBtn.addEventListener('click', loadConfigSupabase);
resetConfigBtn.addEventListener('click', resetConfig);
logoutBtn.addEventListener('click', logoutAdmin);

window.addEventListener('load', () => {
  const auth = localStorage.getItem(AUTH_KEY) === 'true';
  if (auth) {
    adminLoginBox.style.display = 'none';
    adminPanel.style.display = 'block';
    renderEditor();
    renderSupabaseConfig();
    setLoginMessage('Connexion active.', 'success');
  }
});

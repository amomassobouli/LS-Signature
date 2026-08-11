const SUPABASE_CONFIG_STORAGE_KEY = 'lsSignatureSupabaseConfig';
const SUPABASE_SESSION_STORAGE_KEY = 'lsSignatureSupabaseSession';
const SUPABASE_ROW_ID = 1;
const SUPABASE_TABLE = 'site_config';
const SUPABASE_GALLERY_BUCKET = 'gallery';
const SUPABASE_MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 Mo

function getSupabaseConfig() {
  const stored = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
  const envConfig = window.SUPABASE_CONFIG || { url: '', apiKey: '', anonKey: '' };
  const envFallback = { url: envConfig.url || '', key: envConfig.anonKey || envConfig.apiKey || '' };

  if (!stored) return envFallback;

  try {
    const parsed = JSON.parse(stored);
    return {
      url: parsed.url || envFallback.url,
      key: parsed.key || envFallback.key
    };
  } catch (err) {
    return envFallback;
  }
}

function saveSupabaseConfig(config) {
  localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function hasSupabaseConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key);
}

/* Session Supabase Auth (obtenue via supabaseSignIn) — distincte de la clé
   "anon" publique. C'est ce jeton, pas la clé anon, qui autorise l'écriture
   une fois les policies RLS restreintes (voir supabase-site-config.sql). */
function getSupabaseSession() {
  const stored = localStorage.getItem(SUPABASE_SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (err) {
    return null;
  }
}

function hasSupabaseSession() {
  return Boolean(getSupabaseSession()?.access_token);
}

function clearSupabaseSession() {
  localStorage.removeItem(SUPABASE_SESSION_STORAGE_KEY);
}

async function supabaseSignIn(email, password) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) throw new Error('Supabase non configuré.');

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error_description || body.msg || 'Identifiants Supabase invalides.');
  }

  localStorage.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    email
  }));
  return body;
}

function supabaseSignOut() {
  clearSupabaseSession();
}

function supabaseHeaders() {
  const { key } = getSupabaseConfig();
  const session = getSupabaseSession();
  return {
    apikey: key,
    Authorization: 'Bearer ' + (session?.access_token || key),
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

async function supabaseFetchSiteConfig() {
  const { url } = getSupabaseConfig();
  if (!url) return null;

  try {
    const response = await fetch(`${url}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_ROW_ID}`, {
      headers: supabaseHeaders()
    });
    if (!response.ok) {
      console.warn('Supabase fetch failed', response.status, response.statusText);
      return null;
    }
    const json = await response.json();
    if (!json.length || !json[0].config) return null;
    return json[0].config;
  } catch (error) {
    console.warn('Supabase fetch error', error);
    return null;
  }
}

async function supabaseSaveSiteConfig(data) {
  const { url } = getSupabaseConfig();
  if (!url) throw new Error('Supabase non configuré.');
  if (!hasSupabaseSession()) {
    throw new Error('Connexion Supabase requise pour enregistrer (la clé anonyme seule ne suffit plus — connectez-vous avec un compte Supabase Auth).');
  }

  const response = await fetch(`${url}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ id: SUPABASE_ROW_ID, config: data }])
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase save failed: ${response.status} ${response.statusText} ${body}`);
  }

  return true;
}

/* Envoie un fichier image vers le bucket Supabase Storage "gallery" et
   renvoie son URL publique. Nécessite une session Supabase Auth valide —
   voir la policy "gallery_authenticated_upload" dans supabase-site-config.sql. */
async function supabaseUploadImage(file) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) throw new Error('Supabase non configuré.');
  if (!hasSupabaseSession()) {
    throw new Error('Connexion Supabase requise pour uploader une image (connectez-vous avec un compte Supabase Auth).');
  }
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné n\'est pas une image.');
  }
  if (file.size > SUPABASE_MAX_UPLOAD_BYTES) {
    throw new Error(`Image trop lourde (max ${SUPABASE_MAX_UPLOAD_BYTES / (1024 * 1024)} Mo).`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;
  const session = getSupabaseSession();

  const response = await fetch(`${url}/storage/v1/object/${SUPABASE_GALLERY_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + session.access_token,
      'Content-Type': file.type
    },
    body: file
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Échec de l'upload : ${response.status} ${response.statusText} ${body}`);
  }

  return `${url}/storage/v1/object/public/${SUPABASE_GALLERY_BUCKET}/${path}`;
}

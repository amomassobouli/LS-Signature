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
    expires_at: body.expires_at || Math.floor(Date.now() / 1000 + (body.expires_in || 3600)),
    email
  }));
  return body;
}

function supabaseSignOut() {
  clearSupabaseSession();
}

async function ensureSupabaseSession() {
  const session = getSupabaseSession();
  if (!session?.access_token) return null;

  const expiresAt = Number(session.expires_at || 0);
  if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session;
  if (!session.refresh_token) {
    clearSupabaseSession();
    throw new Error('Session Supabase expirée. Déconnectez-vous puis reconnectez-vous à l’espace admin.');
  }

  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const body = await response.json();
  if (!response.ok) {
    clearSupabaseSession();
    throw new Error(body.error_description || body.msg || 'Session Supabase expirée. Reconnectez-vous.');
  }

  const refreshed = {
    access_token: body.access_token,
    refresh_token: body.refresh_token || session.refresh_token,
    expires_at: body.expires_at || Math.floor(Date.now() / 1000 + (body.expires_in || 3600)),
    email: session.email
  };
  localStorage.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify(refreshed));
  return refreshed;
}

async function supabaseHeaders() {
  const { key } = getSupabaseConfig();
  const session = await ensureSupabaseSession();
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
      headers: await supabaseHeaders()
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Lecture Supabase refusée : ${response.status} ${response.statusText} ${body}`);
    }
    const json = await response.json();
    if (!json.length || !json[0].config) return null;
    return json[0].config;
  } catch (error) {
    console.warn('Supabase fetch error', error);
    throw error;
  }
}

async function supabaseSaveSiteConfig(data) {
  const { url } = getSupabaseConfig();
  if (!url) throw new Error('Supabase non configuré.');
  const session = await ensureSupabaseSession();
  if (!session) {
    throw new Error('Connexion Supabase requise pour enregistrer (la clé anonyme seule ne suffit plus — connectez-vous avec un compte Supabase Auth).');
  }

  const response = await fetch(`${url}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: {
      ...await supabaseHeaders(),
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
  const session = await ensureSupabaseSession();
  if (!session) throw new Error('Reconnectez-vous à l’espace admin pour uploader une image.');

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

async function supabaseDeleteGalleryImage(imageUrl) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) throw new Error('Supabase non configuré.');
  if (typeof imageUrl !== 'string') return false;

  const image = new URL(imageUrl, window.location.href);
  const project = new URL(url);
  const publicPrefix = `/storage/v1/object/public/${SUPABASE_GALLERY_BUCKET}/`;
  if (image.origin !== project.origin || !image.pathname.startsWith(publicPrefix)) return false;

  const objectPath = image.pathname.slice(publicPrefix.length).split('/').map(decodeURIComponent).join('/');
  if (!objectPath || objectPath.split('/').some((part) => part === '.' || part === '..')) return false;

  const session = await ensureSupabaseSession();
  if (!session) throw new Error('Reconnectez-vous à Supabase pour supprimer le fichier.');
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${url}/storage/v1/object/${SUPABASE_GALLERY_BUCKET}/${encodedPath}`, {
    method: 'DELETE',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + session.access_token
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Échec de suppression Storage : ${response.status} ${response.statusText} ${body}`);
  }
  return true;
}

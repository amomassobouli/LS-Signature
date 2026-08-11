const SUPABASE_CONFIG_STORAGE_KEY = 'lsSignatureSupabaseConfig';
const SUPABASE_ROW_ID = 1;
const SUPABASE_TABLE = 'site_config';

function getSupabaseConfig() {
  const stored = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
  if (!stored) return { url: '', key: '' };
  try {
    return JSON.parse(stored);
  } catch (err) {
    return { url: '', key: '' };
  }
}

function saveSupabaseConfig(config) {
  localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function hasSupabaseConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key);
}

function supabaseHeaders() {
  const { key } = getSupabaseConfig();
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
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

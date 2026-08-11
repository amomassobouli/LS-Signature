const fs = require('fs');
const path = require('path');

const envFile = path.resolve(__dirname, '..', '.env');
const outFile = path.resolve(__dirname, '..', 'js', 'env.js');

/* En local : lit .env (via dotenv) si présent.
   Sur Vercel : il n'y a pas de fichier .env dans le build — les variables
   sont injectées directement dans process.env depuis Project Settings →
   Environment Variables. Les deux sources sont donc supportées ici. */
let env = process.env;
if (fs.existsSync(envFile)) {
  const dotenv = require('dotenv');
  env = { ...process.env, ...dotenv.parse(fs.readFileSync(envFile)) };
}

if (!env.SUPABASE_URL) {
  console.warn('SUPABASE_URL absente (.env local ou variables Vercel) — js/env.js sera généré vide.');
}

const content = `window.SUPABASE_CONFIG = ${JSON.stringify({
  url: env.SUPABASE_URL || '',
  apiKey: env.SUPABASE_API_KEY || '',
  anonKey: env.SUPABASE_KEY || ''
}, null, 2)};\n`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('Generated js/env.js');

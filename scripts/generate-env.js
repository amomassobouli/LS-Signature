const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envFile = path.resolve(__dirname, '..', '.env');
const outFile = path.resolve(__dirname, '..', 'js', 'env.js');

if (!fs.existsSync(envFile)) {
  console.error('.env file not found. Create one from .env.example first.');
  process.exit(1);
}

const env = dotenv.parse(fs.readFileSync(envFile));
const content = `window.SUPABASE_CONFIG = ${JSON.stringify({
  url: env.SUPABASE_URL || '',
  apiKey: env.SUPABASE_API_KEY || '',
  anonKey: env.SUPABASE_KEY || ''
}, null, 2)};\n`;

fs.writeFileSync(outFile, content, 'utf8');
console.log('Generated js/env.js from .env');

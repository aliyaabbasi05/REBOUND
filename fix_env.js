import fs from 'fs';

const raw = fs.readFileSync('.env', 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

let gemini = '';
let port = '3000';
let groqKey = '';
let groqModel = 'qwen/qwen3.8-27b';

for (const line of lines) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    gemini = line.slice('GEMINI_API_KEY='.length);
  } else if (line.startsWith('PORT=')) {
    port = line.slice('PORT='.length);
  } else if (line.startsWith('GROQ_API_KEY=')) {
    let rest = line.slice('GROQ_API_KEY='.length);
    if (rest.includes('GROQ_MODEL=')) {
      const parts = rest.split('GROQ_MODEL=');
      groqKey = parts[0];
      groqModel = parts[1] || 'qwen/qwen3.8-27b';
    } else {
      groqKey = rest;
    }
  }
}

const cleaned = `GEMINI_API_KEY=${gemini}
PORT=${port}
GROQ_API_KEY=${groqKey}
GROQ_MODEL=${groqModel}
`;

fs.writeFileSync('.env', cleaned, 'utf8');
console.log('Fixed .env cleanly! Groq key length:', groqKey.length);

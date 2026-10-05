import fs from 'fs';
import dotenv from 'dotenv';

const envRaw = fs.readFileSync('.env', 'utf8');
const lines = envRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const parsedKeys = lines.map(l => l.split('=')[0].trim());
console.log('Keys in .env file:', parsedKeys);

dotenv.config();
console.log('process.env.GROQ_API_KEY is defined:', typeof process.env.GROQ_API_KEY === 'string' && process.env.GROQ_API_KEY.length > 0);
console.log('process.env.GROQ_API_KEY length:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);

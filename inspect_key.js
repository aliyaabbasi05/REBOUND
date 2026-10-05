import dotenv from 'dotenv';
dotenv.config();

const k = process.env.GROQ_API_KEY || '';
console.log('Key length:', k.length);
console.log('Prefix:', k.slice(0, 7));
console.log('Suffix:', k.slice(-4));
console.log('Has whitespace or newline:', /\s/.test(k));
console.log('Character codes around ends:', k.charCodeAt(0), k.charCodeAt(k.length - 1));

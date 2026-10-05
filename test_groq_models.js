import dotenv from 'dotenv';
dotenv.config();

async function checkModels() {
  console.log("Checking GROQ_API_KEY presence:", !!process.env.GROQ_API_KEY);
  console.log("Configured GROQ_MODEL in env:", process.env.GROQ_MODEL);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    });
    const data = await res.json();
    if (data.error) {
      console.error('Groq API Error:', data.error);
    } else {
      console.log('Available models count:', data.data ? data.data.length : 0);
      const models = (data.data || []).map(m => m.id);
      console.log('Models:');
      models.forEach(id => console.log(' - ' + id));
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkModels();

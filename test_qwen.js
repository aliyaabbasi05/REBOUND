import dotenv from 'dotenv';
dotenv.config();

async function testQwenVision() {
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  console.log('Testing model:', model);

  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: 'Say hello in JSON format: {"message": "hello"}'
      }
    ],
    response_format: { type: 'json_object' }
  };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Rate limit headers:', {
      limit: res.headers.get('x-ratelimit-limit-requests'),
      remaining: res.headers.get('x-ratelimit-remaining-requests'),
      reset: res.headers.get('x-ratelimit-reset-requests')
    });
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testQwenVision();

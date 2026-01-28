
const { fetch } = require('undici');
require('dotenv').config();

async function testVeo() {
  const apiKey = process.env.TUZI_API_KEY;
  if (!apiKey) {
    console.error('No API Key found');
    return;
  }

  console.log('Testing Veo API...');
  
  const payload = {
    model: "veo2-fast", // or whatever the exact model ID is
    messages: [
      {
        role: "user",
        content: "A cute rabbit eating a carrot, cartoon style"
      }
    ],
    stream: false
  };

  try {
    const response = await fetch('https://api.tu-zi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testVeo();

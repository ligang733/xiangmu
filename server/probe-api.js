
const { fetch } = require('undici');

async function probeApi() {
  const apiKey = process.env.TUZI_API_KEY || 'sk-Kp8hZXA46FiIhZ18ig8pcfOQXcoUz2ijakOmWXKGdXDP7n5X';
  const fakeId = '123456';

  console.log('Probing GET /v1/videos/:id ...');
  try {
    const response = await fetch(`https://api.tu-zi.com/v1/videos/${fakeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('Videos Endpoint Status:', response.status);
    if(response.status !== 404) console.log(await response.text());
  } catch (e) { console.log('Videos Endpoint Error:', e.message); }

  console.log('Probing GET /v1/tasks/:id ...');
  try {
    const response = await fetch(`https://api.tu-zi.com/v1/tasks/${fakeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('Tasks Endpoint Status:', response.status);
    if(response.status !== 404) console.log(await response.text());
  } catch (e) { console.log('Tasks Endpoint Error:', e.message); }
}

probeApi();

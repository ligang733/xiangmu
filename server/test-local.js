
const axios = require('axios');

async function testLocal() {
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('model', 'sora-2');
  formData.append('prompt', 'test prompt');
  formData.append('seconds', '10');
  formData.append('size', '720x1280');
  
  /*
  formData.append('input_reference', Buffer.from('fake content'), {
    filename: 'test.txt',
    contentType: 'text/plain'
  });
  */

  try {
    console.log('Testing http://localhost:3000/api/generate-video...');
    const response = await axios.post('http://localhost:3000/api/generate-video', formData, {
        headers: formData.getHeaders(),
        timeout: 5000
    });

    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Request failed:', error.message);
    if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNRESET') {
        console.error('Connection reset by peer (Server crashed?)');
    }
  }
}

testLocal();

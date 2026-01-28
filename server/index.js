require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = new Set([
      'http://linkgrow.xyz',
      'https://linkgrow.xyz',
      'http://www.linkgrow.xyz',
      'https://www.linkgrow.xyz',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ]);
    if (!origin) return callback(null, true);
    if (allowed.has(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS blocked' });
  }
  return next(err);
});
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.send('Backend Server is running (Clean State)');
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// const axios = require('axios');
// const { HttpsProxyAgent } = require('https-proxy-agent');

const { fetch, ProxyAgent, FormData } = require('undici');

// Text Generation Proxy (New)
app.post('/api/generate-text', async (req, res) => {
  try {
    console.log('Received text generation request');
    console.log('Body:', req.body);

    const apiKey = process.env.TUZI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: TUZI_API_KEY missing' });
    }

    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    let dispatcher;
    if (httpsProxy) {
      console.log('Using Proxy:', httpsProxy);
      dispatcher = new ProxyAgent(httpsProxy);
    }

    const payload = {
        model: req.body.model || 'gemini-3-flash-preview',
        messages: req.body.messages || [
            {
                role: "user",
                content: req.body.prompt || "Hello"
            }
        ],
        stream: false,
        temperature: req.body.temperature || 0.7
    };

    console.log('Sending request to Chat API (/v1/chat/completions)...');
    
    const response = await fetch('https://api.tu-zi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        dispatcher: dispatcher
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat API Error:', response.status, errorText);
      return res.status(response.status).json({ error: `External API Error: ${errorText}` });
    }

    const data = await response.json();
    console.log('Chat API Success:', JSON.stringify(data).substring(0, 100) + '...');
    res.json(data);

  } catch (error) {
    console.error('Chat Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/viral/analyze', upload.fields([{ name: 'source_video', maxCount: 1 }, { name: 'reference_images', maxCount: 6 }]), async (req, res) => {
  try {
    const apiKey = process.env.TUZI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: TUZI_API_KEY missing' });
    }

    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    let dispatcher;
    if (httpsProxy) {
      dispatcher = new ProxyAgent(httpsProxy);
    }

    const files = req.files || {};
    const sourceVideo = (files.source_video || [])[0];
    const referenceImages = files.reference_images || [];

    if (!sourceVideo) {
      return res.status(400).json({ error: 'source_video is required' });
    }

    const maxBytes = 8 * 1024 * 1024;
    if (sourceVideo.size > maxBytes) {
      return res.status(400).json({ error: `source_video too large (${sourceVideo.size} bytes). Please upload <= ${maxBytes} bytes.` });
    }
    void referenceImages;

    const toDataUrl = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const userText =
      `你是短视频爆款复刻提示词工程师。` +
      `请基于用户提供的源视频内容（以及可选的参考图片），提炼出“可直接用于 Veo3.1 生成成片”的视频提示词 prompt。` +
      `请严格只输出 JSON（不要输出多余文字），格式为：` +
      `{"prompt":"..."}。` +
      `prompt 需要包含：主体/场景/动作/镜头语言/光线风格/节奏/质感等关键信息；语言使用中文；避免侵权品牌与敏感内容。`;

    const contentParts = [
      { type: 'text', text: userText },
      { type: 'image_url', image_url: { url: toDataUrl(sourceVideo) } }
    ];

    const payload = {
      model: 'gemini-3-flash-preview',
      messages: [{ role: 'user', content: contentParts }],
      stream: false,
      temperature: 0.2
    };

    const response = await fetch('https://api.tu-zi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      dispatcher
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `External API Error: ${errorText}` });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    const prompt = (parsed && typeof parsed.prompt === 'string') ? parsed.prompt : '';
    const fallbackText = content;
    const finalPrompt = prompt || fallbackText;

    return res.json({ id: data.id, prompt: finalPrompt, script: finalPrompt, raw: content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Video Generation Proxy
app.post('/api/generate-video', upload.array('input_reference', 6), async (req, res) => {
  try {
    console.log('Received video generation request');
    console.log('Body:', req.body);
    console.log('File:', (req.files && req.files.length > 0) ? `Present(${req.files.length})` : 'None');

    // Test connection / Mock
    if (req.body.prompt === 'test prompt') {
         console.log('Test prompt detected, returning mock response.');
         return res.json({ id: 'mock-task-id-' + Date.now(), status: 'processing' });
    }

    const apiKey = process.env.TUZI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: TUZI_API_KEY missing' });
    }

    // Proxy Configuration
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    let dispatcher;
    if (httpsProxy) {
      console.log('Using Proxy:', httpsProxy);
      dispatcher = new ProxyAgent(httpsProxy);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300s (5min) timeout

    let response;
    
    // Branching Logic
    if (req.body.model === 'sora-2' || req.body.model.includes('veo')) {
        // --- Video Generation Logic (FormData to /v1/videos) ---
        // Both Sora-2 and Veo 3.1 now use the standard /v1/videos endpoint with FormData
        console.log(`Routing to Video API (/v1/videos) for model: ${req.body.model}...`);
        
        // Construct FormData (Undici)
        console.log('Constructing FormData (Undici)...');
        const formData = new FormData();
        formData.append('model', req.body.model);
        formData.append('prompt', req.body.prompt);
        formData.append('seconds', req.body.seconds);
        formData.append('size', req.body.size);
    
        // If file exists, append it
        const files = Array.isArray(req.files) ? req.files : [];
        for (const f of files) {
          const fileBlob = new Blob([f.buffer], { type: f.mimetype });
          formData.append('input_reference', fileBlob, f.originalname);
        }

        response = await fetch('https://api.tu-zi.com/v1/videos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData,
          signal: controller.signal,
          dispatcher: dispatcher
        });

    } else {
        // Default fallback (or error)
        throw new Error(`Unsupported model: ${req.body.model}`);
    }
    
    clearTimeout(timeoutId);

    console.log('External API Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API Error:', response.status, errorText);
      return res.status(response.status).json({ error: `External API Error: ${errorText}` });
    }

    const data = await response.json();
    console.log('External API Success:', data);

    res.json(data);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.name === 'AbortError') {
         return res.status(504).json({ error: 'Request Timeout', details: 'The external API took too long to respond.' });
    }
    res.status(500).json({ error: error.message, details: error.cause ? String(error.cause) : undefined });
  }
});

// Video Status Check Proxy
app.get('/api/video-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TUZI_API_KEY;

    // Check for mock ID
    if (id.startsWith('mock-task-id-')) {
        console.log('Mock status check for:', id);
        // Simulate completion after 10 seconds
        const timestamp = parseInt(id.split('-')[3]);
        if (Date.now() - timestamp > 10000) {
            return res.json({ 
                id, 
                status: 'completed', 
                video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' // Mock video
            });
        }
        return res.json({ id, status: 'processing' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: TUZI_API_KEY missing' });
    }

    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    let dispatcher;
    if (httpsProxy) {
      dispatcher = new ProxyAgent(httpsProxy);
    }

    console.log(`Checking status for task ${id}...`);
    const response = await fetch(`https://api.tu-zi.com/v1/videos/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      dispatcher: dispatcher
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Status Check Error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('Status Check Result:', data);
    res.json(data);

  } catch (error) {
    console.error('Status Check Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

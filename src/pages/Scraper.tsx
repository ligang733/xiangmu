import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy, Download, FileText, Image as ImageIcon, Loader2, Type, Wand2, X, Play, Video, Heart, Plus, Monitor, Smartphone, Languages, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../config/categoryConfig';
import { generatePrompt } from '../services/geminiService';
import type { GenerateRequest } from '../types';

const PLATFORM_OPTIONS = [
  { label: 'Amazon / Walmart', value: 'amazon' },
  { label: 'Temu / AliExpress', value: 'temu' },
  { label: 'TikTok / eBay', value: 'tiktok' },
  { label: 'Shein / 独立站', value: 'shein' }
];

const COUNTRY_OPTIONS = [
  { label: '北美', value: 'us' },
  { label: '日本', value: 'jp' },
  { label: '欧洲', value: 'eu' },
  { label: '拉美/巴西/墨西哥', value: 'latam' }
];

const LANGUAGE_OPTIONS = [
  'English',
  'Chinese',
  'Japanese',
  'Korean',
  'German',
  'French',
  'Spanish',
  'Portuguese',
  'Italian',
  'Russian',
  'Arabic'
];

interface ScrapedProduct {
  title: string;
  translatedTitle?: string;
  images: string[];
  specs: Record<string, string>;
}

export const Scraper = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapedProduct | null>(null);
  const [error, setError] = useState('');
  
  const [showManualTitleMenu, setShowManualTitleMenu] = useState(false);
  const [isOptimizingManualTitle, setIsOptimizingManualTitle] = useState(false);
  const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [debugPrompt, setDebugPrompt] = useState(""); // New state for prompt log


  const [optimizationSettings, setOptimizationSettings] = useState({
    platform: PLATFORM_OPTIONS[0].value,
    country: COUNTRY_OPTIONS[0].value,
    category: PRODUCT_CATEGORIES[0].id
  });

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState(false);

  const [manualData, setManualData] = useState({
    title: '',
    translatedTitle: '',
    images: [] as (File | string)[]
  });
  
  const [visualTags, setVisualTags] = useState<string[]>([]);

  const [imageCount, setImageCount] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState('google');

  interface CompetitorAnalysisResult {
    score: number;
    keywords: string[];
    pros: string[];
    cons: string[];
    suggestions: string[];
  }

  interface VideoTask {
    id: string;
    time: string;
    prompt: string;
    status: 'processing' | 'completed' | 'failed';
    thumbnail?: string;
    duration?: string;
    videoUrl?: string;
  }

  interface ViralTask {
    id: string;
    time: string;
    title: string;
    status: 'processing' | 'completed' | 'failed';
    videoUrl?: string;
  }

  // Active Module State (Product Optimization vs Competitor Analysis etc.)
  type ActiveModule = 
    | 'product-optimization' 
    | 'image-tools'
    | 'competitor-analysis' 
    | 'review-summary'
    | 'video-creation'
    | 'viral-video-remake'
    | 'social-copy'
    | 'keyword-check'
    | 'other';

  const [activeModule, setActiveModule] = useState<ActiveModule>('product-optimization');

  // Competitor Analysis State
  // const [showCompetitorAnalysis, setShowCompetitorAnalysis] = useState(false); // Removed in favor of activeModule
  const [competitorData, setCompetitorData] = useState({
    title: '',
    bullets: ['', '', '', '', '']
  });
  const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState(false);
  const [competitorResult, setCompetitorResult] = useState<CompetitorAnalysisResult | null>(null);

  // Review Summary State
  const [reviewInput, setReviewInput] = useState('');
  const [isAnalyzingReviews, setIsAnalyzingReviews] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    painPoints: string[];
    userPersona: {
      usage: string;
      demographics: string;
    };
  } | null>(null);

  // Video Creation State
  const [videoSettings, setVideoSettings] = useState({
    mode: 'text-to-video', // 'text-to-video' | 'image-to-video'
    prompt: '',
    style: 'Fast Paced / 快节奏',
    duration: '15s',
    music: 'Upbeat / 欢快',
    ratio: '9:16', // New ratio state
    image: null as File | null, // For image-to-video
    model: 'sora-2' // New model state
  });
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState<{
    thumbnail: string;
    duration: string;
  } | null>(null);

  const [videoHistory, setVideoHistory] = useState<VideoTask[]>(() => {
    try {
      const saved = localStorage.getItem('videoHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load video history', e);
      return [];
    }
  });

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
  const apiUrl = (path: string) => `${String(API_BASE_URL).replace(/\/+$/, '')}${path}`;

  useEffect(() => {
    localStorage.setItem('videoHistory', JSON.stringify(videoHistory));
  }, [videoHistory]);

  // Polling for video status
  useEffect(() => {
    const processingTasks = videoHistory.filter(task => 
        task.status === 'processing' && 
        !task.id.toString().startsWith('veo-') // Skip Veo tasks (Double Safety)
    );
    
    if (processingTasks.length === 0) return;

    const intervalId = setInterval(async () => {
      console.log('Polling video status for:', processingTasks.map(t => t.id));
      
      for (const task of processingTasks) {
        try {
          const response = await fetch(apiUrl(`/api/video-status/${task.id}`));
          if (!response.ok) continue;

          const data = await response.json();
          // Assuming API returns { status: 'completed', video_url: '...' } or similar
          // Adjust logic based on actual API response structure
          // Map backend status to frontend status
          let newStatus: VideoTask['status'] = 'processing';
          let videoUrl = undefined;

          if (data.status === 'success' || data.status === 'completed' || data.state === 'succeeded') {
             newStatus = 'completed';
             // Try to find the video URL in the response
             videoUrl = data.video_url || data.url || data.output?.video_url;
          } else if (data.status === 'failed' || data.state === 'failed') {
             newStatus = 'failed';
          }

          if (newStatus !== 'processing') {
             setVideoHistory(prev => prev.map(t => {
                 if (t.id === task.id) {
                     return { ...t, status: newStatus, videoUrl: videoUrl };
                 }
                 return t;
             }));
             
             // If currently showing this result, update it too
             if (videoResult && videoResult.thumbnail === task.thumbnail) {
                 // We might want to update the displayed result, but for now let's just rely on the history
             }
          }

        } catch (e) {
          console.error(`Failed to check status for task ${task.id}`, e);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [videoHistory]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoSettings(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };

  // Social Copy State
  const [socialSettings, setSocialSettings] = useState({
    platform: 'Instagram',
    tone: 'Professional / 专业',
    language: 'English'
  });
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [socialResult, setSocialResult] = useState<string | null>(null);

  // Viral Video Remake State
  const [viralSettings, setViralSettings] = useState({
    confirmMode: true,
    videoSourceType: 'local' as 'local' | 'url',
    videoFile: null as File | null,
    videoUrl: '', 
    imageSourceType: 'local' as 'local' | 'album' | 'url',
    referenceImages: [] as File[],
    imageUrl: '',
    description: '',
    duration: '8s (Veo3.1)',
    language: 'Chinese',
    ratio: '9:16' as '9:16' | '16:9'
  });
  const [viralHistory, setViralHistory] = useState<ViralTask[]>([]);
  const [isAnalyzingViral, setIsAnalyzingViral] = useState(false);
  const [viralResult, setViralResult] = useState<{
    script: string;
    shots: any[];
  } | null>(null);
  const [isGeneratingViralVideo, setIsGeneratingViralVideo] = useState(false);

  useEffect(() => {
    const processingTasks = viralHistory.filter(task => task.status === 'processing' && !task.id.toString().startsWith('veo-'));
    if (processingTasks.length === 0) return;

    const intervalId = setInterval(async () => {
      for (const task of processingTasks) {
        try {
          const response = await fetch(apiUrl(`/api/video-status/${task.id}`));
          if (!response.ok) {
            const text = await response.text();
            if (text.includes('task_not_exist')) {
              setViralHistory(prev => prev.map(t => (t.id === task.id ? { ...t, status: 'failed' } : t)));
            }
            continue;
          }

          const data = await response.json();
          let newStatus: ViralTask['status'] = 'processing';
          let videoUrl: string | undefined;

          if (data.status === 'success' || data.status === 'completed' || data.state === 'succeeded') {
            newStatus = 'completed';
            videoUrl = data.video_url || data.url || data.output?.video_url;
          } else if (data.status === 'failed' || data.state === 'failed') {
            newStatus = 'failed';
          }

          if (newStatus !== 'processing') {
            setViralHistory(prev => prev.map(t => (t.id === task.id ? { ...t, status: newStatus, videoUrl } : t)));
          }
        } catch {
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [viralHistory]);

  // Keyword Check State
  const [keywordInput, setKeywordInput] = useState('');
  const [isCheckingKeywords, setIsCheckingKeywords] = useState(false);
  const [keywordResult, setKeywordResult] = useState<{
    flagged: string[];
    score: number;
  } | null>(null);

  // Image Tools State
  const [imageToolMode, setImageToolMode] = useState<'white-bg' | 'watermark-remove'>('white-bg');
  const [imageToolImages, setImageToolImages] = useState<File[]>([]);
  const [imageToolResults, setImageToolResults] = useState<{original: string, processed: string}[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const MODULE_MAP: Record<string, ActiveModule> = {
    '商品信息优化': 'product-optimization',
    '一键白底/去水印': 'image-tools',
    '竞品分析器': 'competitor-analysis',
    '差评总结': 'review-summary',
    '视频制作': 'video-creation',
    '爆款视频复刻': 'viral-video-remake',
    '社媒文案生成': 'social-copy',
    '违规词分析': 'keyword-check'
  };

  const MODULE_INFO: Record<ActiveModule, { title: string; description: string }> = {
    'product-optimization': { title: '商品信息优化', description: '上传图片或粘贴链接，一键优化商品信息' },
    'image-tools': { title: '一键白底/去水印', description: '智能移除背景与水印处理' },
    'competitor-analysis': { title: '竞品分析器', description: '输入竞品信息，AI 自动分析优缺点及关键词' },
    'review-summary': { title: '差评总结', description: 'AI 智能分析差评，提炼改进点' },
    'video-creation': { title: '视频制作', description: '一键生成商品营销视频' },
    'viral-video-remake': { title: '爆款视频复刻', description: '分析爆款视频，生成复刻脚本' },
    'social-copy': { title: '社媒文案生成', description: '生成多平台社交媒体推广文案' },
    'keyword-check': { title: '违规词分析', description: '检测 Listing 中的违规敏感词' },
    'other': { title: '其他功能', description: '功能开发中...' }
  };

  const handleSidebarClick = (item: string) => {
    const module = MODULE_MAP[item];
    if (module) {
      setActiveModule(module);
      if (module === 'competitor-analysis') {
        setCompetitorResult(null); // Reset result when switching
      } else if (module === 'review-summary') {
        setReviewResult(null); // Reset result when switching
      } else if (module === 'video-creation') {
        setVideoResult(null);
      } else if (module === 'social-copy') {
        setSocialResult(null);
      } else if (module === 'viral-video-remake') {
        setViralResult(null);
      } else if (module === 'keyword-check') {
        setKeywordResult(null);
      }
    } else if (item === 'Back') {
      setActiveModule('product-optimization');
    }
  };

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      const newData = { ...competitorData };
      
      // Heuristic: First line is title, rest are bullets
      newData.title = lines[0];
      
      const bullets = lines.slice(1).slice(0, 5);
      newData.bullets = [...bullets, ...Array(5 - bullets.length).fill('')];

      setCompetitorData(newData);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleCompetitorSubmit = async () => {
    if (!competitorData.title) return;
    
    setIsAnalyzingCompetitor(true);
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock Result
    setCompetitorResult({
      score: 85,
      keywords: ['Portable', 'Wireless', 'Fast Charging', 'Durable', 'Lightweight'],
      pros: ['Strong keyword usage in title', 'Clear benefit-driven bullet points', 'Good use of technical specs'],
      cons: ['Title could be more concise', 'Missing emotional triggers in description'],
      suggestions: [
        'Add "Gift for Him/Her" to target gifters',
        'Emphasize warranty information in the last bullet',
        'Use more power words like "Revolutionary" or "Instant"'
      ]
    });
    
    setIsAnalyzingCompetitor(false);
  };

  const handleReviewSubmit = async () => {
    if (!reviewInput.trim()) return;

    setIsAnalyzingReviews(true);
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock Result
    setReviewResult({
      painPoints: [
        '电池续航时间短，充满电只能用20分钟',
        '拉链质量差，使用不到一周就卡住了',
        '说明书只有英文，操作复杂难懂'
      ],
      userPersona: {
        usage: '送礼为主（约60%提及送给男朋友/丈夫）',
        demographics: '女性购买者居多（约70%），年龄层集中在25-35岁'
      }
    });

    setIsAnalyzingReviews(false);
  };

  const handleVideoSubmit = async () => {
    if (!videoSettings.prompt.trim()) {
        alert('请输入提示词');
        return;
    }
    if (videoSettings.mode === 'image-to-video' && !videoSettings.image) {
        alert('请上传图片');
        return;
    }

    setIsGeneratingVideo(true);
    setVideoResult(null);

    try {
      const formData = new FormData();
      
      // 1. Model (Fixed as sora-2)
      formData.append('model', videoSettings.model);

      // 2. Prompt (Combine prompt + style + music)
      // Extract English parts from "Fast Paced / 快节奏" -> "Fast Paced"
      const styleVal = videoSettings.style.split(' / ')[0];
      const musicVal = videoSettings.music.split(' / ')[0];
      const fullPrompt = `${videoSettings.prompt}, Style: ${styleVal}, Music: ${musicVal}`;
      formData.append('prompt', fullPrompt);

      // 3. Seconds (Extract number, ensure valid values 10, 15, 25)
      let secondsVal = parseInt(videoSettings.duration.replace(/\D/g, '')) || 10;
      // Map 5s -> 10s (as API requires 10, 15, 25)
      if (secondsVal < 10) secondsVal = 10;
      formData.append('seconds', secondsVal.toString());

      // 4. Size (Map ratio to resolution)
      // 16:9 -> 1280x720, 9:16 -> 720x1280 (Using SD for sora-2)
      const isLandscape = videoSettings.ratio.startsWith('16:9');
      const sizeVal = isLandscape ? '1280x720' : '720x1280';
      formData.append('size', sizeVal);

      // 5. Input Reference (File Object for Image-to-Video)
      if (videoSettings.mode === 'image-to-video' && videoSettings.image) {
        formData.append('input_reference', videoSettings.image);
      }

      // 6. Call API (Proxy via Backend)
      console.log('Sending Video Generation Request (FormData) to Backend Proxy...');

      const response = await fetch(apiUrl('/api/generate-video'), {
        method: 'POST',
        // Headers are automatically set by browser for FormData (multipart/form-data)
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(`API Request Failed: ${response.status} ${data.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // 7. Handle Result
      // Check if task is already completed (e.g. Veo model)
      const isCompleted = data.status === 'completed' || data.status === 'succeeded';
      const videoUrl = data.video_url || data.url || data.output?.video_url;

      // API returns { id: "..." }
      // Since we don't get the video URL immediately, we show a placeholder state
      const thumbnail = videoSettings.mode === 'image-to-video' && videoSettings.image
          ? URL.createObjectURL(videoSettings.image)
          : '/placeholder.svg';
          
      setVideoResult({
        thumbnail,
        duration: `${secondsVal}s`
      });
      
      // Add to history
      const newTask: VideoTask = {
        id: data.id || (videoSettings.model.includes('veo') ? `veo-${Date.now()}` : Date.now().toString()),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        prompt: videoSettings.prompt,
        status: isCompleted ? 'completed' : 'processing',
        thumbnail: thumbnail, // Note: ObjectURL won't persist after refresh
        duration: `${secondsVal}s`,
        videoUrl: isCompleted ? videoUrl : undefined
      };
      
      setVideoHistory(prev => [newTask, ...prev]);
      
      if (isCompleted) {
          alert(`视频生成成功！`);
      } else {
          alert(`视频生成任务已提交！Task ID: ${data.id}`);
      }

    } catch (e: any) {
      console.error("Video Generation Error:", e);
      alert(`生成失败: ${e.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSocialSubmit = async () => {
    setIsGeneratingSocial(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const platform = socialSettings.platform;
    const hashtags = platform === 'Instagram' ? '#MustHave #Trending #ShopNow' : platform === 'TikTok' ? '#fyp #tiktokmademebuyit' : '';
    
    setSocialResult(`🚀 Don't miss out on this amazing product! \n\n✨ Key Features:\n- High quality material\n- Fast shipping\n- Satisfaction guaranteed\n\nGrab yours today! 🛍️\n\n${hashtags}`);
    setIsGeneratingSocial(false);
  };

  const handleViralAnalyze = async () => {
    if (viralSettings.videoSourceType !== 'local' || !viralSettings.videoFile) {
      alert('请先上传源视频');
      return;
    }

    setIsAnalyzingViral(true);
    try {
      const formData = new FormData();
      formData.append('source_video', viralSettings.videoFile);
      for (const img of viralSettings.referenceImages.slice(0, 6)) {
        formData.append('reference_images', img);
      }

      const response = await fetch(apiUrl('/api/viral/analyze'), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Request Failed: ${response.status} ${text}`);
      }

      const data = await response.json();
      setViralResult({
        script: data.prompt || data.script || '',
        shots: []
      });
    } catch (e: any) {
      alert(`分析失败: ${e.message}`);
    } finally {
      setIsAnalyzingViral(false);
    }
  };

  const handleViralGenerate = async () => {
    if (!viralResult?.script?.trim()) {
      alert('请先分析并确认提示词');
      return;
    }
    if (viralSettings.referenceImages.length === 0) {
      alert('请至少上传 1 张参考图片');
      return;
    }

    setIsGeneratingViralVideo(true);
    try {
      const formData = new FormData();
      formData.append('model', 'veo3.1');
      formData.append('prompt', viralResult.script);
      formData.append('seconds', '8');

      const sizeVal = viralSettings.ratio === '16:9' ? '1280x720' : '720x1280';
      formData.append('size', sizeVal);

      for (const img of viralSettings.referenceImages.slice(0, 6)) {
        formData.append('input_reference', img);
      }

      const response = await fetch(apiUrl('/api/generate-video'), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(`API Request Failed: ${response.status} ${data?.error || response.statusText}`);
      }

      const data = await response.json();
      const id = data.id || Date.now().toString();
      const titleBase = viralSettings.description?.trim() || viralResult.script.trim();

      const newTask: ViralTask = {
        id,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        title: titleBase.length > 24 ? `${titleBase.slice(0, 24)}...` : titleBase,
        status: 'processing'
      };

      setViralHistory(prev => [newTask, ...prev]);
      alert(`成片生成任务已提交！Task ID: ${id}`);
    } catch (e: any) {
      alert(`生成失败: ${e.message}`);
    } finally {
      setIsGeneratingViralVideo(false);
    }
  };

  const handleKeywordSubmit = async () => {
    if (!keywordInput.trim()) return;
    setIsCheckingKeywords(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock check
    setKeywordResult({
      flagged: ['Guarantee', 'Best', 'Free', 'No.1', 'Perfect'],
      score: 85
    });
    setIsCheckingKeywords(false);
  };

  const handleImageToolsSubmit = async () => {
    if (imageToolImages.length === 0) return;
    setIsProcessingImages(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = imageToolImages.map(file => ({
      original: URL.createObjectURL(file),
      processed: URL.createObjectURL(file) // In a real app, this would be the processed image URL
    }));

    setImageToolResults(results);
    setIsProcessingImages(false);
  };

  const handleImageToolFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageToolImages([...imageToolImages, ...Array.from(e.target.files)]);
    }
  };

  const handleGenerateImage = async (e?: React.FormEvent) => {
    console.log("🖱️ Generate button clicked!");
    if (e) e.preventDefault();
    
    // Validation: Only check for images
    if (manualData.images.length === 0) {
      alert("请先上传图片");
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // Convert images to base64 to ensure backend gets original data
      const imagePromises = manualData.images.map(async (img) => {
        if (img instanceof File) {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(img);
          });
        }
        return img as string;
      });

      const base64Images = await Promise.all(imagePromises);

      // Prepare the request payload
      const requestPayload: GenerateRequest & { model_provider: string } = {
          productName: manualData.title || 'Product Image', // Use placeholder if title is empty
          category: optimizationSettings.category,
          platform: optimizationSettings.platform,
          country: optimizationSettings.country,
          images: base64Images, // Send original images as base64
          imageCount: imageCount,
          model_provider: selectedModel,
          visual_features: visualTags
      };
      
      console.log('Sending Generation Request:', requestPayload);

      const response = await fetch(apiUrl('/api/generate-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const generatedImages = data.data.images;

      setResult({
        title: manualData.title || 'Product Image',
        translatedTitle: manualData.translatedTitle,
        images: generatedImages, // Use generated images
        specs: { 
          '来源': 'AI生成 (Google)',
          '目标平台': optimizationSettings.platform,
          '目标国家': optimizationSettings.country,
          '产品大类': optimizationSettings.category,
        }
      });
      
      // Update Debug Prompt Log
      if (data.data.usedPrompt) {
        setDebugPrompt(data.data.usedPrompt);
      }
    } catch (e: any) {
      console.error("Generation error", e);
      const errorMsg = e.message || '生成失败';
      setError(errorMsg);
      alert("发生错误: " + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzingImage(true);
    setShowAutoFillSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('model_provider', selectedModel);

      // Note: Backend endpoint /api/analyze-image needs to support multipart/form-data
      const response = await fetch(apiUrl('/api/analyze-image'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      const categoryName = data.data?.category; 
      const tags = data.data?.visual_tags;

      if (tags && Array.isArray(tags)) {
          setVisualTags(tags);
          console.log('Auto-detected visual tags:', tags);
      }

      if (categoryName) {
        // Map backend category to frontend ID
        let targetId = '';
        const lowerCat = categoryName.toLowerCase();
        
        // Simple mapping based on expected backend returns or user examples
        if (lowerCat.includes('digital') || lowerCat.includes('tech') || lowerCat === 'electronics') targetId = 'electronics';
        else if (lowerCat.includes('beauty') || lowerCat.includes('personal')) targetId = 'beauty';
        else if (lowerCat.includes('home') || lowerCat.includes('kitchen')) targetId = 'home';
        else if (lowerCat.includes('cloth') || lowerCat.includes('fashion')) targetId = 'fashion';
        else if (lowerCat.includes('access') || lowerCat.includes('jewelry')) targetId = 'jewelry';
        else if (lowerCat.includes('tool') || lowerCat.includes('auto')) targetId = 'auto';
        else if (lowerCat.includes('toy') || lowerCat.includes('baby')) targetId = 'toys';
        else if (lowerCat.includes('out') || lowerCat.includes('sport')) targetId = 'outdoor';
        
        // If we found a match in our config, update state
        const exists = PRODUCT_CATEGORIES.find(c => c.id === targetId);
        
        if (exists) {
            setOptimizationSettings(prev => ({
                ...prev,
                category: targetId
            }));
            setShowAutoFillSuccess(true);
            setTimeout(() => setShowAutoFillSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error('Auto-analysis error:', error);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setManualData(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles]
      }));

      // Trigger analysis on the first file if it's the first upload batch
      // logic: if user drags in 1 image, analyze it.
      if (newFiles.length > 0) {
          analyzeImage(newFiles[0]);
      }
    }
  };

  const removeImage = (index: number) => {
    setManualData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };



  const handleManualOptimizeTitle = async (type: string) => {
    setShowManualTitleMenu(false);
    setIsOptimizingManualTitle(true);
    
    try {
      // Call backend API for text optimization
      const response = await fetch(apiUrl('/api/text/refine'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: manualData.title,
          mode: 'optimize',
          target: type
        })
      });

      if (!response.ok) throw new Error('Optimization failed');

      const data = await response.json();
      const optimizedTitle = data.data.result;

      setManualData(prev => ({
        ...prev,
        title: optimizedTitle
      }));
    } catch (e) {
      console.error(e);
      alert("优化失败，请重试");
    } finally {
      setIsOptimizingManualTitle(false);
    }
  };

  const handleTranslateTitle = async () => {
    if (!manualData.title) return;
    setIsTranslatingTitle(true);
    try {
      // Call backend API for translation
      const response = await fetch(apiUrl('/api/text/refine'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: manualData.title,
          mode: 'translate',
          target: targetLanguage
        })
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      const translatedText = data.data.result;

      setManualData(prev => ({
        ...prev,
        translatedTitle: translatedText
      }));
    } catch (e) {
      console.error(e);
      alert("翻译失败，请重试");
    } finally {
      setIsTranslatingTitle(false);
    }
  };



  const handleCopyJSON = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    }
  };

  const handleDownloadData = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-optimization-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToLocal = () => {
    handleDownloadData();
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `optimized_image_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Only handle paste in upload mode
    const items = e.clipboardData.items;
    const newImages: (File | string)[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) newImages.push(file);
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          if (text.match(/^https?:\/\/.+$/i)) {
             setManualData(prev => ({
               ...prev,
               images: [...prev.images, text]
             }));
          }
        });
      }
    }
    
    if (newImages.length > 0) {
        setManualData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#e2e8f0] font-sans relative overflow-hidden p-8" onPaste={handlePaste} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Cyberpunk Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#00f0ff,transparent)] opacity-5 pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto flex gap-8 items-start relative z-10">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2 backdrop-blur-md bg-white/5 border-r border-[#00f0ff]/30 p-4 min-h-[600px]">
          <div className="mb-6 px-2">
             <h2 className="text-2xl font-bold text-[#00f0ff] font-['Orbitron'] tracking-widest">Link<span className="text-white">Grow</span></h2>
             <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">System Online v2.0</p>
          </div>
          {[
            '商品信息优化',
            '一键白底/去水印',
            '竞品分析器',
            '差评总结',
            '视频制作',
            '爆款视频复刻',
            '社媒文案生成',
            '违规词分析'
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleSidebarClick(item)}
              className={`text-left text-sm font-bold transition-all relative py-3 px-4 uppercase tracking-wider clip-path-polygon
                ${activeModule === MODULE_MAP[item]
                  ? 'text-[#00f0ff] bg-[#00f0ff]/10 border-l-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                  : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/5 border-l-2 border-transparent'
                }
              `}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Main Content - Right Side */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 border-b border-[#00f0ff]/20 pb-6">
            <button
              onClick={() => {
                if (activeModule !== 'product-optimization') {
                  setActiveModule('product-optimization');
                } else {
                  navigate('/');
                }
              }}
              className="p-2 hover:bg-[#00f0ff]/20 rounded-none border border-[#00f0ff]/50 transition-colors text-[#00f0ff]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white font-['Orbitron'] tracking-widest uppercase flex items-center gap-3">
                <span className="text-[#00f0ff]">{'>'}</span> 
                {MODULE_INFO[activeModule]?.title || '商品信息优化'}
              </h1>
              <p className="text-sm text-[#94a3b8] mt-1 font-mono tracking-wider">
                // {MODULE_INFO[activeModule]?.description}
              </p>
            </div>
          </div>

          {/* Optimization Settings Bar (Only for Product Optimization) */}
          {activeModule === 'product-optimization' && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] mb-8 relative">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#00f0ff]" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#00f0ff]" />

            <select
              value={optimizationSettings.platform}
              onChange={(e) => setOptimizationSettings(prev => ({ ...prev, platform: e.target.value }))}
              className="text-sm border border-[#1e293b] rounded-none focus:border-[#00f0ff] focus:ring-0 bg-[#0b1120] text-[#e2e8f0] py-2 pl-3 pr-8 uppercase tracking-wider font-medium"
            >
              {PLATFORM_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select
              value={optimizationSettings.country}
              onChange={(e) => setOptimizationSettings(prev => ({ ...prev, country: e.target.value }))}
              className="text-sm border border-[#1e293b] rounded-none focus:border-[#00f0ff] focus:ring-0 bg-[#0b1120] text-[#e2e8f0] py-2 pl-3 pr-8 uppercase tracking-wider font-medium"
            >
              {COUNTRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <div className="relative">
              <select
                value={optimizationSettings.category}
                onChange={(e) => setOptimizationSettings(prev => ({ 
                  ...prev, 
                  category: e.target.value
                }))}
                className={`text-sm border rounded-none focus:ring-0 bg-[#0b1120] text-[#e2e8f0] py-2 pl-3 pr-8 uppercase tracking-wider font-medium transition-all ${
                  showAutoFillSuccess 
                    ? 'border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.5)]' 
                    : 'border-[#1e293b] focus:border-[#00f0ff]'
                }`}
              >
                {PRODUCT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
              {showAutoFillSuccess && (
                 <div className="absolute -top-3 -right-2 text-[10px] font-bold text-[#0b1120] bg-[#00f0ff] px-1.5 py-0.5 animate-bounce flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AUTO
                 </div>
              )}
            </div>


            


            {/* Image Count Selector */}
            <div className="flex items-center border border-[#1e293b] bg-[#0b1120] ml-2">
                <div className="px-3 py-2 text-xs font-bold text-[#00f0ff] border-r border-[#1e293b] uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    <span>Count</span>
                </div>
                <div className="flex">
                    {[1, 2, 3, 4].map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => setImageCount(num)}
                            className={`w-8 py-2 text-xs font-bold transition-all border-r border-[#1e293b] last:border-r-0 ${
                                imageCount === num
                                ? 'bg-[#00f0ff] text-[#0b1120]'
                                : 'text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1"></div>

            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isLoading || manualData.images.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#0b1120] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider rounded-none shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              开始生成
            </button>
          </div>
          )}

          {/* Main Card - Conditional Rendering */}
          {activeModule === 'product-optimization' ? (
          <>
          <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] mb-8 relative">
             {/* Decorative Top Line */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent"></div>
            <div className="p-8">
                <form onSubmit={handleGenerateImage} className="space-y-8">
                  {/* Image Section */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#00f0ff]"></span>
                        商品图片 / Product Images
                    </label>

                    {/* Model Selection */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">
                           选择 AI 模型 / Select Model
                        </label>
                        <select
                           value={selectedModel}
                           onChange={(e) => setSelectedModel(e.target.value)}
                           className="w-full md:w-1/2 px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                        >
                           <option value="google">Google Gemini (Fast & Free)</option>
                           <option value="replicate" disabled>Flux.1 (High Quality) - Beta</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {manualData.images.map((file, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            <div className="relative aspect-square border border-[#00f0ff]/30 group bg-black/40">
                              <img 
                                src={typeof file === 'string' ? file : URL.createObjectURL(file)} 
                                alt={`Preview ${idx}`} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-[#00f0ff]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 transition-all h-[calc(100%-34px)] group relative overflow-hidden">
                          {isAnalyzingImage ? (
                             <div className="flex flex-col items-center animate-pulse">
                                <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin mb-2" />
                                <span className="text-xs text-[#00f0ff] uppercase tracking-wider font-bold">Analyzing...</span>
                             </div>
                          ) : (
                             <>
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[position_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none" />
                                <ImageIcon className="w-8 h-8 text-[#00f0ff]/50 mb-2 group-hover:scale-110 transition-transform group-hover:text-[#00f0ff]" />
                                <span className="text-xs text-[#94a3b8] group-hover:text-[#00f0ff] uppercase tracking-wider font-bold">Upload Scan</span>
                                <span className="text-[10px] text-gray-600 mt-1 font-mono">JPG/PNG/WEBP</span>
                             </>
                          )}
                          <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-8">
                    {/* Title and Specs Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-[#00f0ff]"></span>
                            商品标题 / Title
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                  value={targetLanguage}
                                  onChange={(e) => setTargetLanguage(e.target.value)}
                                  className="appearance-none pl-3 pr-7 py-1 text-xs font-medium border border-[#1e293b] text-[#94a3b8] bg-[#0b1120] hover:border-[#00f0ff] hover:text-[#00f0ff] focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                                >
                                  <option value="English">English</option>
                                  <option value="Japanese">Japanese</option>
                                  <option value="German">German</option>
                                  <option value="French">French</option>
                                  <option value="Spanish">Spanish</option>
                                  <option value="Chinese">Chinese</option>
                                  <option value="Korean">Korean</option>
                                  <option value="Portuguese">Portuguese</option>
                                  <option value="Italian">Italian</option>
                                  <option value="Russian">Russian</option>
                                  <option value="Arabic">Arabic</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                             </div>
                            <button
                              type="button"
                              onClick={handleTranslateTitle}
                              disabled={isTranslatingTitle || !manualData.title}
                              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all disabled:opacity-50 uppercase tracking-wider"
                            >
                              {isTranslatingTitle ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Languages className="w-3.5 h-3.5" />
                              )}
                              <span>翻译</span>
                            </button>
                            <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowManualTitleMenu(!showManualTitleMenu)}
                              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold border transition-all uppercase tracking-wider ${
                                showManualTitleMenu 
                                  ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10' 
                                  : 'border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10'
                              }`}
                            >
                              {isOptimizingManualTitle ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Wand2 className="w-3.5 h-3.5" />
                              )}
                              <span>一键优化</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${showManualTitleMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Title Optimize Menu */}
                            {showManualTitleMenu && (
                              <div className="absolute left-0 top-full mt-1 w-48 bg-[#111827] shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#00f0ff]/30 py-1 z-30 animate-fade-in overflow-hidden backdrop-blur-md">
                                 <div className="px-3 py-2 text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider bg-[#00f0ff]/5 border-b border-[#00f0ff]/10">
                                  SELECT PROTOCOL
                                </div>
                                {[
                                  { id: 'seo', label: 'SEO 关键词优化' },
                                  { id: 'concise', label: '简洁吸引人' },
                                  { id: 'detail', label: '详细参数型' },
                                  { id: 'emotional', label: '情感营销型' },
                                ].map((opt) => (
                                  <button
                                    type="button"
                                    key={opt.id}
                                    onClick={() => handleOptimizeTitle(opt.label)}
                                    className="w-full text-left px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#00f0ff]/10 hover:text-[#00f0ff] transition-colors border-b border-[#1e293b] last:border-0 font-mono"
                                  >
                                    {'>'} {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          </div>
                        </div>
                        <div className="relative mb-6 group">
                          <Type className="absolute left-0 top-1/2 transform -translate-y-1/2 text-[#00f0ff]/50 w-4 h-4 group-focus-within:text-[#00f0ff] transition-colors" />
                          <input
                            type="text"
                            value={manualData.title}
                            onChange={(e) => setManualData({...manualData, title: e.target.value})}
                            className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] placeholder-[#475569] rounded-none transition-all font-mono"
                            placeholder="INPUT_PRODUCT_TITLE_HERE..."
                          />
                          {isOptimizingManualTitle && (
                            <div className="absolute inset-0 bg-[#0b1120]/80 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <span className="text-xs font-bold text-[#00f0ff] flex items-center gap-1.5 px-3 py-1.5 border border-[#00f0ff] bg-[#00f0ff]/10 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                PROCESSING...
                              </span>
                            </div>
                          )}
                        </div>

                        {manualData.translatedTitle && (
                          <div className="p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex items-start gap-3 animate-fade-in relative">
                             <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#00f0ff]/20 text-[#00f0ff] text-[10px] font-bold uppercase tracking-wider">Translated</div>
                             <Languages className="w-4 h-4 text-[#00f0ff] mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="text-sm text-[#e2e8f0] font-mono leading-relaxed">{manualData.translatedTitle}</p>
                             </div>
                          </div>
                        )}
                      </div>


                    </div>
                  </div>


              </form>
              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>
          </div>
          
          {/* Result Section (Only for Product Optimization) */}
          {result && (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] animate-fade-in relative mt-8">
               <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>

              {/* Result Header */}
              <div className="p-6 border-b border-[#00f0ff]/20 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] tracking-widest uppercase">Optimization Result</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyJSON}
                    className="flex items-center px-4 py-2 text-xs font-bold text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-[#1e293b] hover:border-[#00f0ff] transition-colors uppercase tracking-wider rounded-none"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    COPY JSON
                  </button>
                  <button 
                    onClick={handleSaveToLocal}
                    className="flex items-center px-4 py-2 text-xs font-bold text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-[#00f0ff] transition-colors uppercase tracking-wider rounded-none shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    SAVE TO LOCAL
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Title Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">标题 / Title</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="relative group">
                        <p className="text-lg text-[#e2e8f0] p-4 bg-[#0b1120] border border-[#1e293b] font-mono leading-relaxed relative">
                           <span className="absolute top-0 left-0 w-1 h-full bg-[#00f0ff]"></span>
                           {result.title}
                        </p>
                    </div>
                    {result.translatedTitle && (
                        <div className="relative group">
                            <div className="absolute left-4 top-4 text-[#00f0ff]">
                                <Languages className="w-4 h-4" />
                            </div>
                            <p className="text-lg text-[#e2e8f0] p-4 pl-12 bg-[#0b1120] border border-[#00f0ff]/30 font-mono leading-relaxed relative">
                            {result.translatedTitle}
                            </p>
                        </div>
                    )}
                  </div>
                </div>

                {/* Images Section */}
                <div className="mb-8">
                  {/* AI Prompt Log Display */}
                  {debugPrompt && (
                    <div className="mb-8 bg-[#0b1120] border border-[#00f0ff]/30 relative animate-fade-in">
                        <div className="absolute top-0 left-0 bg-[#00f0ff]/20 text-[#00f0ff] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border-r border-b border-[#00f0ff]/30">
                            AI Reasoning / Prompt Log
                        </div>
                        <div className="p-4 pt-6 font-mono text-xs text-[#00f0ff]/80 leading-relaxed whitespace-pre-wrap break-words">
                            {debugPrompt}
                        </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">图片 / Images</h3>
                  </div>
                  <div className="flex gap-4 flex-wrap pb-4">
                    {result.images.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 flex flex-col gap-2 w-32">
                        <div className="w-32 h-32 aspect-square bg-[#0b1120] border border-[#1e293b] relative group">
                           <div className="absolute top-0 left-0 w-1 h-1 bg-[#00f0ff]"></div>
                           <div className="absolute bottom-0 right-0 w-1 h-1 bg-[#00f0ff]"></div>
                          <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-[#0b1120]/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(img, idx);
                              }}
                              className="p-2 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#0b1120] transition-colors rounded-none"
                              title="DOWNLOAD"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Info Section */}
                <div className="pt-6 border-t border-[#1e293b]">
                  <div className="bg-[#0b1120] border border-[#1e293b] p-6 relative">
                    <h4 className="text-xs font-bold text-[#00f0ff] mb-4 uppercase tracking-wider">规格参数 / Specs</h4>
                    <div className="grid grid-cols-2 gap-y-4 text-sm font-mono">
                      {Object.entries(result.specs).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <span className="text-[#94a3b8] uppercase tracking-wider">{key}</span>
                          <span className="text-[#e2e8f0] font-bold">{value}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#1e293b]">
                  <button 
                    onClick={handleSaveToLocal}
                    className="w-full py-4 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors flex items-center justify-center clip-path-polygon uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    SAVE_DATA_TO_LOCAL_DRIVE
                  </button>
                </div>
              </div>
            </div>
          )}
          </>

          ) : activeModule === 'image-tools' ? (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden mb-8 animate-fade-in relative">
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>
              <div className="p-8">
                <div className="space-y-8">
                    {/* Mode Selection */}
                    <div className="flex gap-4 border-b border-[#1e293b] pb-6">
                      <button
                        onClick={() => setImageToolMode('white-bg')}
                        className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all clip-path-polygon ${
                          imageToolMode === 'white-bg'
                            ? 'bg-[#00f0ff] text-[#0b1120] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'bg-transparent text-[#94a3b8] border border-[#1e293b] hover:text-[#00f0ff] hover:border-[#00f0ff]'
                        }`}
                      >
                        一键白底 (White Background)
                      </button>
                      <button
                        onClick={() => setImageToolMode('watermark-remove')}
                        className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all clip-path-polygon ${
                          imageToolMode === 'watermark-remove'
                            ? 'bg-[#00f0ff] text-[#0b1120] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'bg-transparent text-[#94a3b8] border border-[#1e293b] hover:text-[#00f0ff] hover:border-[#00f0ff]'
                        }`}
                      >
                        去水印 (Remove Watermark)
                      </button>
                    </div>

                    {imageToolResults.length === 0 ? (
                        <>
                            {/* Upload Area */}
                            <div>
                                <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-[#00f0ff]"></span>
                                    上传图片 (Upload Images)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {imageToolImages.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square border border-[#00f0ff]/30 group bg-black/40">
                                            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#00f0ff]/50"></div>
                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#00f0ff]/50"></div>
                                            <img 
                                                src={URL.createObjectURL(file)} 
                                                alt={`Upload ${idx}`} 
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <button
                                                onClick={() => setImageToolImages(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 p-1 bg-black/50 text-[#ff2a6d] border border-[#ff2a6d]/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff2a6d]/20 z-10 rounded-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square border-2 border-dashed border-[#00f0ff]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 transition-all group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[position_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none" />
                                        <ImageIcon className="w-8 h-8 text-[#00f0ff]/50 mb-2 group-hover:scale-110 transition-transform group-hover:text-[#00f0ff]" />
                                        <span className="text-xs text-[#94a3b8] group-hover:text-[#00f0ff] uppercase tracking-wider font-bold">Upload Scan</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageToolFileChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-[#1e293b]">
                                <button
                                    onClick={handleImageToolsSubmit}
                                    disabled={isProcessingImages || imageToolImages.length === 0}
                                    className="px-8 py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon uppercase tracking-widest"
                                >
                                    {isProcessingImages ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            PROCESSING...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            EXECUTE_PROTOCOL
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/20 pb-4">
                                <h3 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] uppercase tracking-wider">Processing Result</h3>
                                <button
                                    onClick={() => {
                                        setImageToolResults([]);
                                        setImageToolImages([]);
                                    }}
                                    className="text-xs text-[#94a3b8] hover:text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#1e293b] px-3 py-1 hover:border-[#00f0ff] transition-colors"
                                >
                                    RESET_MODULE
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {imageToolResults.map((res, idx) => (
                                    <div key={idx} className="bg-[#0b1120] p-4 border border-[#1e293b] relative group">
                                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff]"></div>
                                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff]"></div>
                                        
                                        <div className="flex gap-4 mb-4">
                                            <div className="flex-1 space-y-2">
                                                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Original</span>
                                                <div className="aspect-square border border-[#1e293b] bg-black/50 p-2">
                                                    <img src={res.original} className="w-full h-full object-contain" alt="Original" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <span className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider">Processed</span>
                                                <div className="aspect-square border border-[#00f0ff]/30 bg-black/50 p-2 relative">
                                                    <img src={res.processed} className="w-full h-full object-contain relative z-10" alt="Processed" />
                                                    {/* Checkered background for transparency */}
                                                    <div className="absolute inset-0 z-0 opacity-10" style={{
                                                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                                        backgroundSize: '20px 20px',
                                                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDownloadImage(res.processed, idx)}
                                            className="w-full py-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#0b1120] transition-colors text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wider"
                                        >
                                            <Download className="w-4 h-4" />
                                            DOWNLOAD_OUTPUT
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>
          ) : activeModule === 'competitor-analysis' ? (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden mb-8 animate-fade-in relative">
               <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>
              <div className="p-8">
                {!competitorResult ? (
                  <>
                    <div className="flex justify-between items-center mb-8 border-b border-[#1e293b] pb-6">
                       <p className="text-sm text-[#94a3b8] font-mono">
                         // SYSTEM_READY: Awaiting competitor data input for analysis...
                       </p>
                       <button
                          onClick={handleSmartPaste}
                          className="text-xs text-[#00f0ff] hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 border border-[#00f0ff]/30 px-3 py-1 hover:bg-[#00f0ff]/10 transition-colors"
                       >
                          <Copy className="w-3 h-3" />
                          SMART_PASTE_CLIPBOARD
                       </button>
                    </div>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1 h-3 bg-[#00f0ff]"></span>
                            竞品标题 (Title)
                        </label>
                        <textarea
                          value={competitorData.title}
                          onChange={(e) => setCompetitorData({...competitorData, title: e.target.value})}
                          className="w-full px-4 py-3 bg-transparent border-b border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] placeholder-[#475569] rounded-none transition-all font-mono text-sm"
                          placeholder="INPUT_COMPETITOR_TITLE..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1 h-3 bg-[#00f0ff]"></span>
                            五点描述 (Bullet Points)
                        </label>
                        {competitorData.bullets.map((bullet, index) => (
                          <div key={index} className="relative group">
                            <span className="absolute left-0 top-3 text-[#00f0ff]/50 text-xs font-mono font-bold">0{index + 1}</span>
                            <textarea
                              value={bullet}
                              onChange={(e) => {
                                const newBullets = [...competitorData.bullets];
                                newBullets[index] = e.target.value;
                                setCompetitorData({...competitorData, bullets: newBullets});
                              }}
                              className="w-full pl-8 pr-4 py-2.5 bg-transparent border-b border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] placeholder-[#475569] rounded-none transition-all font-mono text-sm"
                              placeholder={`INPUT_BULLET_POINT_0${index + 1}...`}
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-6 border-t border-[#1e293b]">
                        <button
                          onClick={handleCompetitorSubmit}
                          disabled={isAnalyzingCompetitor || !competitorData.title}
                          className="px-8 py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon uppercase tracking-widest"
                        >
                          {isAnalyzingCompetitor ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ANALYZING_DATA...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              INITIATE_ANALYSIS
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/20 pb-4">
                      <h3 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] uppercase tracking-wider">Analysis Report</h3>
                      <button
                        onClick={() => setCompetitorResult(null)}
                        className="text-xs text-[#94a3b8] hover:text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#1e293b] px-3 py-1 hover:border-[#00f0ff] transition-colors"
                      >
                        RESET_ANALYSIS
                      </button>
                    </div>

                    <div className="flex items-center gap-6 p-6 bg-[#00f0ff]/5 border border-[#00f0ff]/20 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#00f0ff]"></div>
                      <div className="text-center min-w-[120px]">
                        <div className="text-5xl font-black text-[#00f0ff] font-['Orbitron'] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{competitorResult.score}</div>
                        <div className="text-[10px] text-[#00f0ff]/70 font-bold uppercase tracking-[0.2em] mt-2">Listing Quality Score</div>
                      </div>
                      <div className="w-px h-16 bg-[#00f0ff]/20"></div>
                      <div className="flex-1">
                         <h4 className="text-xs font-bold text-[#e2e8f0] mb-3 uppercase tracking-wider">Detected Keywords</h4>
                         <div className="flex flex-wrap gap-2">
                            {competitorResult.keywords.map((kw, i) => (
                              <span key={i} className="px-3 py-1 bg-[#0b1120] text-[#00f0ff] text-xs font-mono border border-[#00f0ff]/30 hover:border-[#00f0ff] transition-colors">{kw}</span>
                            ))}
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-green-400 flex items-center gap-2 uppercase tracking-wider border-b border-green-500/20 pb-2">
                          <Check className="w-4 h-4" />
                          Pros / Advantages
                        </h4>
                        <ul className="space-y-3">
                          {competitorResult.pros.map((item, i) => (
                            <li key={i} className="text-sm text-[#94a3b8] flex items-start gap-3 group">
                              <span className="w-1.5 h-1.5 bg-green-500 mt-2 flex-shrink-0 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                              <span className="font-mono group-hover:text-[#e2e8f0] transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-[#ff2a6d] flex items-center gap-2 uppercase tracking-wider border-b border-[#ff2a6d]/20 pb-2">
                          <X className="w-4 h-4" />
                          Cons / Weaknesses
                        </h4>
                        <ul className="space-y-3">
                          {competitorResult.cons.map((item, i) => (
                            <li key={i} className="text-sm text-[#94a3b8] flex items-start gap-3 group">
                              <span className="w-1.5 h-1.5 bg-[#ff2a6d] mt-2 flex-shrink-0 shadow-[0_0_5px_rgba(255,42,109,0.5)]"></span>
                              <span className="font-mono group-hover:text-[#e2e8f0] transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 relative">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500/50"></div>
                      <h4 className="text-xs font-bold text-yellow-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Wand2 className="w-4 h-4" />
                        Optimization Suggestions
                      </h4>
                      <ul className="space-y-3">
                        {competitorResult.suggestions.map((item, i) => (
                           <li key={i} className="text-sm text-[#e2e8f0] flex items-start gap-3 font-mono">
                              <span className="w-5 h-5 bg-transparent text-yellow-500 border border-yellow-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i+1}</span>
                              <span className="mt-0.5">{item}</span>
                           </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeModule === 'review-summary' ? (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden mb-8 animate-fade-in relative">
               <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>
              <div className="p-8">
                {!reviewResult ? (
                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#00f0ff]"></span>
                        评论内容 (Review Text)
                      </label>
                      <textarea
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        className="w-full px-4 py-3 bg-transparent border-b border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] placeholder-[#475569] rounded-none transition-all font-mono text-sm min-h-[300px]"
                        placeholder="PASTE_REVIEW_DATA_BATCH..."
                      />
                      <p className="text-[10px] text-[#94a3b8] mt-2 text-right font-mono uppercase tracking-wider">
                        // Recommendation: &gt;20 samples for optimal analysis
                      </p>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-[#1e293b]">
                      <button
                        onClick={handleReviewSubmit}
                        disabled={isAnalyzingReviews || !reviewInput.trim()}
                        className="px-8 py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon uppercase tracking-widest"
                      >
                        {isAnalyzingReviews ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ANALYZING...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            INITIATE_ANALYSIS
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/20 pb-4">
                      <h3 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] uppercase tracking-wider">Review Analysis</h3>
                      <button
                        onClick={() => setReviewResult(null)}
                        className="text-xs text-[#94a3b8] hover:text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#1e293b] px-3 py-1 hover:border-[#00f0ff] transition-colors"
                      >
                        RESET_MODULE
                      </button>
                    </div>

                    {/* Pain Points */}
                    <div className="bg-[#0b1120] p-6 border border-[#ff2a6d]/30 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#ff2a6d]/50"></div>
                      <h4 className="text-xs font-bold text-[#ff2a6d] mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <X className="w-4 h-4" />
                        Critical Pain Points
                      </h4>
                      <ul className="space-y-4">
                        {reviewResult.painPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-3 group">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#ff2a6d]/10 text-[#ff2a6d] border border-[#ff2a6d] flex items-center justify-center text-[10px] font-bold font-mono group-hover:bg-[#ff2a6d] group-hover:text-[#0b1120] transition-colors">
                              0{index + 1}
                            </span>
                            <span className="text-[#e2e8f0] text-sm font-mono pt-0.5">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* User Persona */}
                    <div className="bg-[#0b1120] p-6 border border-[#00f0ff]/30 relative">
                       <div className="absolute top-0 right-0 w-1 h-full bg-[#00f0ff]/50"></div>
                      <h4 className="text-xs font-bold text-[#00f0ff] mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Check className="w-4 h-4" />
                        User Persona Profile
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#111827] p-4 border border-[#1e293b] hover:border-[#00f0ff] transition-colors group">
                          <span className="text-[10px] font-bold text-[#00f0ff]/70 uppercase tracking-widest block mb-2 group-hover:text-[#00f0ff]">Usage Scenario</span>
                          <p className="text-[#e2e8f0] font-mono text-sm leading-relaxed">{reviewResult.userPersona.usage}</p>
                        </div>
                        <div className="bg-[#111827] p-4 border border-[#1e293b] hover:border-[#00f0ff] transition-colors group">
                          <span className="text-[10px] font-bold text-[#00f0ff]/70 uppercase tracking-widest block mb-2 group-hover:text-[#00f0ff]">Demographics</span>
                          <p className="text-[#e2e8f0] font-mono text-sm leading-relaxed">{reviewResult.userPersona.demographics}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeModule === 'video-creation' ? (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden mb-8 animate-fade-in relative">
               <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>
              <div className="p-8">
                {!videoResult ? (
                  <div className="space-y-8">
                    {/* Mode Selection */}
                    <div className="flex gap-4 border-b border-[#1e293b] pb-6">
                      <button
                        onClick={() => setVideoSettings(prev => ({ ...prev, mode: 'text-to-video' }))}
                        className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all clip-path-polygon ${
                          videoSettings.mode === 'text-to-video'
                            ? 'bg-[#00f0ff] text-[#0b1120] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'bg-transparent text-[#94a3b8] border border-[#1e293b] hover:text-[#00f0ff] hover:border-[#00f0ff]'
                        }`}
                      >
                        文生视频 (Text to Video)
                      </button>
                      <button
                        onClick={() => setVideoSettings(prev => ({ ...prev, mode: 'image-to-video' }))}
                        className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all clip-path-polygon ${
                          videoSettings.mode === 'image-to-video'
                            ? 'bg-[#00f0ff] text-[#0b1120] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'bg-transparent text-[#94a3b8] border border-[#1e293b] hover:text-[#00f0ff] hover:border-[#00f0ff]'
                        }`}
                      >
                        图生视频 (Image to Video)
                      </button>
                    </div>

                    {/* Prompt Input */}
                    <div>
                      <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#00f0ff]"></span>
                        提示词 (Prompt) <span className="text-[#ff2a6d]">*</span>
                      </label>
                      <textarea
                        value={videoSettings.prompt}
                        onChange={(e) => setVideoSettings(prev => ({ ...prev, prompt: e.target.value }))}
                        className="w-full px-4 py-3 bg-transparent border-b border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] placeholder-[#475569] rounded-none transition-all font-mono text-sm"
                        placeholder={videoSettings.mode === 'text-to-video' 
                          ? "INPUT_SCENE_DESCRIPTION..." 
                          : "INPUT_MOTION_DESCRIPTION..."}
                        rows={4}
                      />
                    </div>

                    {/* Image Upload (Only for Image to Video) */}
                    {videoSettings.mode === 'image-to-video' && (
                      <div>
                        <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1 h-3 bg-[#00f0ff]"></span>
                            参考图 (Reference Image) <span className="text-[#ff2a6d]">*</span>
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-[#00f0ff]/30 cursor-pointer hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 transition-all group relative overflow-hidden">
                             <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[position_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none" />
                            {videoSettings.image ? (
                              <img 
                                src={URL.createObjectURL(videoSettings.image)} 
                                alt="Preview" 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                              />
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8 text-[#00f0ff]/50 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold group-hover:text-[#00f0ff]">Upload</span>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={handleVideoFileChange} className="hidden" />
                          </label>
                          {videoSettings.image && (
                            <button
                              onClick={() => setVideoSettings(prev => ({ ...prev, image: null }))}
                              className="text-xs text-[#ff2a6d] hover:text-[#ff2a6d]/80 uppercase tracking-wider border border-[#ff2a6d]/30 px-3 py-1 hover:bg-[#ff2a6d]/10 transition-colors"
                            >
                              DELETE_SOURCE
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                      <div>
                         <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">模型 (Model)</label>
                         <select
                            value={videoSettings.model}
                            onChange={(e) => setVideoSettings({...videoSettings, model: e.target.value})}
                            className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                         >
                            <option value="sora-2">Sora 2 (Standard)</option>
                            <option value="veo3.1">Veo 3.1 (Standard)</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">风格 (Style)</label>
                         <select
                            value={videoSettings.style}
                            onChange={(e) => setVideoSettings({...videoSettings, style: e.target.value})}
                            className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                         >
                            <option>Fast Paced / 快节奏</option>
                            <option>Elegant / 优雅展示</option>
                            <option>Cinematic / 电影感</option>
                            <option>3D Render / 3D渲染</option>
                            <option>Anime / 动漫风格</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">时长 (Duration)</label>
                         <select
                            value={videoSettings.duration}
                            onChange={(e) => setVideoSettings({...videoSettings, duration: e.target.value})}
                            className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                         >
                            <option>5s</option>
                            <option>10s</option>
                            <option>15s</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">比例 (Ratio)</label>
                         <select
                             value={videoSettings.ratio}
                             onChange={(e) => setVideoSettings({...videoSettings, ratio: e.target.value})}
                             className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                          >
                             <option>9:16 (竖屏)</option>
                             <option>16:9 (横屏)</option>
                          </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">背景音乐 (Music)</label>
                         <select
                            value={videoSettings.music}
                            onChange={(e) => setVideoSettings({...videoSettings, music: e.target.value})}
                            className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                         >
                            <option>Upbeat / 欢快</option>
                            <option>Relaxing / 轻松</option>
                            <option>Corporate / 商务</option>
                            <option>No Music / 无音乐</option>
                         </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-[#1e293b]">
                      <button
                        onClick={handleVideoSubmit}
                        disabled={isGeneratingVideo}
                        className="px-8 py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon uppercase tracking-widest"
                      >
                        {isGeneratingVideo ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            GENERATING...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            INITIATE_GENERATION
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/20 pb-4">
                      <h3 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] uppercase tracking-wider">Generation Complete</h3>
                      <button
                        onClick={() => setVideoResult(null)}
                        className="text-xs text-[#94a3b8] hover:text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#1e293b] px-3 py-1 hover:border-[#00f0ff] transition-colors"
                      >
                        BACK_TO_EDIT
                      </button>
                    </div>

                    <div className="relative aspect-video bg-black border border-[#00f0ff]/30 group overflow-hidden">
                       <img src={videoResult.thumbnail} className="w-full h-full object-cover opacity-80" alt="Video Thumbnail" />
                       <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,240,255,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <button className="w-16 h-16 bg-[#00f0ff]/20 backdrop-blur-sm border border-[#00f0ff] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon">
                             <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-[#00f0ff] border-b-[10px] border-b-transparent ml-1"></div>
                          </button>
                       </div>
                       <div className="absolute bottom-4 right-4 bg-black/80 border border-[#00f0ff]/50 text-[#00f0ff] text-[10px] px-2 py-1 font-mono uppercase tracking-wider">
                          DURATION: {videoResult.duration}
                       </div>
                    </div>

                    <div className="flex justify-end gap-4">
                       <button className="px-6 py-2 border border-[#1e293b] text-[#94a3b8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-colors font-bold text-xs uppercase tracking-wider">
                          SAVE_TO_PROJECT
                       </button>
                       <button className="px-6 py-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#0b1120] transition-colors font-bold text-xs flex items-center gap-2 uppercase tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                          <Download className="w-4 h-4" />
                          DOWNLOAD_VIDEO
                       </button>
                    </div>
                  </div>
                )}

                {/* Task History Log */}
                <div className="mt-8 pt-6 border-t border-[#1e293b]">
                    <div className="flex items-center gap-2 mb-4">
                         <h3 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">Generation History</h3>
                         <div className="h-px bg-[#1e293b] flex-1" />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00f0ff]/20 scrollbar-track-transparent">
                        {videoHistory.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-[#0b1120] border border-[#1e293b] hover:border-[#00f0ff]/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-[#94a3b8] font-mono">{task.time}</span>
                                    <div className="flex items-center gap-2">
                                        {task.thumbnail && !task.thumbnail.includes('via.placeholder') && (
                                             <img src={task.thumbnail} className="w-8 h-8 object-cover border border-[#1e293b]" alt="thumb" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        )}
                                        <span className="text-xs text-[#e2e8f0] font-mono truncate max-w-[300px]" title={task.prompt}>{task.prompt}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-[10px] border uppercase tracking-wider font-bold ${
                                        task.status === 'completed' ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30' : 
                                        task.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                    }`}>
                                        {task.status === 'processing' ? 'PROCESSING' : task.status}
                                    </span>
                                    <span className="text-[10px] text-[#94a3b8] font-mono">{task.duration}</span>
                                    {task.status === 'completed' && task.videoUrl && (
                                        <a 
                                            href={task.videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-2 py-0.5 text-[10px] bg-[#00f0ff] text-[#0b1120] border border-[#00f0ff] uppercase tracking-wider font-bold hover:bg-[#00f0ff]/80 transition-colors flex items-center gap-1"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        {videoHistory.length === 0 && (
                            <div className="text-center py-4 text-[#94a3b8] text-xs font-mono">
                                NO_HISTORY_RECORDS_FOUND
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ) : activeModule === 'social-copy' ? (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden mb-8 animate-fade-in relative">
               <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>
              <div className="p-8">
                {!socialResult ? (
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                           <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">发布平台 (Platform)</label>
                           <select
                              value={socialSettings.platform}
                              onChange={(e) => setSocialSettings({...socialSettings, platform: e.target.value})}
                              className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                           >
                              <option>Instagram</option>
                              <option>TikTok</option>
                              <option>Facebook</option>
                              <option>Twitter / X</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">语气风格 (Tone)</label>
                           <select
                              value={socialSettings.tone}
                              onChange={(e) => setSocialSettings({...socialSettings, tone: e.target.value})}
                              className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                           >
                              <option>Professional / 专业</option>
                              <option>Fun & Energetic / 有趣活力</option>
                              <option>Urgent / 限时促销</option>
                              <option>Storytelling / 故事感</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">语言 (Language)</label>
                           <select
                              value={socialSettings.language}
                              onChange={(e) => setSocialSettings({...socialSettings, language: e.target.value})}
                              className="w-full px-4 py-2 bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] rounded-none uppercase tracking-wider text-sm"
                           >
                              <option>English</option>
                              <option>Spanish</option>
                              <option>Portuguese</option>
                              <option>Japanese</option>
                           </select>
                        </div>
                     </div>

                     <div className="flex justify-end pt-6 border-t border-[#1e293b]">
                        <button
                           onClick={handleSocialSubmit}
                           disabled={isGeneratingSocial}
                           className="px-8 py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon uppercase tracking-widest"
                        >
                           {isGeneratingSocial ? (
                              <>
                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                 GENERATING_COPY...
                              </>
                           ) : (
                              <>
                                 <Wand2 className="w-4 h-4 mr-2" />
                                 INITIATE_GENERATION
                              </>
                           )}
                        </button>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                     <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/20 pb-4">
                        <h3 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] uppercase tracking-wider">Generated Copy</h3>
                        <button
                           onClick={() => setSocialResult(null)}
                           className="text-xs text-[#94a3b8] hover:text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#1e293b] px-3 py-1 hover:border-[#00f0ff] transition-colors"
                        >
                           BACK_TO_EDIT
                        </button>
                     </div>

                     <div className="bg-[#0b1120] p-6 border border-[#1e293b] relative group relative">
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#00f0ff]"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#00f0ff]"></div>
                        <textarea
                           className="w-full bg-transparent border-none resize-none focus:ring-0 text-[#e2e8f0] text-sm leading-relaxed font-mono"
                           rows={8}
                           value={socialResult}
                           readOnly
                        />
                        <button 
                           onClick={() => navigator.clipboard.writeText(socialResult || '')}
                           className="absolute top-4 right-4 p-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#0b1120] transition-colors rounded-none shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                           title="COPY_TEXT"
                        >
                           <Copy className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeModule === 'viral-video-remake' ? (
            <div className="flex flex-col gap-6 h-[850px]">
                {/* Main Content Area - Split View */}
                <div className="flex gap-6 flex-1 min-h-0">
                    
                    {/* Left Panel - Configuration */}
                    <div className="w-[400px] flex-shrink-0 bg-[#111827]/80 backdrop-blur-md border-r border-[#00f0ff]/30 p-5 flex flex-col gap-5 text-[#e2e8f0] overflow-y-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] scrollbar-thin scrollbar-thumb-[#00f0ff]/20 scrollbar-track-transparent">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Video className="w-5 h-5 text-[#00f0ff]" />
                                <span className="font-bold text-lg font-['Orbitron'] tracking-wider">爆款复刻</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#94a3b8] uppercase tracking-wider">二次确认</span>
                                <div 
                                    className={`w-10 h-5 rounded-none border border-[#00f0ff]/50 relative cursor-pointer transition-colors ${viralSettings.confirmMode ? 'bg-[#00f0ff]/20' : 'bg-transparent'}`}
                                    onClick={() => setViralSettings(prev => ({ ...prev, confirmMode: !prev.confirmMode }))}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-[#00f0ff] transition-all ${viralSettings.confirmMode ? 'left-6' : 'left-0.5'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Tag */}
                        <div>
                            <span className="px-3 py-1 bg-[#00f0ff]/10 text-[#00f0ff] text-[10px] font-bold border border-[#00f0ff]/30 uppercase tracking-wider clip-path-polygon">电商模式</span>
                        </div>

                        {/* Video Source Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">源视频 (&lt;30秒)</span>
                                <div className="flex bg-[#0b1120] border border-[#1e293b]">
                                    <button 
                                        onClick={() => setViralSettings(prev => ({...prev, videoSourceType: 'local'}))}
                                        className={`px-3 py-1 text-[10px] transition-all uppercase tracking-wider font-bold ${viralSettings.videoSourceType === 'local' ? 'bg-[#00f0ff] text-[#0b1120]' : 'text-[#94a3b8] hover:text-[#e2e8f0]'}`}
                                    >
                                        本地上传
                                    </button>
                                    <button 
                                        onClick={() => setViralSettings(prev => ({...prev, videoSourceType: 'url'}))}
                                        className={`px-3 py-1 text-[10px] transition-all uppercase tracking-wider font-bold ${viralSettings.videoSourceType === 'url' ? 'bg-[#00f0ff] text-[#0b1120]' : 'text-[#94a3b8] hover:text-[#e2e8f0]'}`}
                                    >
                                        链接提取
                                    </button>
                                </div>
                            </div>
                            
                            <div className="relative aspect-video bg-black border border-[#1e293b] group overflow-hidden">
                                {viralSettings.videoFile ? (
                                    <video src={URL.createObjectURL(viralSettings.videoFile)} className="w-full h-full object-cover" controls />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#94a3b8]">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[position_3s_linear_infinite] opacity-30 pointer-events-none" />
                                        <Play className="w-8 h-8 mb-2 opacity-50 text-[#00f0ff]" />
                                        <span className="text-[10px] uppercase tracking-wider font-bold">
                                            {viralSettings.videoSourceType === 'local' ? '点击上传视频文件' : '输入视频链接'}
                                        </span>
                                        {viralSettings.videoSourceType === 'local' && (
                                            <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                                                if(e.target.files?.[0]) setViralSettings(prev => ({...prev, videoFile: e.target.files![0]}))
                                            }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reference Image Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">参考图片</span>
                                <div className="flex bg-[#0b1120] border border-[#1e293b]">
                                     {[
                                         { key: 'local', label: '本地' }, 
                                         { key: 'album', label: '相册' }, 
                                         { key: 'url', label: '链接' }
                                     ].map(type => (
                                         <button 
                                            key={type.key}
                                            onClick={() => setViralSettings(prev => ({...prev, imageSourceType: type.key as any}))}
                                            className={`px-2 py-1 text-[10px] transition-all uppercase tracking-wider font-bold ${viralSettings.imageSourceType === type.key ? 'bg-[#00f0ff] text-[#0b1120]' : 'text-[#94a3b8] hover:text-[#e2e8f0]'}`}
                                        >
                                            {type.label}
                                        </button>
                                     ))}
                                </div>
                            </div>
                            <div className="w-24 h-24 bg-black border border-[#1e293b] relative flex-shrink-0 group overflow-hidden">
                                {viralSettings.referenceImages.length > 0 ? (
                                    <>
                                      <img src={URL.createObjectURL(viralSettings.referenceImages[0])} className="w-full h-full object-cover" alt="ref" />
                                      {viralSettings.referenceImages.length > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/70 border border-[#00f0ff]/40 text-[#00f0ff] text-[10px] px-1 font-mono">
                                          +{viralSettings.referenceImages.length - 1}
                                        </div>
                                      )}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-[#00f0ff]/50 group-hover:text-[#00f0ff] transition-colors" />
                                        {viralSettings.imageSourceType === 'local' && (
                                            <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                                                if(e.target.files && e.target.files.length > 0) {
                                                  setViralSettings(prev => ({...prev, referenceImages: [...prev.referenceImages, ...Array.from(e.target.files!)]}))
                                                }
                                            }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-2">
                             <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">复刻要求描述</span>
                             <textarea 
                                value={viralSettings.description}
                                onChange={(e) => setViralSettings(prev => ({...prev, description: e.target.value}))}
                                className="w-full bg-[#0b1120] border border-[#1e293b] focus:border-[#00f0ff] text-xs text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:ring-0 transition-colors resize-none h-20 font-mono p-3"
                                placeholder="请输入具体的复刻要求..."
                             />
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider">时长</label>
                                <select 
                                    value={viralSettings.duration}
                                    onChange={(e) => setViralSettings(prev => ({...prev, duration: e.target.value}))}
                                    className="w-full bg-[#0b1120] border border-[#1e293b] text-xs text-[#e2e8f0] focus:border-[#00f0ff] focus:ring-0 rounded-none px-2 py-1.5"
                                >
                                    <option>8s (Veo3.1)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider">语言</label>
                                <select 
                                    value={viralSettings.language}
                                    onChange={(e) => setViralSettings(prev => ({...prev, language: e.target.value}))}
                                    className="w-full bg-[#0b1120] border border-[#1e293b] text-xs text-[#e2e8f0] focus:border-[#00f0ff] focus:ring-0 rounded-none px-2 py-1.5"
                                >
                                    <option>Chinese</option>
                                    <option>English</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider">画面比例</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setViralSettings(prev => ({...prev, ratio: '9:16'}))}
                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 border text-[10px] transition-all font-bold uppercase tracking-wider ${viralSettings.ratio === '9:16' ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]' : 'border-[#1e293b] text-[#94a3b8] hover:border-[#00f0ff]/50'}`}
                                >
                                    <Smartphone className="w-3 h-3" />
                                    9:16
                                </button>
                                <button 
                                    onClick={() => setViralSettings(prev => ({...prev, ratio: '16:9'}))}
                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 border text-[10px] transition-all font-bold uppercase tracking-wider ${viralSettings.ratio === '16:9' ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]' : 'border-[#1e293b] text-[#94a3b8] hover:border-[#00f0ff]/50'}`}
                                >
                                    <Monitor className="w-3 h-3" />
                                    16:9
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleViralAnalyze}
                            disabled={isAnalyzingViral}
                            className="w-full py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center gap-2 mt-auto clip-path-polygon uppercase tracking-widest"
                        >
                            {isAnalyzingViral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            重新分析
                        </button>
                    </div>

                    {/* Right Panel - Result */}
                    <div className="flex-1 bg-[#111827]/80 backdrop-blur-md border border-[#00f0ff]/30 p-6 text-[#e2e8f0] flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)] relative">
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff]"></div>
                        <div className="flex items-center justify-between mb-6 border-b border-[#00f0ff]/20 pb-4">
                            <h2 className="text-xl font-bold font-['Orbitron'] tracking-widest text-[#00f0ff] uppercase">脚本确认</h2>
                            <span className="text-xs text-[#94a3b8] font-mono uppercase tracking-wider">审核并执行</span>
                        </div>

                        {/* Script Content */}
                        <div className="flex-1 bg-[#0b1120] p-6 overflow-y-auto border border-[#1e293b] mb-6 scrollbar-thin scrollbar-thumb-[#00f0ff]/20 scrollbar-track-transparent font-mono">
                            {isAnalyzingViral ? (
                                <div className="h-full flex flex-col items-center justify-center text-[#94a3b8] gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
                                    <p className="uppercase tracking-wider text-xs">正在分析视频结构...</p>
                                </div>
                            ) : viralResult ? (
                                <div className="h-full">
                                    <textarea 
                                        value={viralResult.script}
                                        onChange={(e) => setViralResult({...viralResult, script: e.target.value})}
                                        className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-[#e2e8f0] font-mono leading-relaxed p-0 whitespace-pre-wrap"
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#94a3b8] gap-4">
                                    <FileText className="w-12 h-12 opacity-20" />
                                    <p className="uppercase tracking-wider text-xs">请上传视频以开始分析</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4">
                            <button className="px-6 py-2.5 border border-[#1e293b] text-[#94a3b8] font-bold hover:text-[#00f0ff] hover:border-[#00f0ff] transition-colors text-xs uppercase tracking-wider">
                                修改参数
                            </button>
                            <button 
                                onClick={handleViralGenerate}
                                disabled={!viralResult || isGeneratingViralVideo || isAnalyzingViral}
                                className="px-8 py-2.5 bg-[#00f0ff] text-[#0b1120] font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed clip-path-polygon uppercase tracking-widest"
                            >
                                {isGeneratingViralVideo ? '生成中...' : '生成成片'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Panel - Task History */}
                <div className="bg-[#111827]/80 backdrop-blur-md rounded-none p-4 border border-[#1e293b] flex-shrink-0 h-48 flex flex-col relative">
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#00f0ff]"></div>
                    <div className="flex items-center gap-2 mb-3">
                         <h3 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">任务历史</h3>
                         <div className="h-px bg-[#1e293b] flex-1" />
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00f0ff]/20 scrollbar-track-transparent space-y-2">
                        {viralHistory.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-[#0b1120] border border-[#1e293b] hover:border-[#00f0ff]/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-[#94a3b8] font-mono">{task.time}</span>
                                    <span className="text-xs text-[#e2e8f0] font-mono truncate max-w-[300px]">{task.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 uppercase tracking-wider font-bold">
                                        {task.status === 'completed' ? '已完成' : task.status === 'failed' ? '失败' : '处理中'}
                                    </span>
                                    {task.status === 'completed' && task.videoUrl && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={task.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00f0ff] hover:underline uppercase tracking-wider font-bold">下载</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Action Button - Cyberpunk Style */}
                <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
                     <button className="w-12 h-12 bg-[#0b1120] border border-[#00f0ff] flex items-center justify-center text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)] hover:bg-[#00f0ff] hover:text-[#0b1120] transition-colors clip-path-polygon">
                        <Heart className="w-5 h-5 fill-current" />
                     </button>
                     <button className="w-14 h-14 bg-[#ff2a6d] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,42,109,0.5)] hover:scale-105 transition-transform clip-path-polygon">
                        <Plus className="w-8 h-8" />
                     </button>
                </div>
            </div>
          ) : activeModule === 'keyword-check' ? (
            <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] overflow-hidden mb-8 animate-fade-in relative">
               <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#00f0ff]"></div>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#00f0ff]"></div>
              <div className="p-8">
                {!keywordResult ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#00f0ff]"></span>
                        Listing 内容 (Content)
                      </label>
                      <textarea
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        className="w-full px-4 py-3 bg-transparent border-b border-[#1e293b] focus:border-[#00f0ff] focus:ring-0 text-[#e2e8f0] placeholder-[#475569] rounded-none transition-all font-mono text-sm min-h-[300px]"
                        placeholder="PASTE_LISTING_CONTENT_FOR_SCAN..."
                      />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-[#1e293b]">
                      <button
                        onClick={handleKeywordSubmit}
                        disabled={isCheckingKeywords || !keywordInput.trim()}
                        className="px-8 py-3 bg-[#00f0ff] text-[#0b1120] font-bold text-sm hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(0,240,255,0.4)] clip-path-polygon uppercase tracking-widest"
                      >
                        {isCheckingKeywords ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            SCANNING...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            INITIATE_SCAN
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                     <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/20 pb-4">
                        <h3 className="text-xl font-bold text-[#00f0ff] font-['Orbitron'] uppercase tracking-wider">Scan Report</h3>
                        <button
                           onClick={() => setKeywordResult(null)}
                           className="text-xs text-[#94a3b8] hover:text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#1e293b] px-3 py-1 hover:border-[#00f0ff] transition-colors"
                        >
                           BACK_TO_EDIT
                        </button>
                     </div>

                     <div className={`p-6 border relative ${keywordResult.score >= 90 ? 'bg-green-900/10 border-green-500/30' : 'bg-yellow-900/10 border-yellow-500/30'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`text-4xl font-black font-['Orbitron'] ${keywordResult.score >= 90 ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`}>
                               {keywordResult.score}
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-sm text-[#e2e8f0] font-mono">
                               {keywordResult.score >= 90 ? 'SYSTEM_STATUS: CLEAR. No critical violations detected.' : 'SYSTEM_STATUS: WARNING. Potential policy violations detected.'}
                            </div>
                        </div>
                     </div>

                     <div className="bg-[#0b1120] p-6 border border-[#1e293b] relative">
                        <h4 className="text-xs font-bold text-[#00f0ff] mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-[#00f0ff]"></span>
                            Content Analysis
                        </h4>
                        <p className="text-sm text-[#94a3b8] leading-relaxed font-mono">
                           {keywordInput.split(/\s+/).map((word, i) => {
                              const isFlagged = keywordResult.flagged.some(f => word.toLowerCase().includes(f.toLowerCase()));
                              return (
                                 <span key={i} className={isFlagged ? "bg-[#ff2a6d]/20 text-[#ff2a6d] px-1 border border-[#ff2a6d]/50 mx-0.5" : "mx-0.5"}>
                                    {word}
                                 </span>
                              )
                           })}
                        </p>
                     </div>

                     {keywordResult.flagged.length > 0 && (
                        <div className="bg-[#ff2a6d]/5 p-4 border border-[#ff2a6d]/20 relative">
                           <div className="absolute top-0 left-0 w-1 h-full bg-[#ff2a6d]"></div>
                           <h4 className="text-xs font-bold text-[#ff2a6d] mb-3 uppercase tracking-wider">Correction Protocols</h4>
                           <ul className="space-y-2">
                              {keywordResult.flagged.map((word, i) => (
                                 <li key={i} className="text-sm text-[#e2e8f0] font-mono flex items-center gap-2">
                                     <span className="text-[#ff2a6d]">{'>'}</span> Remove or replace: <span className="text-[#ff2a6d] font-bold">"{word}"</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Sidebar (Removed) */}
      </div>
      
      {/* Competitor Analysis Modal (Removed) */}
      
      {/* Click outside to close menu handler */}
      {showManualTitleMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowManualTitleMenu(false);
          }}
        />
      )}
    </div>
  );
};

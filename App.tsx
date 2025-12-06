import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, History, Sparkles, Download, RefreshCw, ArrowLeft, Image as ImageIcon, Zap, Hourglass, Wand2, FileText, Settings2, Check, X, Crop } from 'lucide-react';
import { editImageWithGenAI, analyzeImageVibe, analyzeDocument } from './services/geminiService';
import CameraComponent from './components/Camera';
import ImageCropper from './components/ImageCropper';
import { Scene, AppState } from './types';

// Predefined Scenes
const SCENES: Scene[] = [
  {
    id: '1920s',
    name: 'Roaring 20s',
    description: 'Jazz, glitz, and noir vibes.',
    promptModifier: '1920s jazz age, wearing a tuxedo or flapper dress, art deco background, vintage photography style, monochrome or sepia tone',
    icon: '🍸',
    color: 'bg-amber-900/50 border-amber-500/50'
  },
  {
    id: 'medieval',
    name: 'Medieval Kingdom',
    description: 'Knights, castles, and royalty.',
    promptModifier: 'Medieval knight or royalty, wearing armor or velvet robes, inside a stone castle hall with torches, dramatic lighting, oil painting style',
    icon: '🏰',
    color: 'bg-slate-800/50 border-slate-500/50'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    description: 'Neon lights and high tech.',
    promptModifier: 'Futuristic cyberpunk city street at night, neon lights, rain, high-tech clothing with glowing accents, cinematic sci-fi style',
    icon: '🦾',
    color: 'bg-purple-900/50 border-purple-500/50'
  },
  {
    id: 'victorian',
    name: 'Victorian London',
    description: 'Steam, gears, and elegance.',
    promptModifier: 'Victorian era London, foggy street with gas lamps, wearing a formal suit or corset dress, steampunk aesthetic, detailed textures',
    icon: '🎩',
    color: 'bg-stone-900/50 border-stone-500/50'
  },
  {
    id: 'egypt',
    name: 'Ancient Egypt',
    description: 'Pharaohs and pyramids.',
    promptModifier: 'Ancient Egypt, wearing gold jewelry and linen robes, standing before the pyramids or in a temple, warm golden lighting, historical epic style',
    icon: '🐫',
    color: 'bg-yellow-900/50 border-yellow-500/50'
  },
  {
    id: 'viking',
    name: 'Viking Age',
    description: 'Warriors of the north.',
    promptModifier: 'Viking warrior, wearing fur and leather armor, snowy fjord background, rugged look, dramatic cold lighting',
    icon: '⚔️',
    color: 'bg-cyan-900/50 border-cyan-500/50'
  },
  {
    id: 'western',
    name: 'Wild West',
    description: 'Saloons and dust.',
    promptModifier: 'Wild West era, cowboy hat and leather duster, dusty saloon background or desert canyon, warm western movie lighting',
    icon: '🤠',
    color: 'bg-orange-900/50 border-orange-500/50'
  },
  {
    id: 'space',
    name: 'Space Age',
    description: 'The final frontier.',
    promptModifier: 'Retro-futuristic astronaut or space commander, inside a sleek spaceship or on an alien moon, stars in the window, cold blue lighting',
    icon: '🚀',
    color: 'bg-blue-900/50 border-blue-500/50'
  },
  {
    id: 'disco',
    name: 'Disco 70s',
    description: 'Funk and flare.',
    promptModifier: '1970s disco era, colorful funky outfit with bell bottoms, disco ball reflections, vibrant dance floor background, grainy film style',
    icon: '🕺',
    color: 'bg-pink-900/50 border-pink-500/50'
  }
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [docAnalysisText, setDocAnalysisText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Resizing State
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [resizeConfig, setResizeConfig] = useState({ width: 0, height: 0, quality: 90, maintainAspect: true });

  // Cropping State
  const [showCropModal, setShowCropModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (capturedImage && appState === AppState.PREVIEW) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setResizeConfig(prev => ({ ...prev, width: img.width, height: img.height }));
      };
      img.src = capturedImage;
    }
  }, [capturedImage, appState]);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setAppState(AppState.PREVIEW);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setAppState(AppState.PREVIEW);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (newImageSrc: string) => {
    setCapturedImage(newImageSrc);
    setShowCropModal(false);
  };

  const applyResize = () => {
    if (!capturedImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = resizeConfig.width;
      canvas.height = resizeConfig.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, resizeConfig.width, resizeConfig.height);
        const newImage = canvas.toDataURL('image/jpeg', resizeConfig.quality / 100);
        setCapturedImage(newImage);
        setShowResizeModal(false);
      }
    };
    img.src = capturedImage;
  };

  const updateResizeDimension = (type: 'width' | 'height', value: number) => {
    if (resizeConfig.maintainAspect && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      if (type === 'width') {
        setResizeConfig({ ...resizeConfig, width: value, height: Math.round(value / aspectRatio) });
      } else {
        setResizeConfig({ ...resizeConfig, height: value, width: Math.round(value * aspectRatio) });
      }
    } else {
      setResizeConfig({ ...resizeConfig, [type]: value });
    }
  };

  const startAnalysis = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const text = await analyzeImageVibe(capturedImage);
      setAnalysisText(text);
      setAppState(AppState.ANALYSIS_RESULT);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      setAppState(AppState.PREVIEW);
    } finally {
      setIsLoading(false);
    }
  };

  const startDocAnalysis = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const text = await analyzeDocument(capturedImage);
      setDocAnalysisText(text);
      setAppState(AppState.DOC_RESULT);
    } catch (err) {
      setError("Failed to analyze document. Please try again.");
      setAppState(AppState.PREVIEW);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimeTravel = async (scene: Scene) => {
    if (!capturedImage) return;
    setSelectedScene(scene);
    setIsLoading(true);
    setAppState(AppState.PROCESSING);
    setError(null);

    const fullPrompt = `Edit this image to place the person in a ${scene.promptModifier} setting. 
    Maintain the person's facial features and identity strictly. 
    Change the clothing to match the era. 
    Change the background to a realistic ${scene.promptModifier} environment.
    High quality, photorealistic, cinematic lighting.`;

    try {
      const resultImage = await editImageWithGenAI(capturedImage, fullPrompt);
      setGeneratedImage(resultImage);
      setAppState(AppState.RESULT);
    } catch (err) {
      setError("Time travel failed! The portal was unstable (API Error). Try again.");
      setAppState(AppState.PREVIEW);
    } finally {
      setIsLoading(false);
    }
  };

  const startCustomEdit = async () => {
    if (!capturedImage || !customPrompt.trim()) return;
    setSelectedScene({ id: 'custom', name: 'Custom Reality', description: 'Your imagination', promptModifier: '', icon: '✨', color: 'bg-indigo-900' });
    setIsLoading(true);
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const resultImage = await editImageWithGenAI(capturedImage, customPrompt);
      setGeneratedImage(resultImage);
      setAppState(AppState.RESULT);
    } catch (err) {
      setError("Custom generation failed. Try a different prompt.");
      setAppState(AppState.PREVIEW);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setAppState(AppState.HOME);
    setCapturedImage(null);
    setGeneratedImage(null);
    setAnalysisText(null);
    setDocAnalysisText(null);
    setSelectedScene(null);
    setCustomPrompt('');
    setError(null);
    setShowResizeModal(false);
    setShowCropModal(false);
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `chrono-snap-${selectedScene?.id || 'result'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 pb-2">
          ChronoSnap
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
          The world's first AI-powered Time Travel Photo Booth & Document Scanner.
        </p>
        <p className="text-sm text-slate-500">Powered by Gemini 2.5 Flash Image & 3 Pro</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-md md:max-w-2xl justify-center mt-12">
        <button 
          onClick={() => setAppState(AppState.CAMERA)}
          className="group relative flex flex-col items-center justify-center p-8 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border-2 border-slate-700 hover:border-indigo-500 transition-all duration-300 w-full"
        >
          <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
          <Camera className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-semibold">Take Photo</span>
          <span className="text-sm text-slate-400 mt-2">Use your camera</span>
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center p-8 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border-2 border-slate-700 hover:border-purple-500 transition-all duration-300 w-full"
        >
           <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
          <Upload className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-semibold">Upload Image</span>
          <span className="text-sm text-slate-400 mt-2">From your device</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto">
      <div className="w-full flex justify-between items-center mb-8">
        <button onClick={reset} className="flex items-center text-slate-400 hover:text-white transition">
          <ArrowLeft className="mr-2" /> Back
        </button>
        <h2 className="text-2xl font-bold hidden md:block">Studio</h2>
        <div className="w-20 hidden md:block" /> 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left: Image Preview & Tools */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-black group">
            {capturedImage && (
              <img src={capturedImage} alt="Original" className="w-full h-full object-contain" />
            )}
            
            {/* Overlay Tools */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={() => setShowCropModal(true)}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/20 transition"
                  title="Crop Image"
                >
                  <Crop size={20} />
                </button>
               <button 
                  onClick={() => setShowResizeModal(true)}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/20 transition"
                  title="Resize Image"
                >
                  <Settings2 size={20} />
                </button>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 flex-wrap px-4">
                <button 
                  onClick={startAnalysis}
                  className="bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-full border border-white/20 hover:bg-white/20 transition flex items-center gap-2 text-xs font-medium"
                >
                  <Sparkles size={14} className="text-yellow-400" />
                  Analyze Vibe
                </button>
                <button 
                  onClick={startDocAnalysis}
                  className="bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-full border border-white/20 hover:bg-white/20 transition flex items-center gap-2 text-xs font-medium"
                >
                  <FileText size={14} className="text-green-400" />
                  Scan Doc
                </button>
            </div>
          </div>
          
          <div className="text-center text-slate-500 text-sm">
            Dimensions: {originalDimensions.width} x {originalDimensions.height} px
          </div>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right: Scene Selection & Custom */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-slate-300 md:hidden">Select an Era</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {SCENES.map((scene) => (
              <button
                key={scene.id}
                onClick={() => startTimeTravel(scene)}
                className={`relative overflow-hidden group p-5 rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${scene.color} border-transparent hover:border-white/30`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{scene.icon}</span>
                  <History className="text-white/20 group-hover:text-white/60 transition" />
                </div>
                <h3 className="text-lg font-bold mb-1">{scene.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{scene.description}</p>
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-slate-700/50" />

          {/* Custom Section */}
          <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Wand2 className="text-indigo-400 w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Custom Reality</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Turn me into a claymation character, Add a birthday hat..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                onKeyDown={(e) => e.key === 'Enter' && startCustomEdit()}
              />
              <button
                onClick={startCustomEdit}
                disabled={!customPrompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Generate <span className="hidden sm:inline">Custom</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resize Modal */}
      {showResizeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 size={20} /> Resize Image
              </h3>
              <button onClick={() => setShowResizeModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
                  <input 
                    type="number" 
                    value={resizeConfig.width}
                    onChange={(e) => updateResizeDimension('width', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
                  <input 
                    type="number" 
                    value={resizeConfig.height}
                    onChange={(e) => updateResizeDimension('height', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="aspectRatio"
                  checked={resizeConfig.maintainAspect}
                  onChange={(e) => setResizeConfig({...resizeConfig, maintainAspect: e.target.checked})}
                  className="rounded bg-slate-800 border-slate-600 text-indigo-500"
                />
                <label htmlFor="aspectRatio" className="text-sm text-slate-300">Maintain Aspect Ratio</label>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Quality ({resizeConfig.quality}%)</label>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={resizeConfig.quality}
                  onChange={(e) => setResizeConfig({...resizeConfig, quality: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowResizeModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm">Cancel</button>
                <button onClick={applyResize} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2">
                  <Check size={16} /> Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && capturedImage && (
        <ImageCropper 
          imageSrc={capturedImage}
          onCrop={handleCropComplete}
          onCancel={() => setShowCropModal(false)}
        />
      )}
    </div>
  );

  const renderProcessing = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping" />
        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Hourglass className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-4 animate-pulse">
        {selectedScene?.id === 'custom' ? 'Weaving Reality...' : 
         !selectedScene ? 'Analyzing Data...' : `Traveling to ${selectedScene?.name}...`}
      </h2>
      <p className="text-slate-400 max-w-md">
        Processing pixels, calculating vectors, and consulting the oracle.
      </p>
    </div>
  );

  const renderResult = () => (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto h-[50vh] md:h-auto bg-black">
            {generatedImage ? (
              <img src={generatedImage} alt="Result" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Image Load Error</div>
            )}
            <div className="absolute bottom-4 left-4">
              <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-md border border-white/10">
                {selectedScene?.name}
              </span>
            </div>
          </div>
          
          <div className="p-8 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                {selectedScene?.id === 'custom' ? 'Transformation Complete!' : 'Welcome to the past!'}
              </h2>
              <p className="text-slate-400">
                {selectedScene?.id === 'custom' 
                  ? "Your custom edits have been applied successfully."
                  : `Your journey to the ${selectedScene?.name} was successful.`
                }
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={downloadImage}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download size={20} />
                Download
              </button>
              
              <button 
                onClick={() => setAppState(AppState.PREVIEW)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <RefreshCw size={20} />
                Edit Again
              </button>

              <button 
                onClick={reset}
                className="w-full py-2 text-slate-500 hover:text-white transition text-sm"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center border border-purple-500/50">
            <Sparkles className="text-purple-400 w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-white">Temporal Analysis Complete</h2>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <p className="text-lg text-slate-200 leading-relaxed font-light italic">
              "{analysisText}"
            </p>
          </div>

          <button 
            onClick={() => setAppState(AppState.PREVIEW)}
            className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition"
          >
            Choose Destination
          </button>
        </div>
      </div>
    </div>
  );

  const renderDocResult = () => (
    <div className="min-h-screen p-4 md:p-8 flex justify-center bg-[#0f172a]">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[80vh]">
        {/* Sidebar Image */}
        <div className="w-full md:w-1/3 bg-slate-100 border-r border-slate-200 p-6 flex flex-col gap-4">
           <h3 className="font-bold text-slate-400 uppercase tracking-wider text-xs">Source Document</h3>
           <div className="rounded-lg overflow-hidden border border-slate-300 shadow-sm bg-white">
             <img src={capturedImage || ''} className="w-full h-auto object-contain" alt="Source" />
           </div>
           
           <div className="mt-auto space-y-2">
             <button 
              onClick={() => setAppState(AppState.PREVIEW)}
              className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
             >
               <ArrowLeft size={16} /> Back to Studio
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="w-full md:w-2/3 p-8 md:p-12 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Document Intelligence</h2>
          </div>

          <div className="prose prose-slate max-w-none">
            {docAnalysisText ? (
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
                {docAnalysisText}
              </div>
            ) : (
              <p className="text-slate-400 italic">No analysis generated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {appState === AppState.HOME && renderHome()}
      {appState === AppState.CAMERA && <CameraComponent onCapture={handleCapture} onClose={() => setAppState(AppState.HOME)} />}
      {appState === AppState.PREVIEW && renderPreview()}
      {appState === AppState.PROCESSING && renderProcessing()}
      {appState === AppState.RESULT && renderResult()}
      {appState === AppState.ANALYSIS_RESULT && renderAnalysis()}
      {appState === AppState.DOC_RESULT && renderDocResult()}
    </div>
  );
};

export default App;
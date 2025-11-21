
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, RefreshCw, Zap, Loader2, FileText, BrainCircuit, Calculator, BookOpen, Video, Lightbulb } from 'lucide-react';
import { analyzeGraphImage } from './services/gemini';
import FrameCard from './components/FrameCard';
import ImagePreview from './components/ImagePreview';
import { AnalysisResult, AppState, FrameData } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LOADING_STEPS = [
    { color: 'blue', title: 'Problem Statement', desc: 'Identifying graph boundaries, axes, and function type...', icon: FileText },
    { color: 'green', title: 'Graph Intelligence', desc: 'Analyzing slopes, intercepts, vertices, and key points...', icon: BrainCircuit },
    { color: 'orange', title: 'Model Derivation', desc: 'Formulating the precise mathematical equation...', icon: Calculator },
    { color: 'yellow', title: 'Step-by-Step Solution', desc: 'Performing detailed calculations and verification...', icon: BookOpen },
    { color: 'purple', title: 'Learning Resources', desc: 'Curating relevant tutorials, videos, and references...', icon: Video },
    { color: 'red', title: 'Real-World Context', desc: 'Connecting mathematical concepts to practical applications...', icon: Lightbulb },
  ] as const;

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAppState(AppState.IDLE);
    setError(null);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      const rawText = await analyzeGraphImage(imageFile);
      const parsedFrames = parseGeminiResponse(rawText);
      setAnalysisResult({ rawText, frames: parsedFrames });
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze the image. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Parser function
  const parseGeminiResponse = (text: string): FrameData[] => {
    const frames: FrameData[] = [];
    
    // Split by the delimiter used in the prompt
    const parts = text.split('==================================================');

    let idCounter = 1;

    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;

      // Identify frame type/color based on emoji or keyword
      let color: FrameData['color'] = 'gray';
      let title = 'Unknown Section';

      if (trimmed.includes('🟦') || trimmed.includes('FRAME 1')) {
        color = 'blue';
        title = extractTitle(trimmed, 'FRAME 1');
      } else if (trimmed.includes('🟩') || trimmed.includes('FRAME 2')) {
        color = 'green';
        title = extractTitle(trimmed, 'FRAME 2');
      } else if (trimmed.includes('🟧') || trimmed.includes('FRAME 3')) {
        color = 'orange';
        title = extractTitle(trimmed, 'FRAME 3');
      } else if (trimmed.includes('🟨') || trimmed.includes('FRAME 4')) {
        color = 'yellow';
        title = extractTitle(trimmed, 'FRAME 4');
      } else if (trimmed.includes('🟪') || trimmed.includes('FRAME 5')) {
        color = 'purple';
        title = extractTitle(trimmed, 'FRAME 5');
      } else if (trimmed.includes('🟥') || trimmed.includes('FRAME 6')) {
        color = 'red';
        title = extractTitle(trimmed, 'FRAME 6');
      } else {
        // Skip unrelated preamble/postscript
        return; 
      }

      // Clean content: Remove the title line
      const lines = trimmed.split('\n');
      const contentLines = lines.slice(1).join('\n').trim(); 

      frames.push({
        id: idCounter++,
        title,
        content: contentLines,
        color
      });
    });

    return frames;
  };

  const extractTitle = (text: string, frameKey: string): string => {
    const lines = text.split('\n');
    const titleLine = lines.find(l => l.includes(frameKey));
    if (titleLine) {
      // Remove emoji and "FRAME X — "
      return titleLine.replace(/^[🟦🟩🟧🟪🟨🟥]\s*/, '').trim();
    }
    return frameKey;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-mono tracking-tight">
              MathVision<span className="text-slate-600">.AI</span>
            </h1>
          </div>
          {appState !== AppState.IDLE && (
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <RefreshCw className="w-5 h-5" />
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 lg:px-12 py-12">
        
        {/* Hero / Upload Section */}
        {appState === AppState.IDLE && !imagePreview && (
          <div className="max-w-5xl mx-auto mt-16 animate-in">
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
                Decode math <br className="hidden sm:block" /> in <span className="text-blue-500">seconds</span>.
              </h2>
              <p className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Upload any graph image. Get a complete, step-by-step expert solution powered by next-gen AI.
              </p>
            </div>

            <div 
              className="relative group cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative bg-slate-900 rounded-3xl border border-slate-800 p-16 flex flex-col items-center justify-center text-center hover:border-slate-700 transition duration-300 h-96 shadow-2xl">
                <div className="w-24 h-24 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-slate-700">
                  <Upload className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-3xl font-semibold text-white mb-4">Click to upload or drag & drop</h3>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  Supports JPG, PNG, WebP. Perfect for calculus, algebra, and physics graphs.
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
               {[
                 { title: 'Visual Analysis', desc: 'Detects slopes, intercepts, and curvature.', icon: <ImageIcon className="w-6 h-6" /> },
                 { title: 'Step-by-Step', desc: 'Logical derivation of the equation.', icon: <AlertCircle className="w-6 h-6" /> },
                 { title: 'Learning Resources', desc: 'Curated videos and references.', icon: <Zap className="w-6 h-6" /> }
               ].map((item, i) => (
                 <div key={i} className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm hover:bg-slate-800/40 transition-colors">
                   <div className="mx-auto w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/10">
                     {item.icon}
                   </div>
                   <h4 className="text-xl text-white font-bold mb-2">{item.title}</h4>
                   <p className="text-slate-400 text-base leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Preview & Analyze State */}
        {imagePreview && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Image Preview */}
            <div className="xl:col-span-5 xl:sticky xl:top-28 space-y-8 animate-in">
              
              <ImagePreview 
                src={imagePreview} 
                alt="Graph Analysis" 
                onReplace={() => fileInputRef.current?.click()}
              />

              {appState === AppState.IDLE && (
                <button
                  onClick={handleAnalyze}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl hover:shadow-xl hover:shadow-blue-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-3 tracking-wide"
                >
                  <Zap className="w-6 h-6 fill-current" />
                  Analyze Graph
                </button>
              )}

              {appState === AppState.ANALYZING && (
                 <div className="w-full py-5 rounded-2xl bg-slate-800/50 text-slate-200 font-medium flex items-center justify-center gap-3 border border-slate-700 cursor-wait text-lg shadow-lg">
                   <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                   Processing vision data...
                 </div>
              )}
              
               {appState === AppState.ERROR && (
                 <div className="p-6 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 flex items-start gap-4 shadow-lg">
                   <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                   <div className="text-base leading-relaxed">{error}</div>
                 </div>
              )}
            </div>

            {/* Right Column: Results */}
            <div className="xl:col-span-7 space-y-8">
              {appState === AppState.ANALYZING && (
                <div className="space-y-8 animate-in">
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                         Analyzing Graph...
                         <span className="flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing
                         </span>
                      </h2>
                   </div>
                   {LOADING_STEPS.map((step, i) => {
                     const Icon = step.icon;
                     return (
                     <div 
                        key={i} 
                        className={`rounded-2xl border p-8 sm:p-10 mb-6 relative overflow-hidden ${
                          step.color === 'blue' ? "border-blue-500/20 bg-blue-950/10" :
                          step.color === 'green' ? "border-green-500/20 bg-green-950/10" :
                          step.color === 'orange' ? "border-orange-500/20 bg-orange-950/10" :
                          step.color === 'yellow' ? "border-yellow-500/20 bg-yellow-950/10" :
                          step.color === 'purple' ? "border-purple-500/20 bg-purple-950/10" :
                          "border-red-500/20 bg-red-950/10"
                        }`}
                        style={{ animationDelay: `${i * 150}ms` }}
                     >
                        {/* Pulse/Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 relative">
                          <div className="p-3 rounded-xl bg-black/20">
                             <Icon className={`w-8 h-8 sm:w-9 sm:h-9 opacity-50 ${
                               step.color === 'blue' ? "text-blue-400" :
                               step.color === 'green' ? "text-green-400" :
                               step.color === 'orange' ? "text-orange-400" :
                               step.color === 'yellow' ? "text-yellow-400" :
                               step.color === 'purple' ? "text-purple-400" :
                               "text-red-400"
                             }`} />
                          </div>
                          <div className="space-y-2">
                             <div className={`text-2xl sm:text-3xl font-bold tracking-tight uppercase opacity-50 ${
                               step.color === 'blue' ? "text-blue-400" :
                               step.color === 'green' ? "text-green-400" :
                               step.color === 'orange' ? "text-orange-400" :
                               step.color === 'yellow' ? "text-yellow-400" :
                               step.color === 'purple' ? "text-purple-400" :
                               "text-red-400"
                             }`}>
                               {step.title}
                             </div>
                          </div>
                        </div>
                        
                        {/* Context-aware skeleton content */}
                        {step.title === 'Graph Intelligence' || step.title === 'Real-World Context' ? (
                           <div className="space-y-3 relative opacity-30">
                              <div className="flex gap-3 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                <div className="h-4 bg-current rounded w-3/4"></div>
                              </div>
                              <div className="flex gap-3 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                <div className="h-4 bg-current rounded w-1/2"></div>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-3 relative opacity-30">
                              <div className="h-4 bg-current rounded w-full"></div>
                              <div className="h-4 bg-current rounded w-5/6"></div>
                              <div className="h-4 bg-current rounded w-4/6"></div>
                           </div>
                        )}
                     </div>
                     );
                   })}
                </div>
              )}

              {/* SUCCESS STATE */}
              {appState === AppState.SUCCESS && analysisResult && (
                <div className="space-y-8 animate-in">
                   {analysisResult.frames.map((frame, index) => (
                     <FrameCard 
                        key={frame.id} 
                        frame={frame} 
                        delay={index * 200} 
                     />
                   ))}

                  <div className="flex justify-center pt-8 pb-16 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: '1000ms' }}>
                      <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all font-medium border border-slate-700 hover:border-slate-600 shadow-lg hover:shadow-xl"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Analyze Another Graph
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

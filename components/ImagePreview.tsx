
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, RotateCcw, Move, Sparkles, RotateCw, Wand2 } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onReplace: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, onReplace }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Filter states
  const [isSharpened, setIsSharpened] = useState(false);
  const [sharpenIntensity, setSharpenIntensity] = useState(1.0);
  const [isEnhanced, setIsEnhanced] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(r => (r + 90) % 360);
  };

  const handleAutoEnhance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEnhanced) {
      setIsEnhanced(true);
      // Auto-enable sharpening with optimized intensity for graphs
      setIsSharpened(true);
      setSharpenIntensity(1.5);
    } else {
      setIsEnhanced(false);
      // Reset to standard state
      setIsSharpened(false);
      setSharpenIntensity(1.0);
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    // Note: We don't reset sharpening/enhance state here to allow user preference to persist while resetting view
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  // Reset view and filters when src changes
  useEffect(() => {
      handleReset();
      setIsSharpened(false);
      setSharpenIntensity(1.0);
      setRotation(0);
      setIsEnhanced(false);
  }, [src]);

  // Calculate convolution matrix based on intensity
  const k = sharpenIntensity;
  const kernelMatrix = `0 -${k} 0 -${k} ${1 + 4 * k} -${k} 0 -${k} 0`;

  // Construct dynamic filter string
  const getFilters = () => {
    const filters = [];
    
    if (isSharpened) {
      filters.push('url(#sharpen-filter)');
    }

    if (isEnhanced) {
      // Brightness and higher contrast for auto-enhance mode
      filters.push('brightness(1.1)');
      filters.push('contrast(1.25)');
    } else if (isSharpened) {
      // Slight contrast boost for manual sharpening to prevent washout
      filters.push('contrast(1.1)');
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-black shadow-2xl shadow-blue-900/20 group bg-slate-900/50 select-none w-full" style={{ height: '75vh', maxHeight: '1000px', minHeight: '500px' }}>
      
      {/* SVG Filter Definition with dynamic kernel */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="sharpen-filter">
            <feConvolveMatrix 
                order="3" 
                preserveAlpha="true" 
                kernelMatrix={kernelMatrix} 
            />
          </filter>
        </defs>
      </svg>

      <div 
        className={`w-full h-full flex items-center justify-center overflow-hidden ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        ref={containerRef}
      >
        <img 
          src={src} 
          alt={alt}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            filter: getFilters()
          }}
          className="max-w-full max-h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 shadow-lg transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 max-w-[90vw] overflow-x-auto">
        
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 shrink-0 px-2">
          <ZoomIn className="w-4 h-4 text-slate-400" />
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="0.1"
            value={scale}
            onChange={(e) => {
                e.stopPropagation();
                const newScale = parseFloat(e.target.value);
                setScale(newScale);
                if (newScale === 1) setPosition({ x: 0, y: 0 });
            }}
            className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <span className="text-sm font-mono w-10 text-center text-slate-300 select-none shrink-0">
            {(scale * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="w-px h-5 bg-slate-700 mx-2 shrink-0"></div>

        <button 
            onClick={handleRotate}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Rotate 90°"
        >
            <RotateCw className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-slate-700 mx-2 shrink-0"></div>

        <div className="flex items-center gap-2 shrink-0">
            <button 
                onClick={handleAutoEnhance}
                className={`p-2 rounded-full transition-colors shrink-0 ${isEnhanced ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}
                title="Auto-Enhance"
            >
                <Wand2 className="w-5 h-5" />
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); setIsSharpened(!isSharpened); }}
                className={`p-2 rounded-full transition-colors shrink-0 ${isSharpened ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}
                title={isSharpened ? "Disable Sharpening" : "Enable Sharpening"}
            >
                <Sparkles className="w-5 h-5" />
            </button>

            {isSharpened && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 mr-1 pl-2 border-l border-slate-700">
                     <input 
                        type="range" 
                        min="0.1" 
                        max="3.0" 
                        step="0.1"
                        value={sharpenIntensity}
                        onChange={(e) => { e.stopPropagation(); setSharpenIntensity(parseFloat(e.target.value)); }}
                        className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        onMouseDown={(e) => e.stopPropagation()}
                        title={`Sharpen Intensity: ${sharpenIntensity}`}
                     />
                     <span className="text-xs font-mono text-slate-400 w-6 text-center select-none">{sharpenIntensity.toFixed(1)}</span>
                </div>
            )}
        </div>

        <div className="w-px h-5 bg-slate-700 mx-2 shrink-0"></div>
        
        <button 
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Reset View"
        >
            <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Replace Button */}
      <div className="absolute top-6 right-6 transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onReplace(); }}
          className="text-sm text-white bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 hover:bg-black/80 flex items-center gap-2 shadow-lg transition-colors font-medium"
        >
          Change Image
        </button>
      </div>
      
      {/* Drag Hint */}
      {scale > 1 && !isDragging && (
          <div className="absolute top-6 left-6 pointer-events-none bg-black/40 backdrop-blur px-3 py-1.5 rounded-lg text-sm text-white/70 flex items-center gap-2 animate-in fade-in duration-300 z-10">
              <Move className="w-4 h-4" /> Drag to pan
          </div>
      )}
    </div>
  );
};

export default ImagePreview;

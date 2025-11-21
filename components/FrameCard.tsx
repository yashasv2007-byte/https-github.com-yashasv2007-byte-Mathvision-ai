
import React from 'react';
import { FrameData } from '../types';
import { BookOpen, Video, Calculator, Lightbulb, BrainCircuit, FileText, ChevronRight } from 'lucide-react';

interface FrameCardProps {
  frame: FrameData;
  delay?: number;
}

const FrameCard: React.FC<FrameCardProps> = ({ frame, delay = 0 }) => {
  // Determine styling based on color
  const colorStyles = {
    blue: "border-blue-500/30 bg-blue-950/20 text-blue-100 shadow-[0_0_25px_-5px_rgba(59,130,246,0.15)]",
    green: "border-green-500/30 bg-green-950/20 text-green-100 shadow-[0_0_25px_-5px_rgba(34,197,94,0.15)]",
    orange: "border-orange-500/30 bg-orange-950/20 text-orange-100 shadow-[0_0_25px_-5px_rgba(249,115,22,0.15)]",
    purple: "border-purple-500/30 bg-purple-950/20 text-purple-100 shadow-[0_0_25px_-5px_rgba(168,85,247,0.15)]",
    yellow: "border-yellow-500/30 bg-yellow-950/20 text-yellow-100 shadow-[0_0_25px_-5px_rgba(234,179,8,0.15)]",
    red: "border-red-500/30 bg-red-950/20 text-red-100 shadow-[0_0_25px_-5px_rgba(239,68,68,0.15)]",
    gray: "border-slate-500/30 bg-slate-900/50 text-slate-300",
  };

  const iconClass = "w-8 h-8 sm:w-9 sm:h-9";

  const iconMap: Record<string, React.ReactNode> = {
    'blue': <FileText className={`${iconClass} text-blue-400`} />,
    'green': <BrainCircuit className={`${iconClass} text-green-400`} />,
    'orange': <Calculator className={`${iconClass} text-orange-400`} />,
    'purple': <Video className={`${iconClass} text-purple-400`} />,
    'yellow': <BookOpen className={`${iconClass} text-yellow-400`} />,
    'red': <Lightbulb className={`${iconClass} text-red-400`} />,
  };

  const headerColor = {
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    gray: "text-slate-400",
  }

  // Simple Markdown-like formatter
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      
      // Bullets
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={i} className="ml-6 mb-2 list-disc marker:text-slate-500 pl-2">
            {processLine(trimmed.substring(2))}
          </li>
        );
      }

      // Numbered Lists
      const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numberMatch) {
         return (
             <div key={i} className="flex gap-3 mb-2 ml-2">
                 <span className="font-mono text-slate-500 font-bold select-none text-lg">{numberMatch[1]}.</span>
                 <span>{processLine(numberMatch[2])}</span>
             </div>
         )
      }

      if (trimmed === '') return <div key={i} className="h-4"></div>;
      
      // Headers (simple check)
      if (trimmed.endsWith(':')) {
        return <div key={i} className="font-bold mt-6 mb-3 opacity-90 text-xl">{processLine(trimmed)}</div>;
      }

      return <div key={i} className="mb-2">{processLine(trimmed)}</div>;
    });
  };

  const processLine = (line: string) => {
    // Very basic bold parsing: **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Basic link detection (http...)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlParts = part.split(urlRegex);
      if (urlParts.length > 1) {
         return urlParts.map((subPart, subIndex) => {
             if (subPart.match(urlRegex)) {
                 return <a key={`${index}-${subIndex}`} href={subPart} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{subPart}</a>
             }
             return subPart;
         })
      }
      return part;
    });
  };

  return (
    <div 
      className={`rounded-2xl border backdrop-blur-sm p-8 sm:p-10 mb-8 transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-4 ${colorStyles[frame.color]}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div className="p-3 rounded-xl bg-black/20">
          {iconMap[frame.color] || <FileText className={iconClass} />}
        </div>
        <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight uppercase ${headerColor[frame.color]}`}>
          {frame.title}
        </h3>
      </div>
      <div className="text-lg sm:text-xl leading-relaxed font-light opacity-90">
        {renderContent(frame.content)}
      </div>
    </div>
  );
};

export default FrameCard;

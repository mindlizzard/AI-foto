
import React from 'react';

// Declare global for heic2any
declare var heic2any: any;

// --- Global Loader Overlay (Enhanced Animation) ---
export const AuraLoader = ({ text, subtext }: { text: string, subtext?: string }) => (
  <div className="fixed inset-0 z-[9999] w-screen h-screen flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-2xl transition-all duration-1000 animate-fadeIn">
    <div className="relative mb-12 group">
      {/* Outer Glow / Nebula */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-aura-accent via-purple-600 to-blue-600 rounded-full blur-[100px] opacity-40 animate-pulse-slow"></div>
      
      {/* Spinning Rings */}
      <div className="relative w-40 h-40">
         <div className="absolute inset-0 rounded-full border border-t-aura-accent border-r-aura-accent/50 border-b-transparent border-l-transparent animate-[spin_3s_linear_infinite] shadow-[0_0_40px_rgba(139,92,246,0.4)]"></div>
         <div className="absolute inset-4 rounded-full border border-b-white/50 border-l-white/20 border-t-transparent border-r-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-aura-accent/10 rounded-full backdrop-blur-md animate-float flex items-center justify-center border border-white/10 shadow-inner">
                <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">✨</span>
            </div>
         </div>
      </div>
    </div>
    
    <div className="space-y-3 text-center z-10">
        <h2 className="text-4xl font-extralight tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 animate-pulse uppercase">{text}</h2>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-aura-accent to-transparent mx-auto"></div>
        {subtext && <p className="text-xs text-aura-accent/80 font-mono tracking-widest uppercase animate-bounce">{subtext}</p>}
    </div>
  </div>
);

// --- Info Tooltip Component ---
export const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="group relative inline-flex ml-1.5 items-center justify-center cursor-help">
      <span className="text-gray-500 hover:text-aura-accent transition-colors duration-300 text-[10px] opacity-70 hover:opacity-100 border border-gray-700 hover:border-aura-accent rounded-full w-3.5 h-3.5 flex items-center justify-center">i</span>
      
      {/* Tooltip Popup */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-[#0a0a0a]/95 border border-aura-accent/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] opacity-0 transform scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50 backdrop-blur-xl">
        <p className="text-[10px] text-gray-200 leading-relaxed font-light text-center">
          {text}
        </p>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-aura-accent/30"></div>
      </div>
    </div>
  );
};

// --- Recursive JSON Renderer for Review Modal ---
const JsonRecursive = ({ data, level = 0 }: { data: any, level?: number }) => {
    if (!data) return <span className="text-gray-600 italic">Empty</span>;

    // Helper to format keys
    const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').trim();

    return (
        <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: `${level * 100}ms` }}>
            {Object.entries(data).map(([key, val]) => {
                const isObj = typeof val === 'object' && val !== null;
                
                return (
                    <div key={key} className={`rounded-lg transition-all duration-300 hover:bg-white/5 ${level === 0 ? 'bg-white/5 border border-white/10 mb-3' : 'border-l-2 border-white/10 pl-3 ml-1 my-1'}`}>
                        {/* Label */}
                        <div className={`flex items-center gap-2 ${level === 0 ? 'p-3 bg-white/5 border-b border-white/5' : 'py-1'}`}>
                             <span className={`text-[10px] font-bold uppercase tracking-widest ${level === 0 ? 'text-aura-accent' : 'text-gray-400'}`}>
                                {formatKey(key)}
                             </span>
                        </div>

                        {/* Value */}
                        <div className={`${level === 0 ? 'p-3' : ''}`}>
                            {isObj ? (
                                <JsonRecursive data={val} level={level + 1} />
                            ) : (
                                <p className="text-sm text-gray-200 font-light break-words leading-relaxed">
                                    {String(val)}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Review/Suggestion Modal (Enhanced Animation) ---
export const ReviewModal = ({ 
  isOpen, 
  title, 
  content, 
  onAccept, 
  onReject 
}: { 
  isOpen: boolean; 
  title: string; 
  content: any; 
  onAccept: () => void; 
  onReject: () => void; 
}) => {
  if (!isOpen) return null;

  const isObj = typeof content === 'object' && content !== null;

  return (
    <div className="fixed inset-0 z-[10000] w-screen h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-[#0a0a0a] border border-aura-accent/30 rounded-2xl shadow-[0_0_80px_rgba(139,92,246,0.3)] max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh] animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-aura-accent/10 to-transparent flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-aura-accent/20 flex items-center justify-center text-aura-accent shadow-[0_0_10px_#8b5cf6] animate-pulse">✨</div>
           <div>
             <h3 className="text-sm font-bold text-white uppercase tracking-wider">Review Suggestion</h3>
             <p className="text-[10px] text-gray-400 font-mono uppercase">{title}</p>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-black/40">
           {isObj ? (
             <JsonRecursive data={content} />
           ) : (
             <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-lg leading-relaxed text-gray-200 font-light italic text-center animate-fadeInUp">
               "{String(content)}"
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex gap-3 backdrop-blur-sm">
          <button 
            onClick={onReject}
            className="flex-1 py-3 rounded-lg text-xs font-medium uppercase tracking-wider text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all duration-300"
          >
            Reject
          </button>
          <button 
            onClick={onAccept}
            className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-aura-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-aura-accentGlow hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 relative overflow-hidden"
          >
            <span className="relative z-10">Accept & Apply</span>
            <div className="glass-shine"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Card (Enhanced) ---
interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number; // Animation delay
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', delay = 0 }) => (
  <div 
    className={`bg-aura-panel/60 backdrop-blur-xl border border-white/5 rounded-2xl transition-all duration-500 hover:border-aura-accent/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:translate-y-[-2px] animate-fade-in-up ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// --- Inputs ---
interface SliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  description?: string;
  info?: string;
}
export const LuxurySlider: React.FC<SliderProps> = ({ label, value, onChange, min=0, max=100, description, info }) => (
  <div className="mb-4 group">
    <div className="flex justify-between mb-2 items-center">
      <div className="flex items-center">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider group-hover:text-gray-300 transition-colors">{label}</span>
        {info && <InfoTooltip text={info} />}
      </div>
      <span className="text-xs text-aura-accent font-mono bg-aura-accent/10 px-2 py-0.5 rounded border border-aura-accent/20">{value}</span>
    </div>
    {description && <p className="text-[10px] text-gray-600 mb-2 leading-tight">{description}</p>}
    <div className="relative h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
        <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-aura-accent to-purple-500 transition-all duration-300 ease-out" 
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        ></div>
        <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
    </div>
  </div>
);

interface TextInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  area?: boolean;
  onMagic?: () => void; 
  magicLoading?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  info?: string;
}
export const LuxuryInput: React.FC<TextInputProps> = ({ 
  label, value, onChange, placeholder, area, 
  onMagic, magicLoading, isLocked, onToggleLock, info
}) => (
  <div className="mb-4 relative group">
     <div className="flex justify-between items-center mb-2">
       <div className="flex items-center gap-2">
           <span className="text-xs font-medium text-gray-400 uppercase tracking-wider group-focus-within:text-white transition-colors">{label}</span>
           {info && <InfoTooltip text={info} />}
           {onToggleLock && (
               <button onClick={onToggleLock} className="text-xs focus:outline-none transition-transform hover:scale-110 ml-2 hover:text-white text-gray-500">
                  {isLocked ? '🔒' : '🔓'}
               </button>
           )}
       </div>
       {onMagic && !isLocked && (
         <button 
           onClick={onMagic} 
           disabled={magicLoading}
           className="text-xs text-aura-accent hover:text-white flex items-center gap-1 transition-all duration-300 disabled:opacity-50 hover:scale-105 active:scale-95"
         >
           {magicLoading ? (
             <span className="animate-spin">✨</span>
           ) : (
             <>
               <span className="group-hover:animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.5)] rounded-full p-1">✨</span> <span className="underline decoration-dotted">AI Generate</span>
             </>
           )}
         </button>
       )}
     </div>
     <div className="relative">
         {area ? (
        <textarea
            className={`w-full bg-black/20 border rounded-lg p-3 text-sm text-white focus:outline-none transition-all duration-300 resize-none h-24 backdrop-blur-sm ${isLocked ? 'border-red-500/30 bg-red-500/5 text-gray-300' : 'border-white/10 focus:border-aura-accent focus:bg-black/60 focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-white/20'}`}
            value={value}
            onChange={(e) => !isLocked && onChange(e.target.value)}
            readOnly={isLocked}
            placeholder={placeholder}
        />
        ) : (
        <input
            type="text"
            className={`w-full bg-black/20 border rounded-lg p-3 text-sm text-white focus:outline-none transition-all duration-300 backdrop-blur-sm ${isLocked ? 'border-red-500/30 bg-red-500/5 text-gray-300' : 'border-white/10 focus:border-aura-accent focus:bg-black/60 focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-white/20'}`}
            value={value}
            onChange={(e) => !isLocked && onChange(e.target.value)}
            readOnly={isLocked}
            placeholder={placeholder}
        />
        )}
        {isLocked && <div className="absolute right-3 top-3 text-[10px] text-red-500/50 pointer-events-none">LOCKED</div>}
     </div>
  </div>
);

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: any) => void;
  info?: string;
}
export const LuxurySelect: React.FC<SelectProps> = ({ label, value, options, onChange, info }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      {info && <InfoTooltip text={info} />}
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-2 text-xs rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 ${value === opt ? 'bg-aura-accent/20 border-aura-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-black/20 border-white/10 text-gray-500 hover:bg-white/5 hover:text-gray-300 hover:border-white/30'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  info?: string;
}
export const LuxuryDropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, info }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      {info && <InfoTooltip text={info} />}
    </div>
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-aura-accent focus:outline-none appearance-none cursor-pointer transition-all duration-300 hover:border-white/30 hover:bg-black/40 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
      >
        <option value="" disabled>Selecteer een optie...</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-aura-accent transition-colors">
        ▼
      </div>
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}
export const LuxuryButton: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, className='', ...props }) => {
  const base = "relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center overflow-hidden active:scale-95 group";
  const styles = {
    primary: "bg-aura-accent hover:bg-aura-accentGlow text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-transparent",
    secondary: "bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button className={`${base} ${styles[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isLoading} {...props}>
      {/* Loading Spinner */}
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      
      {/* Shine Effect Overlay */}
      {!isLoading && <div className="glass-shine"></div>}
    </button>
  );
};

export const ImageUploader = ({ 
  image, 
  onUpload, 
  label 
}: { 
  image: string | null, 
  onUpload: (b64: string) => void, 
  label: string 
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
        if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
             if (typeof heic2any !== 'undefined') {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.9
                });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const reader = new FileReader();
                reader.onloadend = () => {
                    onUpload(reader.result as string);
                    setIsProcessing(false);
                };
                reader.readAsDataURL(blob);
                e.target.value = '';
                return;
             }
        }
    } catch (err) {
        console.error("HEIC conversion failed", err);
    }

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            onUpload(canvas.toDataURL('image/jpeg', 0.9));
        }
        URL.revokeObjectURL(video.src);
        setIsProcessing(false);
      };
      
      video.onerror = () => {
        setIsProcessing(false);
      };
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
          onUpload(reader.result as string);
          setIsProcessing(false); 
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="mb-6">
       <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">{label}</span>
       
       <label className="relative flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-white/10 bg-black/20 hover:bg-black/40 hover:border-aura-accent hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-500 cursor-pointer overflow-hidden group">
         {isProcessing ? (
            <>
               <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                   <div className="text-aura-accent animate-pulse font-mono text-xs">ANALYZING ASSET...</div>
               </div>
               <div className="absolute top-0 left-0 w-full h-1 bg-aura-accent/50 shadow-[0_0_15px_#8b5cf6] animate-[scan_1.5s_linear_infinite]"></div>
            </>
         ) : image ? (
            <>
              <img src={image} alt="Referentie" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                 <span className="text-xs text-white uppercase tracking-wider font-bold bg-black/50 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md shadow-xl transform scale-90 group-hover:scale-100 transition-transform">Vervang</span>
              </div>
            </>
         ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-aura-accent/20 transition-all duration-300 border border-white/5 group-hover:border-aura-accent/30">
                  <svg className="w-6 h-6 text-gray-500 group-hover:text-aura-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-[9px] text-gray-400 uppercase group-hover:text-gray-300 tracking-widest">Upload Referentie</span>
            </>
         )}
         <input type="file" accept="image/*,video/*,.heic" className="hidden" onChange={handleFile} />
       </label>
       
       <style>{`@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
    </div>
  );
};

export const MultiImageUploader = ({ 
  images, 
  onAdd, 
  onRemove,
  label 
}: { 
  images: string[], 
  onAdd: (b64: string) => void, 
  onRemove: (index: number) => void,
  label: string 
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    let processed = 0;
    const total = files.length;
    
    const finish = () => {
        processed++;
        if (processed === total) setIsProcessing(false);
    };

    const fileList: File[] = Array.from(files);

    for (const file of fileList) {
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
         try {
             if (typeof heic2any !== 'undefined') {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.9
                });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const reader = new FileReader();
                reader.onloadend = () => {
                    onAdd(reader.result as string);
                    finish();
                };
                reader.readAsDataURL(blob);
             } else {
                 finish();
             }
         } catch (err) {
             finish();
         }
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = "anonymous";
        
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1.0, video.duration / 2);
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(video, 0, 0);
             onAdd(canvas.toDataURL('image/jpeg', 0.9));
          }
          URL.revokeObjectURL(video.src);
          finish();
        };
        
        video.onerror = () => finish();
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
            onAdd(reader.result as string);
            finish();
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  return (
    <div className="mb-6 group">
       <div className="flex justify-between items-center mb-2">
         <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
         <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{images.length}/5 Assets</span>
       </div>
       
       <div className="grid grid-cols-3 gap-2">
         {images.map((img, idx) => (
           <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group/item transition-all duration-500 hover:border-aura-accent hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-scale-in" style={{ animationDelay: `${idx * 100}ms` }}>
             <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover transform transition-transform duration-700 group-hover/item:scale-110" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
             
             {/* Action Buttons */}
             <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 translate-y-2 group-hover/item:translate-y-0">
                 <button 
                   onClick={(e) => { e.preventDefault(); const link = document.createElement("a"); link.href = img; link.download = `aura-ref-${idx}.jpg`; link.click(); }}
                   className="bg-black/60 hover:bg-aura-accent text-white rounded-full p-1.5 transition-colors backdrop-blur-md border border-white/10"
                   title="Download"
                 >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 </button>
                 <button 
                   onClick={() => onRemove(idx)}
                   className="bg-black/60 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors backdrop-blur-md border border-white/10"
                   title="Verwijder"
                 >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
           </div>
         ))}
         
         {images.length < 5 && (
           <label className="relative flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-white/10 bg-black/20 hover:bg-black/40 hover:border-aura-accent transition-all duration-300 cursor-pointer overflow-hidden group/upload">
             {isProcessing ? (
                <>
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-aura-accent z-20"></div>
                </>
             ) : (
               <div className="transform transition-transform duration-300 group-hover/upload:scale-110 text-gray-500 group-hover/upload:text-aura-accent">
                   <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
               </div>
             )}
             <span className="text-[9px] text-gray-400 uppercase tracking-widest group-hover/upload:text-white transition-colors">Add Asset</span>
             <input type="file" accept="image/*,video/*,.heic" multiple className="hidden" onChange={handleFile} />
           </label>
         )}
       </div>
       <p className="text-[10px] text-gray-600 mt-2 leading-tight">
         Tip: Upload 3+ hoeken (Voor, Zij, 45°) voor maximale biometrische getrouwheid.
       </p>
    </div>
  );
};

export const Collapsible = ({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children?: React.ReactNode; 
  defaultOpen?: boolean; 
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-6 border border-white/10 rounded-xl overflow-hidden bg-black/20 transition-all duration-300 hover:border-white/20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="text-xs font-bold text-white uppercase tracking-wider">{title}</span>
        <span className={`transform transition-transform duration-500 ${isOpen ? 'rotate-180 text-aura-accent' : 'text-gray-500'}`}>
           ▼
        </span>
      </button>
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
         <div className="p-4 border-t border-white/5">
            {children}
         </div>
      </div>
    </div>
  );
};

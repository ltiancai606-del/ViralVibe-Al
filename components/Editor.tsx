import React, { useState, useRef, useEffect } from 'react';
import { GeneratedResult, TrendStyle, UploadedContent, MediaType } from '../types';
import { Button } from './Button';

interface EditorProps {
  content: UploadedContent;
  trend: TrendStyle;
  initialResult: GeneratedResult;
  onSave: (finalResult: GeneratedResult) => void;
  onCancel: () => void;
  onRegenerate: (type: 'caption' | 'overlay') => Promise<string | { title: string; caption: string; hashtags: string[] }>;
}

export const Editor: React.FC<EditorProps> = ({ 
  content, 
  trend, 
  initialResult, 
  onSave, 
  onCancel,
  onRegenerate
}) => {
  // --- Visual State ---
  const [overlayColor] = useState(initialResult.overlayColor || trend.colorHex);
  
  // Crop / Pan / Zoom State
  const [zoom, setZoom] = useState(initialResult.zoom || 1);
  const [pan, setPan] = useState({ x: initialResult.panX || 0, y: initialResult.panY || 0 });
  
  // Overlay Position State (Relative to center)
  const [overlayPos, setOverlayPos] = useState({ x: initialResult.overlayX || 0, y: initialResult.overlayY || 0 });

  // Interaction State
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragTarget, setDragTarget] = useState<'image' | 'overlay' | null>(null);
  
  // Refs for gesture calculations
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistRef = useRef<number | null>(null);
  
  // --- Gesture Helpers ---
  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const clampZoom = (val: number) => Math.min(Math.max(val, 0.5), 5);

  // --- Event Handlers ---

  // Mouse Wheel (Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // Prevent page scroll if needed, though overflow-hidden usually handles it
    const delta = -e.deltaY * 0.002;
    setZoom(z => clampZoom(z + delta));
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent, target: 'image' | 'overlay') => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(target);
    lastTouchRef.current = { x: e.clientX, y: e.clientY };
  };

  // Touch Start
  const handleTouchStart = (e: React.TouchEvent, target: 'image' | 'overlay') => {
    // If 2 fingers, it's a pinch (zoom) operation on the container/image
    if (e.touches.length === 2) {
      setDragTarget('image'); // Implicitly target image for zooming
      lastDistRef.current = getDistance(e.touches);
    } else if (e.touches.length === 1) {
      e.stopPropagation(); // Stop propagation if we hit the overlay
      setDragTarget(target);
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Global Move Handler (attached to container or window via event listener in theory, but here on wrapper)
  const handleMove = (clientX: number, clientY: number) => {
    if (!dragTarget || !lastTouchRef.current) return;

    const dx = clientX - lastTouchRef.current.x;
    const dy = clientY - lastTouchRef.current.y;

    if (dragTarget === 'image') {
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    } else if (dragTarget === 'overlay') {
      setOverlayPos(p => ({ x: p.x + dx, y: p.y + dy }));
    }

    lastTouchRef.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragTarget) return;
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Handle Pinch
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches);
      if (lastDistRef.current) {
        const scaleChange = dist / lastDistRef.current;
        setZoom(z => clampZoom(z * scaleChange));
      }
      lastDistRef.current = dist;
      return;
    }

    // Handle Drag
    if (dragTarget && e.touches.length === 1) {
      // e.preventDefault(); // Often needed to prevent scrolling, but handled by touch-action css
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    setDragTarget(null);
    lastTouchRef.current = null;
    lastDistRef.current = null;
  };

  // --- Content State ---
  const [overlayText, setOverlayText] = useState(initialResult.overlayText || "");
  const [title, setTitle] = useState(initialResult.title || "");
  const [caption, setCaption] = useState(initialResult.caption || "");
  const formatHashtags = (tags: string[]) => (tags || []).map(t => t.startsWith('#') ? t : `#${t}`).join('');
  const [hashtagsString, setHashtagsString] = useState(formatHashtags(initialResult.hashtags));
  const [regenerating, setRegenerating] = useState<'caption' | 'overlay' | null>(null);

  // --- Actions ---
  const handleRegenerateClick = async (type: 'caption' | 'overlay') => {
    if (regenerating) return;
    setRegenerating(type);
    try {
      const result = await onRegenerate(type);
      
      if (type === 'caption' && typeof result === 'object') {
        // Handle structured caption result
        setTitle(result.title);
        setCaption(result.caption);
        setHashtagsString(formatHashtags(result.hashtags));
      } else if (type === 'overlay' && typeof result === 'string') {
        // Handle simple string result for overlay
        setOverlayText(result);
      }
    } catch (e) {
      alert('生成失败，请重试');
    } finally {
      setRegenerating(null);
    }
  };

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setOverlayPos({ x: 0, y: 0 });
  };

  const handleSave = () => {
    const parsedHashtags = hashtagsString.split('#').filter(t => t.trim() !== '').map(t => `#${t}`);
    
    // Capture container dimensions for later reconstruction
    const containerWidth = containerRef.current?.offsetWidth || 350;
    const containerHeight = containerRef.current?.offsetHeight || 350;

    const finalResult: GeneratedResult = {
      ...initialResult,
      title,
      caption,
      hashtags: parsedHashtags,
      overlayText,
      overlayColor,
      visualStyle: trend.visualStyle,
      zoom,
      panX: pan.x,
      panY: pan.y,
      overlayX: overlayPos.x,
      overlayY: overlayPos.y,
      // Persist essential data for history reconstruction
      base64: content.base64,
      originalWidth: content.width,
      originalHeight: content.height,
      containerWidth,
      containerHeight
    };
    onSave(finalResult);
  };

  // Calculate container styles based on image aspect ratio
  // If no width/height (shouldn't happen with new upload), fall back to square or auto
  const aspectRatio = content.width && content.height ? `${content.width} / ${content.height}` : 'auto';
  
  return (
    <div className="flex flex-col h-full animate-fade-in"
         onMouseUp={handleEnd}
         onMouseLeave={handleEnd}
         onTouchEnd={handleEnd}
         onTouchCancel={handleEnd}
         onMouseMove={handleMouseMove}
         onTouchMove={handleTouchMove}
    >
      {/* --- Top: Preview Area --- */}
      <div className="w-full px-4 pt-4 pb-2 flex justify-center">
         <div 
          ref={containerRef}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-black/50 touch-none select-none"
          style={{ 
            width: '100%', 
            maxWidth: '380px', // Standard mobile width equivalent
            aspectRatio: aspectRatio,
            maxHeight: '65vh', // Prevent it from getting too tall
            cursor: dragTarget === 'image' ? 'grabbing' : 'grab' 
          }} 
          onWheel={handleWheel}
          onMouseDown={(e) => handleMouseDown(e, 'image')}
          onTouchStart={(e) => handleTouchStart(e, 'image')}
        >
          {/* Reset Button */}
          <button
            onClick={handleReset}
            onTouchEnd={handleReset}
            className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-black/50 text-white/90 backdrop-blur-md border border-white/10 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-lg active:scale-90"
            title="一键还原"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
             </svg>
          </button>

          {/* Image Layer */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden relative pointer-events-none">
            <div 
               className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear will-change-transform"
               style={{ 
                 transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                 transformOrigin: 'center center',
               }}
            >
              {content.type === MediaType.VIDEO ? (
                <video 
                  src={content.previewUrl} 
                  className="max-w-none max-h-none object-contain w-full h-full" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                />
              ) : (
                <img 
                  src={content.base64 ? `data:image/jpeg;base64,${content.base64}` : content.previewUrl} 
                  className="max-w-none max-h-none object-contain w-full h-full" 
                  alt="Preview" 
                />
              )}
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none"></div>
          
          {/* Overlay Text Layer */}
          <div 
             className="absolute top-1/2 left-1/2 cursor-move z-20 touch-none"
             style={{ 
                transform: `translate(-50%, -50%) translate(${overlayPos.x}px, ${overlayPos.y}px)`,
                cursor: dragTarget === 'overlay' ? 'grabbing' : 'grab'
             }}
             onMouseDown={(e) => handleMouseDown(e, 'overlay')}
             onTouchStart={(e) => handleTouchStart(e, 'overlay')}
          >
             <div 
                className="px-5 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-lg text-white font-bold text-lg whitespace-nowrap select-none"
                style={{ backgroundColor: `${overlayColor}90` }}
             >
               {overlayText} {trend.emoji}
             </div>
          </div>

          <div className="absolute top-4 left-0 right-12 flex justify-center pointer-events-none pr-4">
             <span className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur border border-white/20">
               👆 拖拽画面 / 滚轮双指缩放 / 拖拽文字
             </span>
          </div>
        </div>
      </div>

      {/* --- Bottom: Controls Area --- */}
      <div className="flex-1 px-4 overflow-y-auto pb-48 mt-4">
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-t-3xl p-5 min-h-full">
           
             <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs text-slate-400">花字文案</label>
                     <button onClick={() => handleRegenerateClick('overlay')} disabled={regenerating !== null} className="text-xs text-rose-400 flex items-center gap-1">
                       <span className={regenerating === 'overlay' ? 'animate-spin' : ''}>🔄</span> 换一句
                     </button>
                   </div>
                   <input 
                     type="text" 
                     value={overlayText}
                     onChange={(e) => setOverlayText(e.target.value)}
                     className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none"
                     maxLength={12}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-xs text-slate-400">标题</label>
                   <input 
                     type="text" 
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none font-bold"
                     placeholder="输入标题..."
                   />
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs text-slate-400">正文文案</label>
                     <button onClick={() => handleRegenerateClick('caption')} disabled={regenerating !== null} className="text-xs text-rose-400 flex items-center gap-1">
                       <span className={regenerating === 'caption' ? 'animate-spin' : ''}>🔄</span> 重写
                     </button>
                   </div>
                   <textarea 
                     value={caption}
                     onChange={(e) => setCaption(e.target.value)}
                     className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-rose-500 outline-none resize-none text-sm leading-relaxed"
                   />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400">话题标签</label>
                  <input 
                    type="text"
                    value={hashtagsString}
                    onChange={(e) => setHashtagsString(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-rose-400 focus:border-rose-500 outline-none text-sm"
                  />
                </div>
             </div>

           <div className="mt-8 flex gap-3">
             <Button variant="ghost" onClick={onCancel} className="flex-1">取消</Button>
             <Button variant="primary" onClick={handleSave} className="flex-[2]">保存发布</Button>
           </div>
        </div>
      </div>
    </div>
  );
};
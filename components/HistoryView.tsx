import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Button } from './Button';

interface HistoryViewProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onEdit: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onDelete, onEdit }) => {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper to split caption
  const splitCaption = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return { title: '', content: '' };
    const title = lines[0];
    const content = lines.slice(1).join('\n\n');
    return { title, content };
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}已复制`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId === id) {
      // Confirmed deletion
      onDelete(id);
      setDeletingId(null);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } else {
      // First click: prompt for confirmation
      setDeletingId(id);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => {
        setDeletingId((current) => current === id ? null : current);
      }, 3000);
    }
  };

  const getImageSrc = (item: HistoryItem) => {
    // Prefer base64 if available (persistent), fallback to previewUrl (blob, might expire)
    if (item.base64) return `data:image/jpeg;base64,${item.base64}`;
    return item.previewUrl;
  };

  const handleDownloadImage = async (item: HistoryItem) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = getImageSrc(item);
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Use original image dimensions for best quality
      // If we don't have stored original dims, use the image's natural dims
      const originalW = item.originalWidth || img.naturalWidth;
      const originalH = item.originalHeight || img.naturalHeight;
      
      canvas.width = originalW;
      canvas.height = originalH;

      // Draw Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reconstruct Transform
      // The transforms (pan, zoom) stored in item were relative to the containerWidth/Height in Editor.
      // We need to scale them to the full resolution canvas.
      
      const containerW = item.containerWidth || 350; // Fallback to approx mobile width
      // Scale factor from Editor coordinate system to Canvas coordinate system
      // Note: The Editor displays image with object-contain. 
      // This means the image is fit within containerW x containerH maintaining aspect ratio.
      // Usually Editor sets container aspectRatio to match image, so width matches containerWidth.
      const scaleRatio = canvas.width / containerW;

      const panX = (item.panX || 0) * scaleRatio;
      const panY = (item.panY || 0) * scaleRatio;
      const zoom = item.zoom || 1;
      const overlayX = (item.overlayX || 0) * scaleRatio;
      const overlayY = (item.overlayY || 0) * scaleRatio;

      // Draw Image with transforms
      // Transform origin is center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      
      // Reset transform for overlay
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Draw Overlay Text
      if (item.overlayText) {
         ctx.translate(canvas.width / 2, canvas.height / 2);
         ctx.translate(overlayX, overlayY);
         
         // Style similar to Editor
         const fontSize = 18 * scaleRatio; // Base font size 18 scaled up
         ctx.font = `bold ${fontSize}px sans-serif`;
         ctx.textBaseline = 'middle';
         ctx.textAlign = 'center';
         
         const text = `${item.overlayText} ${item.visualStyle === '多巴胺' ? '🔥' : '✨'}`; // Approximate emoji logic if not stored
         const metrics = ctx.measureText(text);
         const paddingX = 20 * scaleRatio;
         const paddingY = 10 * scaleRatio;
         const bgWidth = metrics.width + paddingX * 2;
         const bgHeight = fontSize * 1.8 + paddingY * 2; // Rough height approx

         // Draw rounded rect background
         ctx.fillStyle = (item.overlayColor || '#000000') + '90'; // Add transparency
         
         // Simple rounded rect path
         const r = 12 * scaleRatio;
         const x = -bgWidth / 2;
         const y = -bgHeight / 4; // Adjust vertical centering
         
         ctx.beginPath();
         ctx.roundRect(x, y, bgWidth, bgHeight * 0.6, r);
         ctx.fill();

         // Draw Text
         ctx.fillStyle = '#ffffff';
         ctx.fillText(text, 0, y + bgHeight * 0.3 + 2); // vertical nudge
      }

      // Download
      const link = document.createElement('a');
      link.download = `viralvibe-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();

    } catch (e) {
      console.error("Save image failed", e);
      alert("保存图片失败，请重试");
    }
  };

  return (
    <div className="p-4 pb-32 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">我的发布</h2>
        <p className="text-slate-400 text-sm">记录每一个爆款瞬间</p>
      </div>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 glass-card rounded-3xl border-dashed border-2 border-slate-700">
          <div className="text-4xl mb-4 grayscale opacity-30">🖼️</div>
          <p>暂无发布记录</p>
        </div>
      ) : (
        <div className="columns-2 gap-3 space-y-3">
          {history.map((item) => (
            <div 
               key={item.id} 
               onClick={() => setSelectedItem(item)}
               className="break-inside-avoid glass-card rounded-2xl overflow-hidden group hover:ring-2 hover:ring-rose-500/50 transition-all cursor-pointer active:scale-95"
            >
              <div className="relative">
                <img 
                  src={getImageSrc(item)} 
                  className="w-full object-cover pointer-events-none" 
                  alt="History thumbnail"
                  style={{ 
                    transform: `scale(${item.zoom ?? 1}) translate(${(item.panX ?? 0) / (item.zoom ?? 1)}px, ${(item.panY ?? 0) / (item.zoom ?? 1)}px)`,
                    transformOrigin: 'center center'
                  }} 
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                 <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                   <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-md border border-white/10 truncate block">
                     {item.overlayText}
                   </span>
                 </div>
                 <button 
                   onClick={(e) => handleDelete(e, item.id)}
                   className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-colors z-10 ${
                     deletingId === item.id 
                       ? 'bg-red-600 text-white px-3 text-xs font-bold' 
                       : 'bg-black/40 text-white/70 hover:bg-red-500 hover:text-white'
                   }`}
                 >
                   {deletingId === item.id ? (
                     "确认删除"
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                       <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                     </svg>
                   )}
                 </button>
              </div>
              
              <div className="p-3">
                <div className="text-[10px] text-rose-400 font-bold mb-1 uppercase tracking-wide">{item.visualStyle}</div>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed opacity-90">{item.caption}</p>
                <div className="pt-2 mt-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
                   <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                   <span>查看详情 &gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Screen Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                 <h3 className="text-white font-bold">作品详情</h3>
                 <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white p-2">✕</button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-0">
                 {/* Image Preview Area - Reusing Editor Visual Logic */}
                 <div className="w-full bg-black/50 relative overflow-hidden flex items-center justify-center border-b border-slate-800"
                      style={{ aspectRatio: `${selectedItem.originalWidth || 1} / ${selectedItem.originalHeight || 1}`, maxHeight: '50vh' }}>
                    
                    <div 
                      className="w-full h-full relative"
                      style={{ 
                          // Use a wrapper to apply container-relative transforms visually
                          // Since we don't have the exact container ref size here, we use percentage based on stored values if possible,
                          // but since panX/Y are pixels, we assume the preview here is roughly same size as Editor or just render normally.
                          // Actually, simply applying the transform to the img usually works visually enough for preview.
                        }}
                    >
                         <img 
                            src={getImageSrc(selectedItem)} 
                            className="w-full h-full object-contain"
                            style={{ 
                                transform: `translate(${selectedItem.panX}px, ${selectedItem.panY}px) scale(${selectedItem.zoom})`,
                                transformOrigin: 'center center'
                            }}
                         />
                         
                         {/* Overlay Text */}
                         <div 
                             className="absolute top-1/2 left-1/2 z-20"
                             style={{ 
                                transform: `translate(-50%, -50%) translate(${selectedItem.overlayX}px, ${selectedItem.overlayY}px)`,
                             }}
                         >
                             <div 
                                className="px-5 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-lg text-white font-bold text-lg whitespace-nowrap"
                                style={{ backgroundColor: `${selectedItem.overlayColor}90` }}
                             >
                               {selectedItem.overlayText}
                             </div>
                         </div>
                    </div>
                 </div>

                 <div className="p-5 space-y-6">
                    {/* Title Section */}
                    <div className="space-y-2">
                       <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">标题</label>
                       <div className="flex gap-2">
                          <div className="bg-slate-800 rounded-xl p-3 text-sm text-white flex-1 font-bold">
                             {selectedItem.title || splitCaption(selectedItem.caption).title}
                          </div>
                          <Button variant="secondary" onClick={() => copyText(selectedItem.title || splitCaption(selectedItem.caption).title, "标题")} className="!px-3 !py-2 shrink-0">
                             复制
                          </Button>
                       </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-2">
                       <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">正文内容</label>
                       <div className="flex gap-2 items-start">
                          <div className="bg-slate-800 rounded-xl p-3 text-sm text-slate-300 flex-1 whitespace-pre-wrap leading-relaxed h-32 overflow-y-auto">
                             {selectedItem.title ? selectedItem.caption : splitCaption(selectedItem.caption).content}
                          </div>
                          <Button variant="secondary" onClick={() => copyText(selectedItem.title ? selectedItem.caption : splitCaption(selectedItem.caption).content, "正文")} className="!px-3 !py-2 shrink-0">
                             复制
                          </Button>
                       </div>
                    </div>

                    {/* Hashtags Section */}
                    <div className="space-y-2">
                       <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">话题标签</label>
                       <div className="flex gap-2">
                          <div className="bg-slate-800 rounded-xl p-3 text-sm text-rose-400 flex-1 truncate">
                             {selectedItem.hashtags.join(' ')}
                          </div>
                          <Button variant="secondary" onClick={() => copyText(selectedItem.hashtags.join(' '), "话题")} className="!px-3 !py-2 shrink-0">
                             复制
                          </Button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
                 <Button variant="outline" fullWidth onClick={() => onEdit(selectedItem)}>
                    ✏️ 编辑
                 </Button>
                 <Button variant="primary" fullWidth onClick={() => {
                     const fullText = `${selectedItem.title ? selectedItem.title + '\n\n' : ''}${selectedItem.caption}\n\n${selectedItem.hashtags.join(' ')}`;
                     copyText(fullText, "全部文案");
                 }}>
                    📋 复制全部
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
import React, { useRef } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="group relative w-full h-72 rounded-3xl p-[2px] cursor-pointer transition-all duration-300 hover:scale-[1.01]"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/50 via-slate-700 to-purple-500/50 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      {/* Content */}
      <div className="relative w-full h-full bg-slate-900/90 backdrop-blur-xl rounded-[22px] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
         {/* Decorative Grid */}
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
         </div>

         <div className="z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300 border border-slate-600/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-rose-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 1 5.25 21h13.5A2.25 2.25 0 0 1 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
              点击上传内容
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              支持 JPG, PNG, MP4 格式
            </p>
            
            <div className="px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
               ✨ AI 智能分析
            </div>
         </div>
         
         <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
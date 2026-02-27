import React from 'react';
import { TrendStyle, WebSource } from '../types';
import { Button } from './Button';

interface TrendGridProps {
  trends: TrendStyle[];
  sources: WebSource[];
  onSelect: (trend: TrendStyle) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const TrendGrid: React.FC<TrendGridProps> = ({ 
  trends, 
  sources, 
  onSelect, 
  onLoadMore, 
  isLoadingMore = false 
}) => {
  return (
    <div className="w-full pb-28">
      {/* 2-Column Grid on Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-6">
        {trends.map((trend) => (
          <div 
            key={trend.id}
            onClick={() => onSelect(trend)}
            className="glass-card rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:border-rose-500/50 hover:-translate-y-1 active:scale-95 flex flex-col justify-between min-h-[160px] relative overflow-hidden group"
          >
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0"></div>
            <div 
              className="absolute top-0 right-0 w-20 h-20 opacity-20 blur-2xl z-0 rounded-full group-hover:opacity-40 transition-opacity"
              style={{ backgroundColor: trend.colorHex }}
            ></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl filter drop-shadow-md">{trend.emoji}</span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
                {trend.title}
              </h3>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {trend.description}
              </p>
            </div>
            
            <div className="relative z-10 mt-3 pt-2 border-t border-slate-700/50">
               <div className="text-[10px] text-rose-300 font-mono truncate">
                 ✨ "{trend.suggestedOverlayText}"
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {onLoadMore && (
        <div className="flex justify-center mb-8">
           <Button 
             variant="secondary" 
             onClick={onLoadMore} 
             disabled={isLoadingMore}
             className="!px-8 !py-2 !text-xs !bg-slate-800/80 backdrop-blur"
           >
             {isLoadingMore ? (
               <>
                 <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></span>
                 正在寻找更多灵感...
               </>
             ) : (
               <>🔄 换一批风格</>
             )}
           </Button>
        </div>
      )}

      {sources.length > 0 && (
        <div className="glass rounded-xl p-4 animate-fade-in border-slate-800">
           <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">🔥 实时热点来源</h4>
           <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-full border border-slate-700 flex items-center gap-1 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
                >
                  <span className="opacity-50">🔗</span> {source.title}
                </a>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
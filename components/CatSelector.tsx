import React from 'react';
import { CatProfile } from '../types';

interface CatSelectorProps {
  cats: CatProfile[];
  selectedCatIds: string[];
  onToggleCat: (catId: string) => void;
}

export const CatSelector: React.FC<CatSelectorProps> = ({ cats, selectedCatIds, onToggleCat }) => {
  if (cats.length === 0) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
        <span>🐱</span> 谁在画面里？
        <span className="text-xs font-normal text-slate-500">(选中的猫咪将用于生成个性化文案)</span>
      </h3>
      <div className="flex flex-wrap gap-3">
        {cats.map(cat => (
          <button
            key={cat.id}
            onClick={() => onToggleCat(cat.id)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
              ${selectedCatIds.includes(cat.id) 
                ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg shadow-rose-500/10' 
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }
            `}
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-lg ${!cat.avatar ? 'bg-slate-700' : ''}`}>
              {cat.avatar ? (
                <img src={cat.avatar} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                cat.gender === 'boy' ? '😼' : '😺'
              )}
            </div>
            <span className="font-medium text-sm">{cat.name}</span>
            {selectedCatIds.includes(cat.id) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border border-slate-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { AppTab } from '../types';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: AppTab.CREATE, label: '创作', icon: (active: boolean) => active ? '✨' : '✨' },
    { id: AppTab.POSTS, label: '发布', icon: (active: boolean) => active ? '🖼️' : '🖼️' },
    { id: AppTab.PROFILE, label: '我的', icon: (active: boolean) => active ? '👤' : '👤' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 pointer-events-none flex justify-center">
      <div className="glass w-full max-w-sm rounded-full pointer-events-auto shadow-2xl shadow-black/50">
        <div className="flex justify-around items-center h-16 px-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex flex-col items-center justify-center w-full h-full transition-all duration-300`}
              >
                {isActive && (
                  <div className="absolute top-1 w-8 h-1 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.7)]" />
                )}
                <span className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'opacity-60 group-hover:opacity-100'}`}>
                  {tab.icon(isActive)}
                </span>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
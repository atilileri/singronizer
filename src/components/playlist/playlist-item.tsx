import React from 'react';

interface PlaylistItemProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
  isSpecialAction?: boolean;
}

export function PlaylistItem({ title, subtitle, imageUrl, isSelected, onClick, isSpecialAction }: PlaylistItemProps) {
  if (isSpecialAction) {
    return (
      <div 
        onClick={onClick}
        className="group flex items-center p-2 bg-primary text-on-primary hover:bg-zinc-800 transition-all cursor-pointer mb-2"
      >
        <div className="w-10 h-10 border border-on-primary/20 flex items-center justify-center mr-3">
          <span className="material-symbols-outlined text-xl">add</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold truncate leading-tight">{title}</p>
          <p className="text-[9px] text-on-primary/70 uppercase tracking-tighter">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`group flex items-center p-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-l-2 border-primary bg-surface-container-lowest' 
          : 'hover:bg-surface-container-highest'
      }`}
    >
      <div className="w-10 h-10 bg-surface-dim mr-3 overflow-hidden">
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-highest text-outline">
            <span className="material-symbols-outlined text-lg opacity-50">music_note</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate leading-tight">{title}</p>
        <p className={`text-[9px] uppercase tracking-tighter ${isSelected ? 'text-on-surface-variant' : 'text-on-surface-variant'}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

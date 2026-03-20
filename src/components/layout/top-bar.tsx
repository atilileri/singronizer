'use client';
import React from "react";

export function TopBar() {
  return (
    <header className="flex justify-between items-center w-full px-8 py-4 max-w-full bg-background text-on-surface font-['Inter'] antialiased text-sm tracking-tight fixed top-0 z-50 border-b border-outline-variant/10">
      <div className="text-2xl font-black tracking-tighter text-primary">singronizer</div>
      <div className="flex items-center gap-6">
        <button className="text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors px-2 py-1 text-on-surface">
          buy me a coffee
        </button>
      </div>
    </header>
  );
}

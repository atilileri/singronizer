'use client';
import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="flex justify-between items-center w-full px-8 py-4 max-w-full bg-background text-on-surface font-['Inter'] antialiased text-sm tracking-tight fixed top-0 z-50 border-b border-outline-variant/10">
      <div className="text-2xl font-black tracking-tighter text-primary">singronizer</div>
      <div className="flex items-center gap-6">
        <button className="text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors px-2 py-1 text-on-surface">
          buy me a coffee
        </button>
        <div className="flex items-center gap-3">
          {!session ? (
            <button 
              onClick={() => signIn()} 
              className="bg-primary text-on-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </button>
          ) : (
            <>
              <button 
                onClick={() => signOut()} 
                className="text-[10px] font-bold uppercase tracking-widest hover:underline px-2 py-1"
              >
                Sign Out
              </button>
              <div className="w-8 h-8 rounded-full bg-surface-dim overflow-hidden border border-outline-variant/20 flex items-center justify-center">
                {session.user?.image ? (
                  <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-outline">person</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

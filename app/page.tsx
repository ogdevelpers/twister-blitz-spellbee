'use client';

import React from 'react';
import GameInterface from '@/components/GameInterface';
import { Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f172a] to-black text-white overflow-hidden font-sans">
      
      {/* Animated Background Elements - Optimized with will-change and reduced motion */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-10 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] will-change-transform"
          style={{ transform: 'translateZ(0)' }}
        />
        <motion.div 
          animate={{ x: [0, -70, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-600/20 rounded-full blur-[100px] will-change-transform"
          style={{ transform: 'translateZ(0)' }}
        />
        <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full will-change-transform"
           style={{ transform: 'translateZ(0)' }}
        />
      </div>

      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-800/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center space-x-4 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-xl shadow-lg transform -rotate-6">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 game-font drop-shadow-sm">
                Twister<span className="text-pink-500">Blitz</span>
              </h1>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 py-6 px-4">
        <GameInterface />
      </main>
      
      <footer className="relative z-10 py-6 text-center">
        <div className="inline-block bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
           <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
             Powered by Spellbee
           </p>
        </div>
      </footer>
    </div>
  );
}


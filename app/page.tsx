'use client';

import React from 'react';
import GameInterface from '@/components/GameInterface';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="w-[1080px] h-[1920px] text-white overflow-hidden relative" style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/fonts/img/games-ui-03.jpg)'
        }}
      />
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-0 bg-black/40" />
      
      {/* Animated Background Elements - Optimized with will-change and reduced motion */}
      <div className="absolute inset-0 pointer-events-none z-0">
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
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
           style={{ 
             transform: 'translateZ(0) translate(-50%, -50%)',
             width: '800px',
             height: '800px',
             border: '1px solid rgba(255, 255, 255, 0.05)',
             borderRadius: '9999px'
           }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
        <GameInterface />
      </main>
    </div>
  );
}


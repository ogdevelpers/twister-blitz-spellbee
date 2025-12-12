'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Flame } from 'lucide-react';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelect }) => {
  const difficulties: Array<{ level: Difficulty; label: string; icon: React.ReactNode; color: string; description: string }> = [
    {
      level: 'Easy',
      label: 'Easy',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-600',
      description: 'Perfect for beginners! Short and simple phrases.'
    },
    {
      level: 'Medium',
      label: 'Medium',
      icon: <Target className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-600',
      description: 'A balanced challenge! Moderate length and complexity.'
    },
    {
      level: 'Hard',
      label: 'Hard',
      icon: <Flame className="w-8 h-8" />,
      color: 'from-red-500 to-pink-600',
      description: 'For the brave! Long and extremely challenging phrases.'
    }
  ];

  return (
    <div className="w-full mx-auto p-4 flex flex-col items-center gap-6 h-full justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 game-font">
          Choose Your Challenge
        </h2>
        <p className="text-slate-400 text-lg font-medium">
          Select a difficulty level to begin your tongue-twisting adventure!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
        {difficulties.map((difficulty, index) => (
          <motion.button
            key={difficulty.level}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(difficulty.level)}
            className={`relative group bg-gradient-to-br ${difficulty.color} p-1 rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.3)] hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] transition-all duration-300 active:shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1`}
          >
            <div className="bg-slate-900 rounded-[1.4rem] p-6 flex flex-col items-center space-y-3 h-full">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${difficulty.color} shadow-lg transform group-hover:rotate-6 transition-transform`}>
                {difficulty.icon}
              </div>
              <h3 className="text-2xl font-black text-white game-font uppercase">
                {difficulty.label}
              </h3>
              <p className="text-slate-400 text-sm text-center font-medium leading-relaxed">
                {difficulty.description}
              </p>
              <div className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 group-hover:from-white/20 group-hover:to-white/10 transition-all">
                <span className="text-white font-bold text-base">Start</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;


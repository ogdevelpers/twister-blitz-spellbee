'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelect }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const difficulties: Array<{ 
    level: Difficulty; 
    label: string; 
    indicatorColor: string; 
    description: string;
    wordPairs: string;
  }> = [
    {
      level: 'Easy',
      label: 'Easy',
      indicatorColor: 'bg-green-500',
      description: 'Perfect for beginners',
      wordPairs: '10 word pairs'
    },
    {
      level: 'Medium',
      label: 'Medium',
      indicatorColor: 'bg-yellow-500',
      description: 'Challenge yourself',
      wordPairs: '10 word pairs'
    },
    {
      level: 'Hard',
      label: 'Hard',
      indicatorColor: 'bg-red-500',
      description: 'Expert level',
      wordPairs: '10 word pairs'
    }
  ];

  const handleDifficultyClick = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleStartGame = () => {
    if (selectedDifficulty) {
      onSelect(selectedDifficulty);
    }
  };

  return (
    <div className="w-full mx-auto p-6 flex flex-col items-center gap-8 h-full justify-center">
      {/* Central Dark Panel */}
      <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-8 w-full max-w-5xl border border-slate-700/50 shadow-2xl" style={{marginTop: '250px'}}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-white mb-3 game-font">
            Select Difficulty Level
          </h2>
        </motion.div>

        {/* Difficulty Boxes */}
        <div className="flex flex-row gap-4 w-full justify-center mb-8">
          {difficulties.map((difficulty, index) => {
            const isSelected = selectedDifficulty === difficulty.level;
            return (
              <motion.button
                key={difficulty.level}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDifficultyClick(difficulty.level)}
                className={`relative flex-1 bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 shadow-lg ${
                  isSelected 
                    ? 'border-cyan-400 bg-slate-800' 
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                style={isSelected ? { boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.2)' } : {}}
              >
                <div className="flex flex-col items-center space-y-3">
                  {/* Circular Indicator */}
                  <div className={`w-14 h-14 ${difficulty.indicatorColor} rounded-full flex items-center justify-center shadow-lg`} />
                  
                  {/* Difficulty Label */}
                  <h3 className="text-xl font-bold text-white game-font">
                    {difficulty.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-slate-300 text-sm text-center font-medium">
                    {difficulty.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* START GAME Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartGame}
          disabled={!selectedDifficulty}
          className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
            selectedDifficulty 
              ? 'opacity-100 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <span className="text-xl uppercase tracking-wide">START GAME</span>
          <Rocket className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default DifficultySelector;


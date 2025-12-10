'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Star, Frown, Trophy, BrainCircuit, Timer, Zap } from 'lucide-react';
import { TwisterChallenge, GameState, SpokenStatement } from '@/types';
import { generateTwister } from '@/services/twisterService';
import VoiceInput from './VoiceInput';
import DifficultySelector, { Difficulty } from './DifficultySelector';

const TARGET_SCORE = 5;
const GAME_DURATION = 60; // seconds

const GameInterface: React.FC = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    timeLeft: GAME_DURATION,
    currentTwister: null,
  });

  const [isLoadingTwister, setIsLoadingTwister] = useState(false);
  const [comboFlash, setComboFlash] = useState(false);
  const [spokenStatements, setSpokenStatements] = useState<SpokenStatement[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const confettiFiredRef = useRef(false);

  const fetchNewTwister = useCallback(async (difficulty: Difficulty) => {
    setIsLoadingTwister(true);
    const twister = await generateTwister(difficulty);
    setGameState(prev => ({
      ...prev,
      currentTwister: twister,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'idle'
    }));
    setSpokenStatements([]); // Reset statements when new twister is loaded
    setIsLoadingTwister(false);
  }, []);

  const handleDifficultySelect = useCallback(async (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    await fetchNewTwister(difficulty);
  }, [fetchNewTwister]);

  // Optimized Timer Logic - only depends on status to avoid unnecessary restarts
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (gameState.status === 'playing') {
      const startTime = Date.now();
      const startValue = gameState.timeLeft;
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, startValue - elapsed);
        
        setGameState(prev => {
          if (prev.status !== 'playing') {
            return prev; // Don't update if status changed
          }
          if (newTimeLeft === 0) {
            return { ...prev, status: 'failed', timeLeft: 0 };
          }
          if (prev.timeLeft !== newTimeLeft) {
            return { ...prev, timeLeft: newTimeLeft };
          }
          return prev;
        });
      }, 100); // Update every 100ms for smoother visual updates
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.status]); // Only depend on status, not timeLeft

  // Win Condition - optimized
  useEffect(() => {
    if (gameState.score >= TARGET_SCORE && gameState.status === 'playing' && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      setGameState(prev => ({ ...prev, status: 'success' }));
      fireConfetti();
    }
  }, [gameState.score, gameState.status]);

  // Reset confetti flag when game resets
  useEffect(() => {
    if (gameState.status !== 'success') {
      confettiFiredRef.current = false;
    }
  }, [gameState.status]);

  const fireConfetti = useCallback(() => {
    const duration = 2000; // Reduced duration for better performance
    const end = Date.now() + duration;
    let animationFrameId: number | null = null;

    const frame = () => {
      confetti({
        particleCount: 6, // Reduced particle count
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f472b6', '#22d3ee', '#facc15']
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f472b6', '#22d3ee', '#facc15']
      });

      if (Date.now() < end) {
        animationFrameId = requestAnimationFrame(frame);
      } else {
        animationFrameId = null;
      }
    };

    animationFrameId = requestAnimationFrame(frame);
  }, []);

  const startGame = useCallback(async () => {
    // Request microphone permission before starting the game
    try {
      if (navigator.permissions && navigator.permissions.query) {
        await navigator.permissions.query({ name: 'microphone' as PermissionName });
      }
    } catch (e) {
      // Permissions API might not be supported, that's okay
      console.log('Permissions API not available, proceeding anyway');
    }
    
    setGameState(prev => ({ ...prev, status: 'playing', score: 0, timeLeft: GAME_DURATION }));
    setSpokenStatements([]); // Reset statements when starting a new game
  }, []);

  const handleMatch = useCallback(() => {
    console.log('🎉 handleMatch called!');
    setGameState(prev => {
      const newScore = prev.score + 1;
      console.log('📊 Updating score from', prev.score, 'to', newScore);
      return { ...prev, score: newScore };
    });
    setComboFlash(true);
    setTimeout(() => setComboFlash(false), 800);
  }, []);

  const handleStatementSpoken = useCallback((statement: string, isMatch: boolean) => {
    const newStatement: SpokenStatement = {
      text: statement,
      timestamp: Date.now(),
      isMatch
    };
    setSpokenStatements(prev => [...prev, newStatement]);
  }, []);

  const resetGame = useCallback(() => {
    if (selectedDifficulty) {
      fetchNewTwister(selectedDifficulty);
    }
  }, [selectedDifficulty, fetchNewTwister]);

  const retrySame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'idle', score: 0, timeLeft: GAME_DURATION }));
    setSpokenStatements([]); // Reset statements on retry
  }, []);

  // Memoize expensive computations
  const timeProgress = useMemo(() => (gameState.timeLeft / GAME_DURATION) * 100, [gameState.timeLeft]);

  // Show difficulty selector if no difficulty selected
  if (!selectedDifficulty) {
    return <DifficultySelector onSelect={handleDifficultySelect} />;
  }

  return (
    <div className="w-full h-full mx-auto flex flex-col items-center relative gap-4">
      
      {/* Combo Flash Overlay */}
      <AnimatePresence>
        {comboFlash && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 0 }}
            animate={{ scale: 1.5, opacity: 1, y: -100 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="text-6xl font-black text-yellow-400 game-font text-stroke-black drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
              AWESOME!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Stats */}
      <div className="w-full grid grid-cols-2 gap-4">
        {/* Timer Card */}
        <div className="bg-slate-800/80 p-4 rounded-3xl border-4 border-slate-700 relative overflow-hidden group shadow-[0_8px_0_#1e293b]">
          <div className="flex items-center justify-between z-10 relative">
             <div className="flex items-center space-x-2">
               <Timer className="w-6 h-6 text-purple-400" />
               <span className="text-slate-400 font-bold uppercase tracking-wider">Time Left</span>
             </div>
             <span className={`text-4xl font-black tabular-nums game-font ${gameState.timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
               {gameState.timeLeft}
             </span>
          </div>
          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 h-2 bg-purple-900/50 w-full">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${timeProgress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
              className="h-full bg-purple-500"
            />
          </div>
        </div>
        
        {/* Score Card */}
        <div className="bg-slate-800/80 p-4 rounded-3xl border-4 border-slate-700 shadow-[0_8px_0_#1e293b] flex flex-col justify-center">
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-slate-400 font-bold uppercase tracking-wider">Progress</span>
             </div>
             <span className="text-yellow-400 font-black game-font text-xl">{gameState.score} / {TARGET_SCORE}</span>
           </div>
           {/* Star Tracker */}
           <div className="flex justify-between px-2">
             {[...Array(TARGET_SCORE)].map((_, i) => (
               <motion.div 
                  key={i}
                  animate={{ scale: i < gameState.score ? [1, 1.4, 1] : 1 }}
                  transition={{ duration: 0.3 }}
               >
                 <Star 
                  className={`w-8 h-8 transition-all duration-300 ${i < gameState.score ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-slate-600'}`} 
                 />
               </motion.div>
             ))}
           </div>
        </div>
      </div>

      {/* Main Twister Area - Expands to fill available space */}
      <div className="relative w-full flex flex-col items-center justify-center perspective-1000 flex-1 min-h-0 py-8">
        <AnimatePresence mode='wait'>
          {isLoadingTwister ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="relative">
                <BrainCircuit className="w-24 h-24 text-cyan-400 animate-bounce" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/50 blur-sm rounded-full animate-pulse"></div>
              </div>
              <p className="text-cyan-300 font-bold text-2xl game-font animate-pulse">Brainstorming...</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: -90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full flex flex-col items-center"
            >
              {/* Badges */}
              <div className="flex gap-3 mb-8">
                <span className="px-4 py-1 rounded-full bg-indigo-500/20 border-2 border-indigo-500 text-indigo-300 font-bold uppercase text-sm tracking-wide shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    {gameState.currentTwister?.theme || "Random"}
                </span>
                <span className={`px-4 py-1 rounded-full border-2 font-bold uppercase text-sm tracking-wide ${
                  gameState.currentTwister?.difficulty === 'Hard' 
                  ? 'bg-red-500/20 border-red-500 text-red-300' 
                  : gameState.currentTwister?.difficulty === 'Easy'
                  ? 'bg-green-500/20 border-green-500 text-green-300'
                  : 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                }`}>
                    {gameState.currentTwister?.difficulty} Mode
                </span>
              </div>
              
              {/* The Twister Text - Enhanced to use more space */}
              <div className="relative group cursor-default w-full max-w-5xl">
                <div className="absolute -inset-8 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition duration-500"></div>
                <div className="relative bg-slate-900/80 p-12 rounded-3xl border-2 border-slate-700 backdrop-blur-xl shadow-2xl min-h-[300px] flex items-center justify-center">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl text-center font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-blue-200 leading-tight tracking-wide drop-shadow-lg px-4">
                    "{gameState.currentTwister?.text}"
                  </h1>
                </div>
              </div>

              {/* End Game Modals */}
              <AnimatePresence>
                {gameState.status === 'success' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-slate-900/60 rounded-3xl"
                  >
                    <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-1 rounded-[2rem] shadow-2xl transform hover:scale-105 transition-transform">
                      <div className="bg-slate-900 p-8 rounded-[1.8rem] flex flex-col items-center text-center space-y-4 max-w-sm">
                        <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                        <h3 className="text-4xl font-black text-white game-font uppercase italic">Victory!</h3>
                        <p className="text-slate-300 font-medium">You smashed it with lightning speed! Your tongue is untie-able!</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {gameState.status === 'failed' && (
                  <motion.div
                    initial={{ scale: 0, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-slate-900/60 rounded-3xl"
                  >
                    <div className="bg-gradient-to-b from-red-500 to-pink-600 p-1 rounded-[2rem] shadow-2xl">
                      <div className="bg-slate-900 p-8 rounded-[1.8rem] flex flex-col items-center text-center space-y-4 max-w-sm">
                        <Frown className="w-20 h-20 text-red-400 animate-pulse" />
                        <h3 className="text-4xl font-black text-white game-font uppercase italic">Time's Up!</h3>
                        <p className="text-slate-300 font-medium">So close! But your tongue got twisted. Try again!</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Input - Always mounted for proper initialization (hidden when not playing) */}
      <div className="hidden">
        <VoiceInput 
          isListening={false} 
          targetPhrase="" 
          onMatch={() => {}}
        />
      </div>

      {/* Controls Area */}
      <div className="w-full z-10 flex-shrink-0">
        {gameState.status === 'idle' ? (
          <button
            onClick={startGame}
            disabled={isLoadingTwister}
            className="w-full group relative bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-5 px-6 rounded-3xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_0_#0e7490] active:shadow-none active:translate-y-2"
          >
             <div className="flex items-center justify-center space-x-3">
               <Play className="w-7 h-7 fill-current" />
               <span className="text-2xl font-black game-font tracking-wide">START GAME</span>
             </div>
             <div className="absolute inset-0 rounded-3xl ring-4 ring-cyan-300/30 group-hover:ring-cyan-300/60 transition-all"></div>
          </button>
        ) : gameState.status === 'playing' ? (
          <VoiceInput 
            isListening={true} 
            targetPhrase={gameState.currentTwister?.text || ""} 
            onMatch={handleMatch}
            onStatementSpoken={handleStatementSpoken}
          />
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
             <button
                onClick={retrySame}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_6px_0_#1e293b] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="font-bold text-lg">Retry Same</span>
             </button>
             <button
                onClick={resetGame}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_6px_0_#831843] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span className="font-bold text-lg">Next Level</span>
             </button>
          </div>
        )}
      </div>

      {/* Spoken Statements History */}
      {gameState.status === 'playing' && spokenStatements.length > 0 && (
        <div className="w-full flex-shrink-0">
          <div className="bg-slate-800/80 p-4 rounded-2xl border-2 border-slate-700 shadow-lg">
            <h3 className="text-base font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Spoken Statements ({spokenStatements.length})
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
              <AnimatePresence>
                {spokenStatements.slice(-10).map((statement, index) => (
                  <motion.div
                    key={`${statement.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 rounded-lg border-2 ${
                      statement.isMatch
                        ? 'bg-green-500/20 border-green-500/50 text-green-200'
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">
                        "{statement.text}"
                      </p>
                      {statement.isMatch && (
                        <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                          ✓ Match
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {spokenStatements.length > 10 && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Showing last 10 statements
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 text-center text-slate-400 text-sm backdrop-blur-sm flex-shrink-0">
        <p className="font-medium">🎤 PRO TIP: Speak clearly and loudly! Say it {TARGET_SCORE} times before the purple bar runs out!</p>
      </div>

    </div>
  );
};

export default GameInterface;
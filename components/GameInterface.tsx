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
  const scoreProgress = useMemo(() => (gameState.score / TARGET_SCORE) * 100, [gameState.score]);

  // Show difficulty selector if no difficulty selected
  if (!selectedDifficulty) {
    return <DifficultySelector onSelect={handleDifficultySelect} />;
  }

  return (
    <div className="w-full h-full mx-auto flex flex-col items-center relative" style={{ gap: '24px', padding: '24px 16px' }}>
      {/* Game Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/fonts/img/games-ui-07.jpg)'
        }}
      />
      {/* Subtle overlay to enhance contrast without hiding the beautiful background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      
      {/* Combo Flash Overlay */}
      <AnimatePresence>
        {comboFlash && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 0 }}
            animate={{ scale: 1.5, opacity: 1, y: -100 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="text-6xl font-black game-font" style={{
              background: 'linear-gradient(135deg, #facc15, #fb923c, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 30px rgba(250, 204, 21, 0.8), 0 4px 0 rgba(0, 0, 0, 0.5)',
              filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.6))'
            }}>
              AWESOME!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Stats - Centered and Stacked with Glassmorphism */}
      <div className="w-full flex flex-col items-center" style={{ gap: '24px' }}>
        {/* Timer Card - Glassmorphic Design */}
        <div className="w-full max-w-md relative" style={{
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          padding: '16px'
        }}>
          <div className="flex items-center justify-between">
             <div className="flex items-center" style={{ gap: '8px' }}>
               <Timer className="w-6 h-6" style={{ color: '#a78bfa' }} />
               <span className="font-bold uppercase tracking-wider" style={{ color: '#cbd5e1', fontSize: '12px' }}>Time Left</span>
             </div>
             <span className={`text-4xl font-black tabular-nums game-font ${gameState.timeLeft < 10 ? 'animate-pulse' : ''}`}
               style={{
                 color: gameState.timeLeft < 10 ? '#ef4444' : '#ffffff',
                 textShadow: gameState.timeLeft < 10 
                   ? '0 0 20px rgba(239, 68, 68, 0.8)' 
                   : '0 0 10px rgba(255, 255, 255, 0.3)'
               }}>
               {gameState.timeLeft}
             </span>
          </div>
        </div>
        
        {/* Progress Card - Glassmorphic Design */}
        <div className="w-full max-w-md relative" style={{
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          padding: '16px'
        }}>
           <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
             <div className="flex items-center" style={{ gap: '8px' }}>
                <Trophy className="w-6 h-6" style={{ color: '#facc15' }} />
                <span className="font-bold uppercase tracking-wider" style={{ color: '#cbd5e1', fontSize: '12px' }}>Progress</span>
             </div>
             <span className="font-black game-font text-xl" style={{ 
               color: '#facc15',
               textShadow: '0 0 10px rgba(250, 204, 21, 0.5)'
             }}>{gameState.score} / {TARGET_SCORE}</span>
           </div>
           
           {/* Progress Bar - Enhanced with glow */}
           <div className="relative w-full h-6 rounded-full overflow-hidden" style={{
             marginBottom: '16px',
             background: 'rgba(51, 65, 85, 0.4)',
             border: '2px solid rgba(255, 255, 255, 0.1)',
             boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
           }}>
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${scoreProgress}%` }}
               transition={{ duration: 0.3, ease: 'easeOut' }}
               className="absolute top-0 left-0 h-full rounded-full"
               style={{
                 background: 'linear-gradient(90deg, #facc15, #fb923c, #f97316)',
                 boxShadow: '0 0 20px rgba(250, 204, 21, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
               }}
             >
               <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center z-10">
               <span className="text-xs font-bold" style={{
                 color: '#ffffff',
                 textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
               }}>
                 {Math.round(scoreProgress)}%
               </span>
             </div>
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
                  className="w-8 h-8 transition-all duration-300"
                  style={i < gameState.score ? {
                    fill: '#facc15',
                    color: '#facc15',
                    filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))'
                  } : {
                    color: '#475569',
                    opacity: 0.4
                  }}
                 />
               </motion.div>
             ))}
           </div>
        </div>
      </div>

      {/* Main Twister Area - Expands to fill available space */}
      <div className="relative w-full flex flex-col items-center justify-center perspective-1000 flex-1 min-h-0" style={{ gap: '24px' }}>
        <AnimatePresence mode='wait'>
          {isLoadingTwister ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
              style={{ gap: '24px' }}
            >
              <div className="relative">
                <BrainCircuit className="w-24 h-24 animate-bounce" style={{ color: '#22d3ee' }} />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 blur-sm rounded-full animate-pulse" style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  transform: 'translateX(-50%)'
                }}></div>
              </div>
              <p className="font-bold text-2xl game-font animate-pulse" style={{
                color: '#67e8f9',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.6)'
              }}>Brainstorming...</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: -90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full flex flex-col items-center"
              style={{ gap: '24px' }}
            >
              {/* Badges - Enhanced with glow */}
              <div className="flex" style={{ gap: '12px' }}>
                <span className="px-4 py-2 rounded-full font-bold uppercase text-sm tracking-wide" style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '2px solid rgba(99, 102, 241, 0.6)',
                  color: '#a5b4fc',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                }}>
                    {gameState.currentTwister?.theme || "Random"}
                </span>
                <span className="px-4 py-2 rounded-full border-2 font-bold uppercase text-sm tracking-wide" style={gameState.currentTwister?.difficulty === 'Hard' ? {
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: 'rgba(239, 68, 68, 0.6)',
                  color: '#fca5a5',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                } : gameState.currentTwister?.difficulty === 'Easy' ? {
                  background: 'rgba(34, 197, 94, 0.2)',
                  borderColor: 'rgba(34, 197, 94, 0.6)',
                  color: '#86efac',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'
                } : {
                  background: 'rgba(234, 179, 8, 0.2)',
                  borderColor: 'rgba(234, 179, 8, 0.6)',
                  color: '#fde047',
                  boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)'
                }}>
                    {gameState.currentTwister?.difficulty} Mode
                </span>
              </div>
              
              {/* The Twister Text - Glassmorphic card with warm glow */}
              <div className="relative group cursor-default w-full max-w-5xl">
                <div className="absolute -inset-4 rounded-3xl blur-2xl transition-opacity duration-500" style={{
                  background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(236, 72, 153, 0.3), rgba(34, 211, 238, 0.3))',
                  opacity: 0.3
                }}></div>
                <div className="relative rounded-3xl flex items-center justify-center min-h-[280px]" style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  padding: '40px 24px'
                }}>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl text-center font-black leading-tight tracking-wide px-4" style={{
                    background: 'linear-gradient(135deg, #ffffff, #cffafe, #bfdbfe)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                  }}>
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
                    className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl"
                    style={{
                      backdropFilter: 'blur(10px)',
                      background: 'rgba(15, 23, 42, 0.6)'
                    }}
                  >
                    <div className="rounded-[2rem] shadow-2xl transform hover:scale-105 transition-transform" style={{
                      background: 'linear-gradient(135deg, #facc15, #fb923c)',
                      padding: '4px',
                      boxShadow: '0 0 40px rgba(250, 204, 21, 0.6)'
                    }}>
                      <div className="rounded-[1.8rem] flex flex-col items-center text-center max-w-sm" style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)',
                        padding: '32px',
                        gap: '16px'
                      }}>
                        <Trophy className="w-20 h-20 animate-bounce" style={{
                          color: '#facc15',
                          filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.8))'
                        }} />
                        <h3 className="text-4xl font-black text-white game-font uppercase italic" style={{
                          textShadow: '0 0 20px rgba(250, 204, 21, 0.5)'
                        }}>Victory!</h3>
                        <p className="font-medium" style={{ color: '#cbd5e1' }}>You smashed it with lightning speed! Your tongue is untie-able!</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {gameState.status === 'failed' && (
                  <motion.div
                    initial={{ scale: 0, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl"
                    style={{
                      backdropFilter: 'blur(10px)',
                      background: 'rgba(15, 23, 42, 0.6)'
                    }}
                  >
                    <div className="rounded-[2rem] shadow-2xl" style={{
                      background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                      padding: '4px',
                      boxShadow: '0 0 40px rgba(239, 68, 68, 0.6)'
                    }}>
                      <div className="rounded-[1.8rem] flex flex-col items-center text-center max-w-sm" style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)',
                        padding: '32px',
                        gap: '16px'
                      }}>
                        <Frown className="w-20 h-20 animate-pulse" style={{
                          color: '#f87171',
                          filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.6))'
                        }} />
                        <h3 className="text-4xl font-black text-white game-font uppercase italic" style={{
                          textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                        }}>Time's Up!</h3>
                        <p className="font-medium" style={{ color: '#cbd5e1' }}>So close! But your tongue got twisted. Try again!</p>
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
            className="w-full group relative rounded-3xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
              padding: '16px 24px',
              boxShadow: '0 8px 0 #0e7490, 0 0 30px rgba(6, 182, 212, 0.5)',
              border: 'none',
              color: '#0f172a'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #22d3ee, #67e8f9)';
              e.currentTarget.style.boxShadow = '0 8px 0 #0e7490, 0 0 40px rgba(6, 182, 212, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #06b6d4, #22d3ee)';
              e.currentTarget.style.boxShadow = '0 8px 0 #0e7490, 0 0 30px rgba(6, 182, 212, 0.5)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = '0 4px 0 #0e7490, 0 0 20px rgba(6, 182, 212, 0.4)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 0 #0e7490, 0 0 30px rgba(6, 182, 212, 0.5)';
            }}
          >
             <div className="flex items-center justify-center" style={{ gap: '12px' }}>
               <Play className="w-7 h-7 fill-current" />
               <span className="text-2xl font-black game-font tracking-wide">START GAME</span>
             </div>
          </button>
        ) : gameState.status === 'playing' ? (
          <VoiceInput 
            isListening={true} 
            targetPhrase={gameState.currentTwister?.text || ""} 
            onMatch={handleMatch}
            onStatementSpoken={handleStatementSpoken}
          />
        ) : (
          <div className="flex flex-col sm:flex-row" style={{ gap: '12px' }}>
             <button
                onClick={retrySame}
                className="flex-1 rounded-2xl font-bold transition-all flex items-center justify-center"
                style={{
                  background: 'rgba(51, 65, 85, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  padding: '14px 20px',
                  color: '#ffffff',
                  boxShadow: '0 6px 0 rgba(30, 41, 59, 0.8), 0 0 20px rgba(0, 0, 0, 0.3)',
                  gap: '8px'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(3px)';
                  e.currentTarget.style.boxShadow = '0 3px 0 rgba(30, 41, 59, 0.8)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 0 rgba(30, 41, 59, 0.8), 0 0 20px rgba(0, 0, 0, 0.3)';
                }}
              >
                <RotateCcw className="w-5 h-5" />
                <span className="font-bold text-lg">Retry Same</span>
             </button>
             <button
                onClick={resetGame}
                className="flex-1 rounded-2xl font-bold transition-all flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  border: 'none',
                  padding: '14px 20px',
                  color: '#ffffff',
                  boxShadow: '0 6px 0 rgba(131, 24, 67, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #c084fc, #f472b6)';
                  e.currentTarget.style.boxShadow = '0 6px 0 rgba(131, 24, 67, 0.8), 0 0 40px rgba(168, 85, 247, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
                  e.currentTarget.style.boxShadow = '0 6px 0 rgba(131, 24, 67, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(3px)';
                  e.currentTarget.style.boxShadow = '0 3px 0 rgba(131, 24, 67, 0.8)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 0 rgba(131, 24, 67, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)';
                }}
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
          <div className="rounded-2xl" style={{
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            padding: '16px'
          }}>
            <h3 className="text-base font-bold flex items-center" style={{ 
              color: '#cbd5e1',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Zap className="w-4 h-4" style={{ color: '#22d3ee' }} />
              Spoken Statements ({spokenStatements.length})
            </h3>
            <div className="max-h-40 overflow-y-auto custom-scrollbar" style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence>
                {spokenStatements.slice(-10).map((statement, index) => (
                  <motion.div
                    key={`${statement.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="rounded-lg border-2"
                    style={{
                      padding: '12px',
                      ...(statement.isMatch ? {
                        background: 'rgba(34, 197, 94, 0.2)',
                        borderColor: 'rgba(34, 197, 94, 0.5)',
                        color: '#bbf7d0',
                        boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)'
                      } : {
                        background: 'rgba(51, 65, 85, 0.3)',
                        borderColor: 'rgba(71, 85, 105, 0.3)',
                        color: '#cbd5e1'
                      })
                    }}
                  >
                    <div className="flex items-start justify-between" style={{ gap: '12px' }}>
                      <p className="text-sm font-medium flex-1">
                        "{statement.text}"
                      </p>
                      {statement.isMatch && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                          color: '#4ade80',
                          background: 'rgba(34, 197, 94, 0.2)'
                        }}>
                          ✓ Match
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {spokenStatements.length > 10 && (
              <p className="text-xs text-center" style={{ color: '#64748b', marginTop: '16px' }}>
                Showing last 10 statements
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl text-center text-sm backdrop-blur-sm flex-shrink-0 w-full" style={{
        background: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '16px',
        color: '#94a3b8'
      }}>
        <p className="font-medium">🎤 PRO TIP: Speak clearly and loudly! Say it {TARGET_SCORE} times before the time runs out!</p>
      </div>

    </div>
  );
};

export default GameInterface;
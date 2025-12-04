'use client';

import React, { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Mic, MicOff, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  isListening: boolean;
  targetPhrase: string;
  onMatch: () => void;
  onStatementSpoken?: (statement: string, isMatch: boolean) => void;
}

export interface VoiceInputHandle {
  start: () => void;
  stop: () => void;
}

const VoiceInput = forwardRef<VoiceInputHandle, VoiceInputProps>(({ isListening, targetPhrase, onMatch, onStatementSpoken }, ref) => {
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [matchSuccess, setMatchSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const startAttemptRef = useRef(false);
  const isMountedRef = useRef(true);
  const processedStatementsRef = useRef<Set<string>>(new Set()); // Track processed statements by normalized text + timestamp to avoid duplicates
  const lastProcessedTimeRef = useRef<number>(0); // Track last processed timestamp to avoid rapid duplicates

  // Expose start/stop methods to parent component
  useImperativeHandle(ref, () => ({
    start: () => {
      if (recognitionRef.current && !isRecording && !startAttemptRef.current) {
        startAttemptRef.current = true;
        try {
          recognitionRef.current.start();
          console.log('✅ Microphone started via imperative handle');
        } catch (e: any) {
          startAttemptRef.current = false;
          console.error('Error starting via handle:', e);
          if (e.name !== 'InvalidStateError') {
            setError("Failed to start microphone. Please try again.");
          }
        }
      }
    },
    stop: () => {
      if (recognitionRef.current && isRecording) {
        startAttemptRef.current = false;
        try {
          recognitionRef.current.stop();
          setIsRecording(false);
        } catch (e) {
          console.error('Error stopping via handle:', e);
        }
      }
    }
  }));
  
  // Memoize normalize function
  const normalize = useCallback((str: string) => str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim(), []);

  // Memoize normalized target phrase to avoid recalculating on every result
  const normalizedTargetRef = useRef<string>('');
  
  useEffect(() => {
    normalizedTargetRef.current = normalize(targetPhrase);
    // Reset processed statements when target phrase changes
    processedStatementsRef.current.clear();
    lastProcessedTimeRef.current = 0;
  }, [targetPhrase, normalize]);

  // Check if a statement matches the target phrase - improved matching logic
  const checkMatch = useCallback((statement: string): boolean => {
    if (!normalizedTargetRef.current || !statement.trim()) {
      console.log('❌ No target or empty statement');
      return false;
    }
    
    const normalizedInput = normalize(statement);
    const target = normalizedTargetRef.current;
    
    console.log('🔍 Matching:', { input: normalizedInput, target });
    
    // Primary check: input contains target (exact or partial match)
    if (normalizedInput.includes(target)) {
      console.log('✅ Match: Input contains target');
      return true;
    }
    
    // Secondary check: target contains input (for partial matches)
    // This helps when speech recognition only captures part of the phrase
    if (target.includes(normalizedInput) && normalizedInput.length >= target.length * 0.6) {
      console.log('✅ Match: Target contains input (partial)');
      return true;
    }
    
    // Tertiary check: word-by-word match (more flexible)
    const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 0);
    const targetWords = target.split(/\s+/).filter(w => w.length > 0);
    
    if (inputWords.length > 0 && targetWords.length > 0) {
      // Count how many target words appear in the input
      const matchingWords = targetWords.filter(tWord => 
        inputWords.some(iWord => iWord.includes(tWord) || tWord.includes(iWord))
      );
      const matchRatio = matchingWords.length / targetWords.length;
      
      console.log('🔍 Word match:', { 
        matching: matchingWords.length, 
        total: targetWords.length, 
        ratio: matchRatio 
      });
      
      // If 60% or more of target words match, consider it a match
      if (matchRatio >= 0.6) {
        console.log('✅ Match: Word-based match');
        return true;
      }
    }
    
    console.log('❌ No match found');
    return false;
  }, [normalize]);

  const handleResult = useCallback((event: any) => {
    if (!isMountedRef.current) return;

    let interimTranscript = '';
    let latestFinalStatement = '';
    const currentTime = Date.now();

    // Process all results, tracking new final statements separately
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      const transcriptText = result[0].transcript.trim();
      
      if (result.isFinal) {
        latestFinalStatement = transcriptText;
        
        // Process each final statement separately
        // Use normalized text + timestamp to create unique key (avoids issues with index resets)
        if (transcriptText) {
          const normalizedText = normalize(transcriptText);
          // Create a unique key using normalized text and a time window (allows same statement multiple times with delay)
          const timeWindow = Math.floor(currentTime / 2000); // 2 second windows
          const statementKey = `${normalizedText}_${timeWindow}`;
          
          // Skip if we've processed this exact statement in the current time window (prevents rapid duplicates)
          // But allow the same statement to be counted if spoken again in a different time window
          if (!processedStatementsRef.current.has(statementKey)) {
            
            // Mark as processed
            processedStatementsRef.current.add(statementKey);
            lastProcessedTimeRef.current = currentTime;
            
            // Check for match
            const isMatch = checkMatch(transcriptText);
            
            // Debug logging (can be removed in production)
            console.log('📝 Statement:', transcriptText);
            console.log('🎯 Target:', normalizedTargetRef.current);
            console.log('✅ Match:', isMatch);
            
            // Notify parent about the spoken statement
            if (onStatementSpoken) {
              onStatementSpoken(transcriptText, isMatch);
            }
            
            // If it's a match, trigger the match callback
            if (isMatch) {
              console.log('🎉 MATCH FOUND! Calling onMatch()');
              onMatch();
              setMatchSuccess(true);
              setTimeout(() => {
                if (isMountedRef.current) {
                  setMatchSuccess(false);
                }
              }, 500);
            }
          }
        }
      } else {
        interimTranscript += transcriptText;
      }
    }

    // Update display transcript (show latest final or interim)
    const displayText = latestFinalStatement || interimTranscript;
    
    if (displayText) {
      setTranscript(displayText);
    }
  }, [normalize, checkMatch, onMatch, onStatementSpoken]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Browser not supported. Please use Chrome or Edge!");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = handleResult;

      recognition.onstart = () => {
        console.log('✅ Speech recognition started');
        if (isMountedRef.current) {
          setIsRecording(true);
          setError(null);
          startAttemptRef.current = false;
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Speech recognition ended');
        if (isMountedRef.current) {
          setIsRecording(false);
          
          // Only restart if we should still be listening and user initiated the start
          if (isListening && startAttemptRef.current) {
            console.log('🔄 Attempting to restart recognition...');
            setTimeout(() => {
              if (isListening && isMountedRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e: any) {
                  console.error('Error restarting:', e);
                  if (e.name !== 'InvalidStateError') {
                    if (isMountedRef.current) {
                      setError("Microphone stopped. Please click START GAME again.");
                    }
                  }
                }
              }
            }, 100);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        
        if (!isMountedRef.current) return;

        setIsRecording(false);
        startAttemptRef.current = false;
        
        switch (event.error) {
          case 'not-allowed':
            setError("Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.");
            break;
          case 'no-speech':
            // This is normal, don't show error
            break;
          case 'audio-capture':
            setError("No microphone found. Please connect a microphone.");
            break;
          case 'network':
            setError("Network error. Please check your connection.");
            break;
          case 'aborted':
            // User or system aborted, this is normal
            break;
          default:
            console.warn('Speech recognition error:', event.error);
        }
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            recognitionRef.current.abort();
          } catch (e) {
            // Ignore cleanup errors
          }
          recognitionRef.current = null;
        }
      };
    } catch (e: any) {
      console.error('Error initializing speech recognition:', e);
      setError("Failed to initialize speech recognition. Please refresh the page.");
    }
  }, [handleResult]);

  // Start/stop recognition when isListening changes
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening && !isRecording && !startAttemptRef.current) {
      // Reset statement tracking when starting to listen
      processedStatementsRef.current.clear();
      lastProcessedTimeRef.current = 0;
      
      // Start immediately when isListening becomes true
      startAttemptRef.current = true;
      console.log('🎤 Starting microphone...');
      
      try {
        recognitionRef.current.start();
        console.log('✅ Start command sent');
      } catch (e: any) {
        startAttemptRef.current = false;
        console.error('Error starting recognition:', e);
        
        if (e.name === 'InvalidStateError') {
          // Already started
          setIsRecording(true);
        } else {
          setError("Failed to start microphone. Please click START GAME again.");
        }
      }
    } else if (!isListening && isRecording) {
      // Stop when isListening becomes false
      startAttemptRef.current = false;
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  }, [isListening, isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const actuallyListening = isListening && isRecording;

  if (error && !error.includes('no-speech')) {
    return (
      <div className="p-4 bg-red-500 rounded-xl text-white font-bold text-center border-4 border-red-700 shadow-lg">
        🚨 {error}
        <button
          onClick={() => {
            setError(null);
            if (isListening && recognitionRef.current) {
              startAttemptRef.current = false;
              setTimeout(() => {
                startAttemptRef.current = true;
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.error(e);
                }
              }, 100);
            }
          }}
          className="mt-2 px-4 py-2 bg-white text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full">
      {/* Microphone Visualizer */}
      <div className="relative">
        <motion.div 
          animate={{ scale: actuallyListening ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: actuallyListening ? Infinity : 0, duration: 1.5 }}
          className={`relative flex items-center justify-center w-28 h-28 rounded-full border-4 transition-all duration-300 ${
            matchSuccess 
              ? 'bg-green-500 border-green-400' 
              : actuallyListening 
              ? 'bg-red-500 border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
              : 'bg-slate-700 border-slate-600'
          }`}
        >
          {matchSuccess ? (
            <Check className="w-16 h-16 text-white" />
          ) : actuallyListening ? (
            <Mic className="w-14 h-14 text-white" />
          ) : (
            <MicOff className="w-12 h-12 text-slate-400" />
          )}
          
          {/* Ripples - Optimized with will-change for better performance */}
          {actuallyListening && !matchSuccess && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-red-500/50 animate-ping opacity-75 will-change-transform"></div>
              <div className="absolute -inset-4 rounded-full border-2 border-red-500/30 animate-pulse will-change-opacity"></div>
            </>
          )}
        </motion.div>
      </div>

      {/* Transcript Box */}
      <div className={`w-full max-w-md rounded-2xl p-6 min-h-[100px] border-4 flex items-center justify-center text-center transition-all duration-300 ${
        matchSuccess 
          ? 'bg-green-500/20 border-green-500 scale-105' 
          : 'bg-slate-800 border-slate-700'
      }`}>
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.p 
              key="text"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl text-white font-bold"
            >
              "{transcript}"
            </motion.p>
          ) : (
            <motion.p 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 italic font-medium flex items-center gap-2"
            >
              {actuallyListening ? (
                <>
                  <Zap className="w-4 h-4" /> Speak now!
                </>
              ) : isListening ? (
                <>
                  <Zap className="w-4 h-4 animate-pulse" /> Starting microphone...
                </>
              ) : (
                "Waiting..."
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      
      {/* Debug info (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-slate-600 mt-2">
          Status: {actuallyListening ? 'Recording' : isListening ? 'Starting...' : 'Stopped'}
        </div>
      )}
    </div>
  );
});

VoiceInput.displayName = 'VoiceInput';

export default VoiceInput;


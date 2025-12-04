export interface TwisterChallenge {
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  theme: string;
}

export interface GameState {
  status: 'idle' | 'loading' | 'playing' | 'success' | 'failed';
  score: number;
  timeLeft: number;
  currentTwister: TwisterChallenge | null;
}

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

export interface SpokenStatement {
  text: string;
  timestamp: number;
  isMatch: boolean;
}
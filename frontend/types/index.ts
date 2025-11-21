// Core Game Types

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'nightmare';
export type GameMode = 'journey' | 'arena' | 'daily' | 'pvp';
export type PowerUpType = 
  | 'letter_swap' 
  | 'peek' 
  | 'wild_card' 
  | 'double_points' 
  | 'undo' 
  | 'earthquake' 
  | 'freeze' 
  | 'word_bomb';

export type WordDifficulty = 'common' | 'intermediate' | 'advanced' | 'rare';
export type WordSource = 'played' | 'encountered' | 'bonus';

export interface Position {
  row: number;
  col: number;
}

export interface Letter {
  char: string;
  points: number;
  isWildcard?: boolean;
}

export interface Cell {
  letter: Letter | null;
  isCenter: boolean;
  isNewlyPlaced?: boolean;
}

export interface Board {
  cells: Cell[][];
  size: number;
}

export interface Move {
  positions: Position[];
  word: string;
  direction: 'horizontal' | 'vertical';
  score: number;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Letter[];
  score: number;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export interface GameState {
  id: string;
  mode: GameMode;
  board: Board;
  players: Player[];
  currentPlayerId: string;
  turn: number;
  status: 'waiting' | 'playing' | 'finished';
  winnerId?: string;
  createdAt: Date;
  lastMoveAt?: Date;
  turnHistory: Move[];
  activePowerUps: PowerUp[];
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  playerId: string;
  usedAt?: Date;
}

export interface AIConfig {
  difficulty: AIDifficulty;
  minWordLength: number;
  maxWordLength: number;
  vocabularyTier: number;
  pointsWeight: number;
  blockingWeight: number;
  boardControlWeight: number;
  letterManagementWeight: number;
  randomnessFactor: number;
  bluffMoves: boolean;
  usePowerUps: boolean;
  powerUpAggression: number;
}

// Journey Mode Types

export interface JourneyLevel {
  id: number;
  name: string;
  description: string;
  aiDifficulty: AIDifficulty;
  aiVocabularyTier: number;
  baseObjective: 'win' | 'score_threshold' | 'use_specific_words';
  targetScore?: number;
  requiredWords?: string[];
  startingLetters?: string[];
  bannedLetters?: string[];
  turnLimit?: number;
  starsRequired: number;
  rewards: {
    coins: number;
    powerUps: PowerUpType[];
    unlockedWords: string[];
  };
  unlocksLevel: number | null;
  unlocksPvEArena: boolean;
}

export interface JourneyProgress {
  currentLevel: number;
  totalStars: number;
  levelStars: Record<number, number>; // levelId -> stars (0-3)
  unlockedLevels: number[];
  pvEArenaUnlocked: boolean;
}

// Word Bank Types

export interface WordEntry {
  word: string;
  definition: string;
  partOfSpeech: string;
  difficulty: WordDifficulty;
  timesUsed: number;
  timesEncountered: number;
  firstUsedAt: Date;
  lastUsedAt?: Date;
  isMastered: boolean;
  isFavorite: boolean;
  basePoints: number;
  longestWordBonus: number;
}

export interface WordBank {
  words: WordEntry[];
  totalWords: number;
  uniqueWordsUsed: number;
  wordsEncountered: number;
}

// Daily Challenge Types

export interface ChallengePuzzle {
  id: string;
  order: 1 | 2 | 3;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'standard' | 'fixed_letters' | 'word_hunt' | 'speed_round' | 'minimum_words';
  config: PuzzleConfig;
  keyReward: number;
  bonusWords: string[];
}

export interface PuzzleConfig {
  aiDifficulty?: AIDifficulty;
  targetScore?: number;
  fixedLetters?: string[];
  targetWords?: string[];
  timeLimit?: number;
  minWordsRequired?: number;
}

export interface DailyChallenge {
  date: Date;
  puzzles: ChallengePuzzle[];
  keyReward: number;
  bonusReward?: {
    keys: number;
    powerUps: PowerUpType[];
  };
}

export interface KeySystem {
  currentKeys: number;
  totalKeysEarned: number;
  todayCompleted: boolean[];
  currentStreak: number;
  longestStreak: number;
  pvpUnlockCost: number;
  pvpUnlocked: boolean;
}

// PvE Arena Types

export interface ArenaRank {
  name: string;
  difficulty: AIDifficulty;
  winsRequired: number;
  currentWins: number;
  rewards: {
    perWin: {
      coins: number;
      powerUps?: PowerUpType[];
    };
    rankUp: {
      coins: number;
      powerUps: PowerUpType[];
    };
  };
}

export interface PvEArena {
  difficulties: ArenaRank[];
  currentRank: number;
  highestRankAchieved: number;
}

// Player Profile Types

export interface PlayerProfile {
  id: string;
  username: string;
  createdAt: Date;
  journeyLevel: number;
  totalStars: number;
  pvEArenaUnlocked: boolean;
  currentArenaRank: ArenaRank;
  keys: number;
  currentStreak: number;
  lastChallengeDate?: Date;
  powerUps: PowerUp[];
  coins: number;
  stats: PlayerStats;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWordsPlayed: number;
  uniqueWordsPlayed: number;
  longestWord: string;
  highestSingleWordScore: number;
  highestGameScore: number;
}


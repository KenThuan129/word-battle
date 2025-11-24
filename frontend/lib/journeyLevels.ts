// Journey Mode Level Definitions

import { JourneyLevel, AIDifficulty } from '@/types';

export const JOURNEY_LEVELS: JourneyLevel[] = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Build as many words as you can! 2 words = 1 star, 4 words = 2 stars, 6+ words = 3 stars. Need 1 star to pass. Game ends at turn 10.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'word_count',
    targetWordCount: 2, // Minimum for 1 star
    turnLimit: 10,
    rewards: {
      coins: 10,
      powerUps: [],
      unlockedWords: [],
    },
    starsRequired: 1,
    unlocksLevel: 2,
    unlocksPvEArena: false,
  },
  {
    id: 2,
    name: 'Building Blocks',
    description: 'Achieve a score of 20 for 1 star, 30 for 2 stars, and 45 for 3 stars. Game ends at turn 10.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'score_threshold',
    targetScore: 20, // Minimum for 1 star
    turnLimit: 10,
    rewards: {
      coins: 15,
      powerUps: [],
      unlockedWords: ['word', 'battle'],
    },
    starsRequired: 0,
    unlocksLevel: 3,
    unlocksPvEArena: false,
  },
  {
    id: 3,
    name: 'Speed Challenge',
    description: 'Race to 50 points! 10 points = 1 star, 30 points = 2 stars, 50 points = 3 stars. Game ends at turn 10.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'race_to_score',
    targetScore: 50,
    turnLimit: 10,
    rewards: {
      coins: 20,
      powerUps: [],
      unlockedWords: ['connect', 'crossword'],
    },
    starsRequired: 0,
    unlocksLevel: 4,
    unlocksPvEArena: false,
  },
  {
    id: 4,
    name: 'Scoring Points',
    description: 'Higher value letters score more points. Use Q, Z, J, X for maximum scores! You can now build words with gaps using existing letters. Game ends at turn 10.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'score_threshold',
    targetScore: 30,
    turnLimit: 10,
    allowGaps: true,
    rewards: {
      coins: 25,
      powerUps: [],
      unlockedWords: ['score', 'points'],
    },
    starsRequired: 0,
    unlocksLevel: 5,
    unlocksPvEArena: false,
  },
  {
    id: 5,
    name: 'Boss Battle: Long Words',
    description: 'BOSS BATTLE! Player: 100 HP | AI: 200 HP. Damage based on word length. Sigil "Endless Knowledge": Every 3 words built, deals 4 damage + 2 over 3 turns. Beat the AI for 3 stars!',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'use_specific_words',
    requiredWords: [], // Any 5-letter word
    allowGaps: true,
    rewards: {
      coins: 30,
      powerUps: [],
      unlockedWords: ['long', 'length'],
    },
    starsRequired: 0,
    unlocksLevel: 6,
    unlocksPvEArena: false,
  },
  {
    id: 6,
    name: 'Medium Challenge',
    description: 'The AI is getting smarter. Can you keep up?',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'win',
    allowGaps: true,
    rewards: {
      coins: 35,
      powerUps: [],
      unlockedWords: ['challenge', 'difficulty'],
    },
    starsRequired: 0,
    unlocksLevel: 7,
    unlocksPvEArena: false,
  },
  {
    id: 7,
    name: 'Strategic Play',
    description: 'Place words carefully to block your opponent and control the board.',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'win',
    allowGaps: true,
    rewards: {
      coins: 40,
      powerUps: [],
      unlockedWords: ['strategy', 'tactics'],
    },
    starsRequired: 0,
    unlocksLevel: 8,
    unlocksPvEArena: false,
  },
  {
    id: 8,
    name: 'Time Pressure',
    description: 'Complete the level before running out of moves. Efficiency is key!',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'win',
    turnLimit: 20,
    allowGaps: true,
    rewards: {
      coins: 45,
      powerUps: [],
      unlockedWords: ['time', 'pressure'],
    },
    starsRequired: 0,
    unlocksLevel: 9,
    unlocksPvEArena: false,
  },
  {
    id: 9,
    name: 'Star Challenge',
    description: 'Win with 3 or fewer letters remaining to earn 2 stars!',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'win',
    allowGaps: true,
    rewards: {
      coins: 50,
      powerUps: [],
      unlockedWords: ['star', 'achievement'],
    },
    starsRequired: 0,
    unlocksLevel: 10,
    unlocksPvEArena: false,
  },
  {
    id: 10,
    name: 'Boss Battle: Arena Unlock',
    description: 'BOSS BATTLE! Player: 100 HP | AI: 200 HP. Damage based on word length. Sigil "Endless Knowledge+": Every 5 words built, deals 10 * X damage (X = 5-letter words built). Beat the AI for 3 stars and unlock Arena!',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'win',
    allowGaps: true,
    rewards: {
      coins: 60,
      powerUps: [],
      unlockedWords: ['arena', 'unlock'],
    },
    starsRequired: 0,
    unlocksLevel: 11,
    unlocksPvEArena: true,
  },
  // Add more levels...
];

export function getLevel(id: number): JourneyLevel | undefined {
  return JOURNEY_LEVELS.find(level => level.id === id);
}

export function getUnlockedLevels(completedLevels: number[]): number[] {
  const unlocked: number[] = [1]; // Level 1 always unlocked
  
  for (const level of JOURNEY_LEVELS) {
    if (completedLevels.includes(level.id) && level.unlocksLevel) {
      if (!unlocked.includes(level.unlocksLevel)) {
        unlocked.push(level.unlocksLevel);
      }
    }
  }
  
  return unlocked;
}

export function calculateStars(
  level: JourneyLevel,
  won: boolean,
  lettersRemaining: number,
  score?: number,
  wordCount?: number,
  turnsUsed?: number
): number {
  if (!won) return 0;
  
  switch (level.baseObjective) {
    case 'word_count':
      // Level 1: 2 words = 1 star, 4 words = 2 stars, 6+ words = 3 stars
      if (wordCount === undefined) return 0;
      if (wordCount >= 6) return 3;
      if (wordCount >= 4) return 2;
      if (wordCount >= 2) return 1;
      return 0;
    
    case 'score_threshold':
      // Level 2: 20 = 1 star, 30 = 2 stars, 45 = 3 stars
      if (score === undefined || !level.targetScore) return 0;
      if (score >= 45) return 3;
      if (score >= 30) return 2;
      if (score >= 20) return 1;
      return 0;
    
    case 'race_to_score':
      // Level 3: 10 points = 1 star, 30 points = 2 stars, 50 points = 3 stars
      if (score === undefined) return 0;
      if (score >= 50) return 3;
      if (score >= 30) return 2;
      if (score >= 10) return 1;
      return 0;
    
    case 'score_threshold':
      // Legacy support for other score threshold levels
      if (score === undefined || !level.targetScore) return 1;
      if (score >= level.targetScore * 1.5) return 3;
      if (score >= level.targetScore) return 2;
      return 1;
    
    default:
      // Boss battles (levels 5 and 10): Auto 3 stars on victory
      if (level.id === 5 || level.id === 10) {
        return won ? 3 : 0;
      }
      // Default: Win with 3 or fewer letters remaining = 2 stars, 0 letters = 3 stars
      let stars = 1;
      if (lettersRemaining <= 3) stars = 2;
      if (lettersRemaining === 0) stars = 3;
      return stars;
  }
}


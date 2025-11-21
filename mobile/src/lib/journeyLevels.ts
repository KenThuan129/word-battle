// Journey Mode Level Definitions

import { JourneyLevel, AIDifficulty } from '../types';

export const JOURNEY_LEVELS: JourneyLevel[] = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Welcome to Word Battle! Learn the basics by playing your first word.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'win',
    rewards: {
      coins: 10,
      powerUps: [],
      unlockedWords: [],
    },
    starsRequired: 0,
    unlocksLevel: 2,
    unlocksPvEArena: false,
  },
  {
    id: 2,
    name: 'Building Blocks',
    description: 'Form words using common letters. Remember, first word must pass through center!',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'win',
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
    name: 'Connections',
    description: 'Words must connect to existing letters on the board. Find the connections!',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'win',
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
    description: 'Higher value letters score more points. Use Q, Z, J, X for maximum scores!',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'score_threshold',
    targetScore: 30,
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
    name: 'Long Words',
    description: 'Longer words often score more points. Can you form a 5-letter word?',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'use_specific_words',
    requiredWords: [], // Any 5-letter word
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
    name: 'Arena Unlock',
    description: 'Master this level to unlock PvE Arena mode!',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'win',
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
  score?: number
): number {
  if (!won) return 0;
  
  let stars = 1; // Base star for winning
  
  // 2 stars: Win with 3 or fewer letters remaining
  if (lettersRemaining <= 3) {
    stars = 2;
  }
  
  // 3 stars: Win with 0 letters remaining AND meet score threshold
  if (lettersRemaining === 0) {
    if (level.baseObjective === 'score_threshold' && level.targetScore) {
      if (score !== undefined && score >= level.targetScore) {
        stars = 3;
      }
    } else {
      stars = 3;
    }
  }
  
  return stars;
}


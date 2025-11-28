// Journey Mode Level Definitions

import { JourneyLevel, AIDifficulty } from '../types';

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
    description: 'BOSS BATTLE! Player: 100 HP | AI: 65 HP. Damage based on word length. Sigil "Endless Knowledge": Every 3 words built, deals 4 damage + 2 over 3 turns. Beat the AI for 3 stars!',
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
    name: 'Point Challenge',
    description: 'No AI opponent. Board starts with "EMISSION". Achieve as many points as possible before turn 10. 10 points = 1 star, 20 points = 2 stars, 30 points = 3 stars.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'score_threshold',
    targetScore: 10, // Minimum for 1 star
    turnLimit: 10,
    hasAI: false,
    startingWord: 'EMISSION',
    allowGaps: true,
    rewards: {
      coins: 35,
      powerUps: [],
      unlockedWords: ['emission', 'challenge'],
    },
    starsRequired: 0,
    unlocksLevel: 7,
    unlocksPvEArena: false,
  },
  {
    id: 7,
    name: 'Corrupted Squares',
    description: 'No AI opponent. 3 squares are corrupted (cannot use). Build the word "STARS" as quickly as possible to win. Higher chance of S, T, R, A for first 3 turns. Complete in 20/14/6 turns for 1/2/3 stars.',
    aiDifficulty: 'easy',
    aiVocabularyTier: 1,
    baseObjective: 'build_word',
    targetWord: 'STARS',
    hasAI: false,
    startingWord: 'TAR',
    corruptedSquares: [], // Will be set randomly at game start
    specialLetterDistribution: { letters: ['S', 'T', 'R', 'A'], turns: 3 },
    allowGaps: true,
    rewards: {
      coins: 40,
      powerUps: [],
      unlockedWords: ['stars', 'corrupted'],
    },
    starsRequired: 0,
    unlocksLevel: 8,
    unlocksPvEArena: false,
  },
  {
    id: 8,
    name: 'Wider Board',
    description: 'Board is now 9x8. Score higher than AI (Medium) in 15 turns to win. Achieve 20/45/60 points for 1/2/3 stars.',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'score_threshold',
    targetScore: 20, // Minimum for 1 star
    turnLimit: 15,
    boardWidth: 9,
    boardHeight: 8,
    hasAI: true,
    allowGaps: true,
    rewards: {
      coins: 45,
      powerUps: [],
      unlockedWords: ['wider', 'board'],
    },
    starsRequired: 0,
    unlocksLevel: 9,
    unlocksPvEArena: false,
  },
  {
    id: 9,
    name: 'Taller Board',
    description: 'Board is now 8x9. Score higher than AI (Medium) in 15 turns to win. Achieve 25/48/66 points for 1/2/3 stars.',
    aiDifficulty: 'medium',
    aiVocabularyTier: 2,
    baseObjective: 'score_threshold',
    targetScore: 25, // Minimum for 1 star
    turnLimit: 15,
    boardWidth: 8,
    boardHeight: 9,
    hasAI: true,
    allowGaps: true,
    rewards: {
      coins: 50,
      powerUps: [],
      unlockedWords: ['taller', 'board'],
    },
    starsRequired: 0,
    unlocksLevel: 10,
    unlocksPvEArena: false,
  },
  {
    id: 10,
    name: 'Boss Battle: Arena Unlock',
    description: 'BOSS BATTLE! Player: 100 HP | AI: 75 HP. Damage based on word length. Sigil "Endless Knowledge+": Every 5 words built, deals 10 × X damage (X = 5-letter words built). Beat the AI for 3 stars and unlock Arena!',
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
  
  // Level-specific star calculations
  if (level.id === 6) {
    // Level 6: 10 points = 1 star, 20 points = 2 stars, 30 points = 3 stars
    if (score === undefined) return 0;
    if (score >= 30) return 3;
    if (score >= 20) return 2;
    if (score >= 10) return 1;
    return 0;
  }
  
  if (level.id === 7) {
    // Level 7: Complete in 20/14/6 turns for 1/2/3 stars
    if (turnsUsed === undefined) return 0;
    if (turnsUsed <= 6) return 3;
    if (turnsUsed <= 14) return 2;
    if (turnsUsed <= 20) return 1;
    return 0;
  }
  
  if (level.id === 8) {
    // Level 8: 20/45/60 points for 1/2/3 stars
    if (score === undefined) return 0;
    if (score >= 60) return 3;
    if (score >= 45) return 2;
    if (score >= 20) return 1;
    return 0;
  }
  
  if (level.id === 9) {
    // Level 9: 25/48/66 points for 1/2/3 stars
    if (score === undefined) return 0;
    if (score >= 66) return 3;
    if (score >= 48) return 2;
    if (score >= 25) return 1;
    return 0;
  }
  
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
    
    case 'build_word':
      // Level 7: Complete in 20/14/6 turns for 1/2/3 stars (handled above)
      if (turnsUsed === undefined) return 0;
      if (turnsUsed <= 6) return 3;
      if (turnsUsed <= 14) return 2;
      if (turnsUsed <= 20) return 1;
      return 0;
    
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

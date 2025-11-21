'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { ChallengePuzzle, DailyChallenge, KeySystem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DailyChallengePage() {
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [keys, setKeys] = useState<KeySystem>({
    currentKeys: 0,
    totalKeysEarned: 0,
    todayCompleted: [false, false, false],
    currentStreak: 0,
    longestStreak: 0,
    pvpUnlockCost: 10,
    pvpUnlocked: false,
  });
  const [loading, setLoading] = useState(true);
  
  const { startGame } = useGameStore();
  
  useEffect(() => {
    loadDailyChallenge();
    loadKeys();
  }, []);
  
  const loadDailyChallenge = async () => {
    try {
      // Load from localStorage for now (in production, fetch from API)
      const today = new Date().toDateString();
      const saved = localStorage.getItem(`dailyChallenge_${today}`);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        setDailyChallenge(parsed);
      } else {
        // Generate daily challenge
        const challenge = generateDailyChallenge();
        setDailyChallenge(challenge);
        localStorage.setItem(`dailyChallenge_${today}`, JSON.stringify(challenge));
      }
    } catch (error) {
      console.error('Error loading daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadKeys = () => {
    const saved = localStorage.getItem('keySystem');
    if (saved) {
      try {
        setKeys(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading keys:', error);
      }
    }
  };
  
  const generateDailyChallenge = (): DailyChallenge => {
    const today = new Date();
    const puzzles: ChallengePuzzle[] = [
      {
        id: `puzzle_${today.getTime()}_1`,
        order: 1,
        difficulty: 'easy',
        type: 'standard',
        config: {
          aiDifficulty: 'easy',
          targetScore: 50,
        },
        keyReward: 1,
        bonusWords: [],
      },
      {
        id: `puzzle_${today.getTime()}_2`,
        order: 2,
        difficulty: 'medium',
        type: 'fixed_letters',
        config: {
          aiDifficulty: 'medium',
          fixedLetters: ['A', 'E', 'I', 'O', 'U'],
          targetScore: 100,
        },
        keyReward: 1,
        bonusWords: [],
      },
      {
        id: `puzzle_${today.getTime()}_3`,
        order: 3,
        difficulty: 'hard',
        type: 'minimum_words',
        config: {
          aiDifficulty: 'hard',
          minWordsRequired: 5,
          targetScore: 150,
        },
        keyReward: 2,
        bonusWords: [],
      },
    ];
    
    return {
      date: today,
      puzzles,
      keyReward: 4,
      bonusReward: {
        keys: 1,
        powerUps: [],
      },
    };
  };
  
  const handleStartPuzzle = (puzzle: ChallengePuzzle) => {
    // Start game with puzzle configuration
    const aiDifficulty = puzzle.config.aiDifficulty || 'easy';
    startGame('daily', aiDifficulty);
    
    // Navigate to game page with puzzle ID
    window.location.href = `/game?mode=daily&puzzle=${puzzle.id}`;
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };
  
  const getPuzzleTypeDescription = (type: string) => {
    switch (type) {
      case 'standard':
        return 'Standard word battle';
      case 'fixed_letters':
        return 'Must use specific letters';
      case 'minimum_words':
        return 'Play minimum number of words';
      case 'speed_round':
        return 'Complete within time limit';
      case 'word_hunt':
        return 'Find target words';
      default:
        return 'Special challenge';
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center">Loading daily challenges...</div>
      </div>
    );
  }
  
  if (!dailyChallenge) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center">No daily challenge available</div>
      </div>
    );
  }
  
  const isToday = new Date(dailyChallenge.date).toDateString() === new Date().toDateString();
  const completedCount = keys.todayCompleted.filter(Boolean).length;
  const allCompleted = completedCount === 3;
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Daily Challenges</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete all 3 puzzles to earn keys and unlock PvP Arena!
        </p>
      </div>
      
      {/* Key System Status */}
      <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle>🔑 Key System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm opacity-90">Current Keys</div>
              <div className="text-2xl font-bold">{keys.currentKeys}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Total Earned</div>
              <div className="text-2xl font-bold">{keys.totalKeysEarned}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Current Streak</div>
              <div className="text-2xl font-bold">{keys.currentStreak} days</div>
            </div>
            <div>
              <div className="text-sm opacity-90">PvP Unlock</div>
              <div className="text-2xl font-bold">
                {keys.currentKeys}/{keys.pvpUnlockCost}
              </div>
            </div>
          </div>
          
          {keys.pvpUnlocked && (
            <div className="mt-4 p-3 bg-white/20 rounded-lg">
              <p className="font-semibold">🎉 PvP Arena Unlocked!</p>
              <Link href="/pvp">
                <Button variant="secondary" className="mt-2">
                  Enter PvP Arena
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Daily Challenge Date */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Challenge Date: {new Date(dailyChallenge.date).toLocaleDateString()}
        </div>
        {isToday && (
          <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
            ✓ Today's Challenge
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{completedCount}/3 Completed</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                />
              </div>
            </div>
            {allCompleted && (
              <div className="text-2xl">🎉</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Puzzle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dailyChallenge.puzzles.map((puzzle) => {
          const isCompleted = keys.todayCompleted[puzzle.order - 1];
          
          return (
            <Card
              key={puzzle.id}
              className={`transition-all ${
                isCompleted
                  ? 'opacity-75 border-green-500'
                  : 'hover:shadow-lg cursor-pointer'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      Puzzle {puzzle.order} - {puzzle.difficulty.toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {getPuzzleTypeDescription(puzzle.type)}
                    </CardDescription>
                  </div>
                  {isCompleted && <div className="text-2xl">✓</div>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(puzzle.difficulty)}`}>
                    {puzzle.difficulty}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {puzzle.config.targetScore && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Target Score:</span>
                        <span className="font-semibold">{puzzle.config.targetScore}</span>
                      </div>
                    )}
                    {puzzle.config.minWordsRequired && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Minimum Words:</span>
                        <span className="font-semibold">{puzzle.config.minWordsRequired}</span>
                      </div>
                    )}
                    {puzzle.config.fixedLetters && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fixed Letters:</span>
                        <span className="font-semibold">
                          {puzzle.config.fixedLetters.join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Key Reward:</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        🔑 {puzzle.keyReward}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleStartPuzzle(puzzle)}
                    disabled={isCompleted}
                    className="w-full"
                    variant={isCompleted ? 'outline' : 'default'}
                  >
                    {isCompleted ? 'Completed ✓' : 'Start Puzzle'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Bonus Reward Info */}
      {allCompleted && dailyChallenge.bonusReward && (
        <Card className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardHeader>
            <CardTitle>🎁 Bonus Reward Unlocked!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              You've completed all 3 puzzles today! You earned:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>🔑 {dailyChallenge.bonusReward.keys} bonus keys</li>
              {dailyChallenge.bonusReward.powerUps && dailyChallenge.bonusReward.powerUps.length > 0 && (
                <li>
                  Power-ups: {dailyChallenge.bonusReward.powerUps.join(', ')}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


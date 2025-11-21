'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { AIDifficulty, ArenaRank, PvEArena, JourneyProgress } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ARENA_RANKS: ArenaRank[] = [
  {
    name: 'Novice',
    difficulty: 'easy',
    winsRequired: 3,
    currentWins: 0,
    rewards: {
      perWin: { coins: 10 },
      rankUp: { coins: 50, powerUps: [] },
    },
  },
  {
    name: 'Apprentice',
    difficulty: 'medium',
    winsRequired: 5,
    currentWins: 0,
    rewards: {
      perWin: { coins: 20 },
      rankUp: { coins: 100, powerUps: [] },
    },
  },
  {
    name: 'Adept',
    difficulty: 'hard',
    winsRequired: 7,
    currentWins: 0,
    rewards: {
      perWin: { coins: 30 },
      rankUp: { coins: 200, powerUps: [] },
    },
  },
  {
    name: 'Expert',
    difficulty: 'very_hard',
    winsRequired: 10,
    currentWins: 0,
    rewards: {
      perWin: { coins: 50 },
      rankUp: { coins: 500, powerUps: [] },
    },
  },
  {
    name: 'Master',
    difficulty: 'nightmare',
    winsRequired: 15,
    currentWins: 0,
    rewards: {
      perWin: { coins: 100 },
      rankUp: { coins: 1000, powerUps: [] },
    },
  },
];

export default function ArenaPage() {
  const [arena, setArena] = useState<PvEArena>({
    difficulties: ARENA_RANKS,
    currentRank: 0,
    highestRankAchieved: 0,
  });
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty | null>(null);
  const [conditions, setConditions] = useState<{
    unlocked: boolean;
    minimumStars?: number;
    minimumLevel?: number;
  }>({ unlocked: false });
  
  const { startGame } = useGameStore();
  
  useEffect(() => {
    loadArenaProgress();
    loadJourneyProgress();
  }, []);
  
  const loadArenaProgress = () => {
    const saved = localStorage.getItem('arenaProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setArena({
          ...arena,
          ...parsed,
          difficulties: ARENA_RANKS.map((rank, index) => ({
            ...rank,
            currentWins: parsed.ranksWins?.[index] || 0,
          })),
        });
      } catch (error) {
        console.error('Error loading arena progress:', error);
      }
    }
  };
  
  const loadJourneyProgress = () => {
    const saved = localStorage.getItem('journeyProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress(parsed);
        
        // Check unlock conditions
        const unlocked = parsed.pvEArenaUnlocked || parsed.currentLevel >= 5 || (parsed.totalStars || 0) >= 15;
        setConditions({
          unlocked,
          minimumStars: 15,
          minimumLevel: 5,
        });
      } catch (error) {
        console.error('Error loading journey progress:', error);
      }
    } else {
      // No journey progress means arena is locked
      setConditions({
        unlocked: false,
        minimumStars: 15,
        minimumLevel: 5,
      });
    }
  };
  
  const handleStartArena = (difficulty: AIDifficulty) => {
    if (!conditions.unlocked) {
      alert('Arena is locked! Complete Journey Mode Level 5 or earn 15 stars to unlock.');
      return;
    }
    
    setSelectedDifficulty(difficulty);
    startGame('arena', difficulty);
    // Get basePath from current location (for GitHub Pages compatibility)
    const basePath = typeof window !== 'undefined' 
      ? window.location.pathname.split('/').slice(0, 2).join('/') || '' 
      : '';
    
    // Navigate to game page with basePath (respects GitHub Pages subdirectory)
    const gameUrl = `${basePath}/game/?mode=arena&difficulty=${difficulty}`;
    window.location.href = gameUrl;
  };
  
  const getDifficultyColor = (difficulty: AIDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'hard':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'very_hard':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'nightmare':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };
  
  const getRankEmoji = (rank: number) => {
    const emojis = ['🥉', '🥈', '🥇', '🏆', '👑'];
    return emojis[Math.min(rank, emojis.length - 1)];
  };
  
  const isRankUnlocked = (rankIndex: number) => {
    if (rankIndex === 0) return conditions.unlocked;
    
    // Previous rank must be completed
    const prevRank = arena.difficulties[rankIndex - 1];
    return prevRank.currentWins >= prevRank.winsRequired;
  };
  
  const getProgress = (wins: number, required: number) => {
    return Math.min((wins / required) * 100, 100);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">⚔️ PvE Arena</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Battle AI opponents and climb the ranks! Each rank requires wins to progress.
        </p>
      </div>
      
      {/* Unlock Status */}
      {!conditions.unlocked && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle>🔒 Arena Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              To unlock PvE Arena, you must meet one of these conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Complete Journey Mode Level {conditions.minimumLevel}</li>
              <li>Earn {conditions.minimumStars} stars in Journey Mode</li>
            </ul>
            <div className="flex gap-4 items-center">
              {progress && (
                <div className="text-sm">
                  <div>
                    Current Level: {progress.currentLevel} / {conditions.minimumLevel}
                  </div>
                  <div>
                    Stars Earned: {progress.totalStars || 0} / {conditions.minimumStars}
                  </div>
                </div>
              )}
              <Link href="/journey">
                <Button variant="outline">Go to Journey Mode</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Current Rank Status */}
      {conditions.unlocked && (
        <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle>
              {getRankEmoji(arena.currentRank)} Current Rank: {arena.difficulties[arena.currentRank]?.name || 'Novice'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm opacity-90">Current Rank</div>
                <div className="text-2xl font-bold">
                  {arena.difficulties[arena.currentRank]?.name || 'Novice'}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Highest Rank</div>
                <div className="text-2xl font-bold">
                  {arena.difficulties[arena.highestRankAchieved]?.name || 'Novice'}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Current Wins</div>
                <div className="text-2xl font-bold">
                  {arena.difficulties[arena.currentRank]?.currentWins || 0} / {arena.difficulties[arena.currentRank]?.winsRequired || 0}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Next Rank</div>
                <div className="text-2xl font-bold">
                  {arena.currentRank < arena.difficulties.length - 1
                    ? arena.difficulties[arena.currentRank + 1]?.name
                    : 'MAX'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Arena Ranks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {arena.difficulties.map((rank, index) => {
          const isUnlocked = isRankUnlocked(index);
          const isCurrentRank = arena.currentRank === index;
          const isCompleted = rank.currentWins >= rank.winsRequired;
          const progressPercent = getProgress(rank.currentWins, rank.winsRequired);
          
          return (
            <Card
              key={index}
              className={`transition-all ${
                isUnlocked
                  ? isCurrentRank
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : isCompleted
                    ? 'border-green-500'
                    : 'hover:shadow-lg cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{getRankEmoji(index)}</span>
                      {rank.name}
                    </CardTitle>
                    <CardDescription>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold inline-block mt-1 ${getDifficultyColor(rank.difficulty)}`}
                      >
                        {rank.difficulty.replace('_', ' ').toUpperCase()}
                      </span>
                    </CardDescription>
                  </div>
                  {isCurrentRank && (
                    <div className="text-blue-500 font-bold">CURRENT</div>
                  )}
                  {isCompleted && !isCurrentRank && (
                    <div className="text-green-500 font-bold">✓</div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{rank.currentWins} / {rank.winsRequired} wins</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                
                {/* Rewards */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Rewards:</div>
                    <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                      <div>Per Win: 🪙 {rank.rewards.perWin.coins} coins</div>
                      <div>
                        Rank Up: 🪙 {rank.rewards.rankUp.coins} coins
                        {rank.rewards.rankUp.powerUps && rank.rewards.rankUp.powerUps.length > 0 && (
                          <span> + Power-ups</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                {isUnlocked ? (
                  <Button
                    onClick={() => handleStartArena(rank.difficulty)}
                    className="w-full"
                    variant={isCurrentRank ? 'default' : 'outline'}
                    disabled={!conditions.unlocked}
                  >
                    {isCurrentRank ? 'Fight Now' : isCompleted ? 'Replay' : 'Challenge'}
                  </Button>
                ) : (
                  <div className="text-xs text-gray-500 text-center">
                    Complete previous rank to unlock
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Arena Rules */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📜 Arena Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc list-inside space-y-1">
            <li>Win matches to progress through ranks</li>
            <li>Each rank requires a certain number of wins to advance</li>
            <li>Earn coins and rewards for each win</li>
            <li>Rank up rewards are earned once per rank</li>
            <li>Higher ranks offer better rewards but tougher opponents</li>
            <li>Your progress is saved - you can resume anytime</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


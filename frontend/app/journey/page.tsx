'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { JOURNEY_LEVELS, getUnlockedLevels, getLevel } from '@/lib/journeyLevels';
import { JourneyLevel, JourneyProgress } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function JourneyPage() {
  const [progress, setProgress] = useState<JourneyProgress>({
    currentLevel: 1,
    totalStars: 0,
    levelStars: {},
    unlockedLevels: [1],
    pvEArenaUnlocked: false,
  });
  
  const { startGame } = useGameStore();
  
  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('journeyProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        const unlocked = getUnlockedLevels(Object.keys(parsed.levelStars || {}).map(Number));
        setProgress({
          ...parsed,
          unlockedLevels: unlocked.length > 0 ? unlocked : [1],
        });
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
  }, []);
  
  const handleStartLevel = (levelId: number) => {
    const level = getLevel(levelId);
    if (!level) return;
    
    // Start game with this level's settings
    startGame('journey', level.aiDifficulty);
    
    // Navigate to game page
    window.location.href = `/game?level=${levelId}`;
  };
  
  const getStarDisplay = (stars: number) => {
    return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Journey Mode</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Progress through levels and learn new vocabulary. Earn stars to unlock more levels!
        </p>
      </div>
      
      <div className="mb-6 flex gap-4 items-center">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Level</div>
            <div className="text-2xl font-bold">{progress.currentLevel}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Stars</div>
            <div className="text-2xl font-bold">{progress.totalStars}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Levels Unlocked</div>
            <div className="text-2xl font-bold">{progress.unlockedLevels.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {JOURNEY_LEVELS.map((level) => {
          const isUnlocked = progress.unlockedLevels.includes(level.id);
          const stars = progress.levelStars[level.id] || 0;
          
          return (
            <Card
              key={level.id}
              className={`transition-all ${
                isUnlocked
                  ? 'hover:shadow-lg cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Level {level.id}</CardTitle>
                    <CardDescription>{level.name}</CardDescription>
                  </div>
                  <div className="text-lg">{getStarDisplay(stars)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {level.description}
                </p>
                <div className="flex gap-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                    {level.aiDifficulty}
                  </span>
                  {level.targetScore && (
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                      Score: {level.targetScore}
                    </span>
                  )}
                  {level.turnLimit && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded">
                      {level.turnLimit} turns
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => handleStartLevel(level.id)}
                  disabled={!isUnlocked}
                  className="w-full"
                >
                  {isUnlocked ? 'Play' : 'Locked'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {progress.pvEArenaUnlocked && (
        <Card className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle>⚔️ PvE Arena Unlocked!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Congratulations! You've unlocked PvE Arena mode. Test your skills against challenging AI opponents.
            </p>
            <Link href="/arena">
              <Button variant="secondary">Enter Arena</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


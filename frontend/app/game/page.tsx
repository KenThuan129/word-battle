'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Letter } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { getLevel, calculateStars, getUnlockedLevels } from '@/lib/journeyLevels';
import { JourneyProgress } from '@/types';
import GameBoard from '@/components/game/GameBoard';
import PlayerHand from '@/components/game/PlayerHand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GamePage() {
  const router = useRouter();
  const { game, currentMove, startGame, selectLetter, selectCell, clearMove, submitMove, endGame } = useGameStore();
  
  const currentPlayer = game?.players.find(p => p.id === game.currentPlayerId);
  const isPlayerTurn = currentPlayer && !currentPlayer.isAI;
  
  useEffect(() => {
    if (!game) {
      startGame('journey', 'easy');
    }
  }, [game, startGame]);
  
  // Handle game end and redirect to journey
  useEffect(() => {
    if (game?.status === 'finished' && game.mode === 'journey' && game.journeyLevelId) {
      // Calculate stars and save progress
      const level = getLevel(game.journeyLevelId);
      if (level) {
        const player = game.players.find(p => !p.isAI);
        const won = game.winnerId === player?.id;
        const playerScore = player?.score || 0;
        const lettersRemaining = player?.hand.length || 0;
        const wordCount = game.wordCount;
        const turnsUsed = game.turn;
        
        // Calculate stars
        const stars = calculateStars(
          level,
          won,
          lettersRemaining,
          playerScore,
          wordCount,
          turnsUsed
        );
        
        // Load existing progress
        const savedProgress = localStorage.getItem('journeyProgress');
        let progress: JourneyProgress = {
          currentLevel: 1,
          totalStars: 0,
          levelStars: {},
          unlockedLevels: [1],
          pvEArenaUnlocked: false,
        };
        
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            progress = {
              ...parsed,
              levelStars: parsed.levelStars || {},
            };
          } catch (error) {
            console.error('Error loading progress:', error);
          }
        }
        
        // Update progress with new stars (keep highest)
        const currentStars = progress.levelStars[game.journeyLevelId] || 0;
        if (stars > currentStars) {
          progress.levelStars[game.journeyLevelId] = stars;
          progress.totalStars = Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);
          
          // Update current level if needed
          if (game.journeyLevelId >= progress.currentLevel) {
            progress.currentLevel = game.journeyLevelId + 1;
          }
          
          // Check if arena should be unlocked
          if (level.unlocksPvEArena && stars > 0) {
            progress.pvEArenaUnlocked = true;
          }
          
          // Update unlocked levels
          progress.unlockedLevels = getUnlockedLevels(
            Object.keys(progress.levelStars).map(Number).filter(levelId => progress.levelStars[levelId] > 0)
          );
          
          // Save progress
          localStorage.setItem('journeyProgress', JSON.stringify(progress));
        }
        
        // Redirect to journey page after a short delay
        setTimeout(() => {
          router.push('/journey');
        }, 1000);
      }
    }
  }, [game?.status, game?.mode, game?.journeyLevelId, router]);
  
  if (!game || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading game...</h1>
        </div>
      </div>
    );
  }
  
  const handleCellClick = (position: { row: number; col: number }) => {
    if (isPlayerTurn) {
      selectCell(position);
    }
  };
  
  const handleSubmitMove = async () => {
    const result = await submitMove();
    if (!result.success) {
      alert(result.error || 'Invalid move');
    }
  };
  
  const selectedPositions = currentMove?.positions || [];
  const selectedLetterIndices = currentMove?.selectedLetterIndices || [];
  
  const handleLetterClick = (letter: Letter, index: number) => {
    if (isPlayerTurn) {
      selectLetter(letter, index);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Word Battle</h1>
        <Button variant="outline" onClick={endGame}>
          End Game
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Scores */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Status</CardTitle>
              <CardDescription>
                Turn {game.turn} - {isPlayerTurn ? 'Your Turn' : 'AI Turn'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 ${
                    player.id === game.currentPlayerId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{player.name}</span>
                    <span className="text-2xl font-bold">{player.score}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {player.hand.length} letters
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Current Move */}
          {currentMove && (
            <Card>
              <CardHeader>
                <CardTitle>Current Move</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Word:</div>
                  <div className="text-2xl font-bold">{currentMove.word || '(none)'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Direction:</div>
                  <div className="text-lg font-semibold capitalize">
                    {currentMove.direction ? currentMove.direction : 'pending'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Positions:</div>
                  <div className="text-lg">{currentMove.positions.length}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitMove} disabled={!isPlayerTurn || currentMove.positions.length === 0}>
                    Submit
                  </Button>
                  <Button variant="outline" onClick={clearMove}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Move Log</CardTitle>
              <CardDescription>Track every word played and the points earned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto">
              {game.turnHistory.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No moves have been played yet.</p>
              ) : (
                game.turnHistory.map((move, index) => {
                  const player = game.players.find(p => p.id === move.playerId);
                  return (
                    <div key={`${move.playerId}-${index}`} className="border rounded-md p-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">{player?.name || 'Unknown'}</span>
                        <span className="text-sm text-blue-600 dark:text-blue-300">+{move.score || 0} pts</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Word: <span className="font-mono uppercase">{move.word}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Tiles placed: {move.positions.length}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Center - Game Board */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Board</CardTitle>
              <CardDescription className="space-y-2">
                <p>Place your word on the board (first word must pass through center).</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Words must be readable left-to-right or top-to-bottom—no diagonal placements.</li>
                  <li>Keep at least one empty square between separate words unless you hook through an existing letter.</li>
                  <li>You can reuse a letter already on the board to “cut through” another word crossword-style.</li>
                </ul>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <GameBoard
                  board={game.board}
                  onCellClick={handleCellClick}
                  selectedCells={selectedPositions}
                  disabled={!isPlayerTurn}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Player Hand */}
          {currentPlayer && !currentPlayer.isAI && (
            <Card>
              <CardHeader>
                <CardTitle>Your Hand</CardTitle>
                <CardDescription>
                  Click letters to build your word, then click cells to place them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlayerHand
                  letters={currentPlayer.hand}
                  onLetterSelect={handleLetterClick}
                  selectedIndices={selectedLetterIndices}
                  disabled={!isPlayerTurn}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


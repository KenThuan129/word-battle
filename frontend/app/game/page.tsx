'use client';

import React, { useEffect } from 'react';
import { Letter } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import GameBoard from '@/components/game/GameBoard';
import PlayerHand from '@/components/game/PlayerHand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GamePage() {
  const { game, currentMove, startGame, selectLetter, selectCell, clearMove, submitMove, endGame } = useGameStore();
  
  const currentPlayer = game?.players.find(p => p.id === game.currentPlayerId);
  const isPlayerTurn = currentPlayer && !currentPlayer.isAI;
  
  useEffect(() => {
    if (!game) {
      startGame('journey', 'easy');
    }
  }, [game, startGame]);
  
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
  
  const handleSubmitMove = () => {
    const result = submitMove();
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
                  <div className="text-lg font-semibold capitalize">{currentMove.direction}</div>
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
        </div>
        
        {/* Center - Game Board */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Board</CardTitle>
              <CardDescription>
                Place your word on the board (first word must pass through center)
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


'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Letter } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { getLevel, calculateStars, getUnlockedLevels } from '@/lib/journeyLevels';
import { JourneyProgress } from '@/types';
import GameBoard from '@/components/game/GameBoard';
import PlayerHand from '@/components/game/PlayerHand';
import SigilDisplay from '@/components/game/SigilDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pause } from 'lucide-react';

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Calibrating runes…</h1>
            <p className="text-sm text-muted-foreground">Loading battle board</p>
          </div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { game, currentMove, startGame, selectLetter, selectCell, clearMove, submitMove, endGame, makeAIMove, exchangeVowel } = useGameStore();
  const [pauseOpen, setPauseOpen] = useState(false);
  
  const currentPlayer = game?.players.find(p => p.id === game.currentPlayerId);
  const isPlayerTurn = currentPlayer && !currentPlayer.isAI;
  
  const levelParam = searchParams?.get('level');
  const parsedLevel = levelParam ? Number(levelParam) : undefined;
  const initialJourneyLevelId = parsedLevel && Number.isFinite(parsedLevel) && parsedLevel > 0
    ? parsedLevel
    : undefined;
  
  useEffect(() => {
    if (!game) {
      startGame('journey', 'easy', initialJourneyLevelId ? { journeyLevelId: initialJourneyLevelId } : undefined);
    }
  }, [game, startGame, initialJourneyLevelId]);
  
  // Automatically trigger AI move when it's AI's turn
  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    
    const currentPlayerForAI = game.players.find(p => p.id === game.currentPlayerId);
    // Only trigger AI move if player is AI and level has AI
    if (currentPlayerForAI?.isAI) {
      const levelConfig = game.mode === 'journey' && game.journeyLevelId 
        ? getLevel(game.journeyLevelId) 
        : null;
      if (levelConfig?.hasAI !== false) {
        // Add a small delay to make it feel more natural
        const timer = setTimeout(() => {
          makeAIMove();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [game?.currentPlayerId, game?.status, game?.players, game?.journeyLevelId, makeAIMove]);
  
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

  // Handle arena mode game end
  useEffect(() => {
    if (game?.status === 'finished' && game.mode === 'arena' && game.arenaRankId !== undefined) {
      const player = game.players.find(p => !p.isAI);
      const won = game.winnerId === player?.id;
      const isBossBattle = game.arenaBossBattle?.isBossBattle === true;
      
      // Load arena progress
      const savedArena = localStorage.getItem('arenaProgress');
      let arena: any = {
        currentRank: 0,
        highestRankAchieved: 0,
        ranksWins: {},
      };
      
      if (savedArena) {
        try {
          arena = JSON.parse(savedArena);
        } catch (error) {
          console.error('Error loading arena progress:', error);
        }
      }
      
      const rankIndex = game.arenaRankId;
      const currentWins = arena.ranksWins?.[rankIndex] || 0;
      
      if (won && isBossBattle) {
        // Boss battle win: Advance to next rank
        arena.ranksWins[rankIndex] = (arena.ranksWins[rankIndex] || 0) + 1;
        if (rankIndex < 4) { // 5 ranks total (0-4)
          arena.currentRank = rankIndex + 1;
          arena.highestRankAchieved = Math.max(arena.highestRankAchieved, rankIndex + 1);
        }
        toast.success(`Boss Defeated! Advanced to next rank!`);
      } else if (won) {
        // Regular match win: Increment wins
        arena.ranksWins[rankIndex] = (arena.ranksWins[rankIndex] || 0) + 1;
      } else if (!won && isBossBattle) {
        // Boss battle loss: Reduce winning stack by 1
        arena.ranksWins[rankIndex] = Math.max(0, (arena.ranksWins[rankIndex] || 0) - 1);
        toast.error(`Boss Battle Lost! Winning stack reduced by 1.`);
      }
      
      // Save arena progress
      localStorage.setItem('arenaProgress', JSON.stringify(arena));
      
      // Redirect to arena page after a short delay
      setTimeout(() => {
        router.push('/arena');
      }, 2000);
    }
  }, [game?.status, game?.mode, game?.arenaRankId, game?.arenaBossBattle, router]);
  
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

  // Check if this is a boss battle (level 5 or 10)
  const isBossBattle = game.journeyLevelId === 5 || game.journeyLevelId === 10;
  const player = game.players.find(p => !p.isAI);
  const aiPlayer = game.players.find(p => p.isAI);
  const levelConfig = game.mode === 'journey' && game.journeyLevelId ? getLevel(game.journeyLevelId) : null;

  // Calculate current progress for pause dialog
  const playerScore = player?.score || 0;
  const wordCount = game.wordCount || 0;
  const turnsUsed = game.turn;
  const turnLimit = levelConfig?.turnLimit;
  const lettersRemaining = player?.hand.length || 0;
  const playerHp = isBossBattle && player?.hp !== undefined ? player.hp : null;
  const maxHp = isBossBattle ? 100 : null;


  // Get arena score threshold for display
  const getArenaScoreThreshold = () => {
    if (game?.mode === 'arena' && game.arenaRankId !== undefined) {
      if (game.arenaRankId === 0 || game.arenaRankId === 1) return 100;
      if (game.arenaRankId === 2 || game.arenaRankId === 3) return 150;
      if (game.arenaRankId === 4) return 220;
    }
    return null;
  };
  const arenaScoreThreshold = getArenaScoreThreshold();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-4 px-3 py-4 sm:px-6 md:py-6 lg:gap-6">
      {game.lastEvent?.type === 'checkmate' && (
        <div className="mb-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-800 dark:border-green-400/40 dark:bg-green-400/10 dark:text-green-200">
          {game.lastEvent.message}
        </div>
      )}
      <div className="relative flex items-center justify-center mb-2 sticky top-2 bg-background/95 backdrop-blur-sm z-10 py-1.5 px-3 rounded-lg border border-border shadow-lg">
        <h1 className="text-xl font-bold text-center">WORD BATTLE</h1>
        {arenaScoreThreshold && (
          <div className="absolute left-4 text-xs text-muted-foreground">
            First to {arenaScoreThreshold} wins
          </div>
        )}
        <div className="absolute right-3 flex gap-1.5">
          <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Game Paused</DialogTitle>
                <DialogDescription>Review your missions and progress</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Level Info */}
                {levelConfig && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Level {levelConfig.id}: {levelConfig.name}</CardTitle>
                      <CardDescription>{levelConfig.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )}

                {/* Arena Mode Mission */}
                {game.mode === 'arena' && arenaScoreThreshold && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mission</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">First to {arenaScoreThreshold} Points Wins</div>
                        <div className="text-sm">
                          Current Score: <span className="font-bold">{playerScore} points</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (playerScore / arenaScoreThreshold) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Missions */}
                {levelConfig && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Missions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {levelConfig.baseObjective === 'word_count' && (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">Build Words</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ 1 Star: Build 2 words | ⭐⭐ 2 Stars: Build 4 words | ⭐⭐⭐ 3 Stars: Build 6+ words
                          </div>
                          <div className="text-sm">
                            Current: <span className="font-bold">{wordCount} words</span>
                          </div>
                        </div>
                      )}
                      
                      {levelConfig.baseObjective === 'score_threshold' && levelConfig.targetScore && (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">Reach Score Target</div>
                          <div className="text-sm text-muted-foreground">
                            Target: {levelConfig.targetScore} points (check star requirements in description)
                          </div>
                          <div className="text-sm">
                            Current: <span className="font-bold">{playerScore} points</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (playerScore / levelConfig.targetScore) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {levelConfig.baseObjective === 'race_to_score' && (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">Race to Score</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ 1 Star: 10 points | ⭐⭐ 2 Stars: 30 points | ⭐⭐⭐ 3 Stars: 50 points
                          </div>
                          <div className="text-sm">
                            Current: <span className="font-bold">{playerScore} points</span>
                          </div>
                        </div>
                      )}
                      
                      {levelConfig.baseObjective === 'build_word' && levelConfig.targetWord && (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">Build Target Word</div>
                          <div className="text-sm">
                            Target: <span className="font-mono font-bold">{levelConfig.targetWord}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ 1 Star: Complete in 20 turns | ⭐⭐ 2 Stars: 14 turns | ⭐⭐⭐ 3 Stars: 6 turns
                          </div>
                          <div className="text-sm">
                            Turns Used: <span className="font-bold">{turnsUsed}</span>
                          </div>
                        </div>
                      )}
                      
                      {levelConfig.baseObjective === 'win' && (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">Defeat the Boss</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐⭐⭐ 3 Stars: Win the battle
                          </div>
                        </div>
                      )}
                      
                      {turnLimit && (
                        <div className="space-y-1 pt-2 border-t">
                          <div className="font-semibold text-sm">Turn Limit</div>
                          <div className="text-sm">
                            {turnsUsed} / {turnLimit} turns
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (turnsUsed / turnLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Current Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Score</div>
                        <div className="text-2xl font-bold">{playerScore}</div>
                      </div>
                      {wordCount > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground">Words Built</div>
                          <div className="text-2xl font-bold">{wordCount}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground">Turn</div>
                        <div className="text-2xl font-bold">{turnsUsed}{turnLimit ? ` / ${turnLimit}` : ''}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Letters Remaining</div>
                        <div className="text-2xl font-bold">{lettersRemaining}</div>
                      </div>
                    </div>
                    
                    {playerHp !== null && maxHp !== null && (
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Player HP</span>
                          <span>{playerHp} / {maxHp}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${
                              (playerHp / maxHp) > 0.6 ? 'bg-green-500' : (playerHp / maxHp) > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, (playerHp / maxHp) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {isBossBattle && aiPlayer && aiPlayer.hp !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Enemy HP</span>
                          <span>{aiPlayer.hp} / {aiPlayer.isAI && game.journeyLevelId === 5 ? 65 : game.journeyLevelId === 10 ? 75 : 200}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, (aiPlayer.hp / (game.journeyLevelId === 5 ? 65 : game.journeyLevelId === 10 ? 75 : 200)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {isBossBattle && game.sigilCount !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Sigil Progress</div>
                        <div className="text-lg font-semibold">
                          {game.sigilCount} / {game.journeyLevelId === 5 ? 3 : game.journeyLevelId === 10 ? 5 : 3} words built
                        </div>
                        {game.activeSigilEffects && game.activeSigilEffects.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {game.activeSigilEffects.map((effect, idx) => (
                              <div key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                                Active: {effect.type} ({effect.turnsRemaining} turns remaining)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Game Rules (if needed) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Play</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>• Place your word on the board (first word must pass through center)</p>
                    <p>• Words must be readable left-to-right or top-to-bottom</p>
                    <p>• Keep at least one empty square between separate words unless hooking through existing letters</p>
                    <p>• Click letters in your hand, then click cells on the board to place them</p>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={endGame} className="h-8 px-2 text-xs">
            End Game
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-[320px] lg:pt-1 xl:sticky xl:top-24 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
          <Card className="border-cyan-500/10 bg-background/60 backdrop-blur-md">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-sm tracking-[0.3em]">Status</CardTitle>
              <CardDescription className="text-xs uppercase tracking-[0.25em]">
                Turn {game.turn} · {isPlayerTurn ? 'Your Turn' : 'AI Turn'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/40 bg-black/30 px-3 py-2 text-xs text-muted-foreground">
                {arenaScoreThreshold
                  ? `First to ${arenaScoreThreshold} points`
                  : levelConfig?.description || 'Battle ongoing'}
              </div>
              {levelConfig && (
                <div className="space-y-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="font-semibold text-foreground">Objective</span>
                  <p className="text-[0.7rem] lowercase tracking-normal text-muted-foreground">
                    {levelConfig.description}
                  </p>
                </div>
              )}
              <div className="space-y-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="font-semibold text-foreground">Letters Remaining</span>
                <p className="text-lg font-bold tracking-[0.4em] text-foreground">{lettersRemaining}</p>
              </div>
            </CardContent>
          </Card>
          {currentPlayer && !currentPlayer.isAI && (
            <Card className="rounded-3xl border-accent/40 bg-background/70 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xs uppercase tracking-[0.4em]">Your Hand</CardTitle>
                <CardDescription className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
                  {currentPlayer.hand.length} tiles ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PlayerHand
                  letters={currentPlayer.hand}
                  onLetterSelect={handleLetterClick}
                  selectedIndices={selectedLetterIndices}
                  disabled={!isPlayerTurn}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const result = exchangeVowel();
                    if (!result.success) {
                      toast.error(result.error || 'Failed to exchange vowel');
                    } else {
                      toast.success('Exchanged consonant for vowel!');
                    }
                  }}
                  disabled={!isPlayerTurn}
                  className="w-full rounded-2xl border-accent/40 bg-accent/10 py-5 text-xs uppercase tracking-[0.4em]"
                >
                  🔄 Exchange Vowel
                </Button>
              </CardContent>
            </Card>
          )}
          {/* Sigil Display - Only shown in boss battles */}
          {isBossBattle && (
            <Card className="border-amber-500/20 bg-background/60 backdrop-blur-md">
              <SigilDisplay
                levelId={game.journeyLevelId || 0}
                sigilCount={game.sigilCount}
                activeEffects={game.activeSigilEffects}
                fiveLetterWordCount={game.fiveLetterWordCount}
              />
            </Card>
          )}
        </aside>

        <section className="order-1 flex w-full flex-1 flex-col gap-4 lg:order-2">
          <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-r from-background/40 via-background/60 to-background/40 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {isPlayerTurn ? 'Ready your word' : 'Awaiting opponent'}
              </div>
              {currentMove?.word && (
                <div className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">
                  {currentMove.word}
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {game.players.map((player) => {
                const maxHp = player.isAI && isBossBattle
                  ? (game.journeyLevelId === 5 ? 65 : game.journeyLevelId === 10 ? 75 : 200)
                  : player.isAI ? 200 : 100;
                const hpPercent =
                  player.hp !== undefined && isBossBattle
                    ? Math.max(0, Math.min(100, (player.hp / maxHp) * 100))
                    : null;
                const isActive = player.id === game.currentPlayerId;

                return (
                  <div
                    key={player.id}
                    className={`rounded-2xl border px-4 py-3 shadow-inner transition-all ${
                      isActive
                        ? 'border-accent/60 bg-black/60 shadow-[0_0_25px_rgba(0,217,255,0.25)]'
                        : 'border-border/40 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.2em]">
                      <span>{player.name}</span>
                      <span className="text-xl font-black text-primary">{player.score}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                      <span>{player.hand.length} tiles</span>
                      {hpPercent !== null && (
                        <span>{player.hp} HP</span>
                      )}
                    </div>
                    {hpPercent !== null && (
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-accent to-cyan-400"
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-border/40 bg-black/40 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
              <div className="flex w-full justify-center lg:flex-1">
                <GameBoard
                  board={game.board}
                  onCellClick={handleCellClick}
                  selectedCells={selectedPositions}
                  disabled={!isPlayerTurn}
                />
              </div>

              {currentMove && (
                <div className="game-stage__move flex w-full flex-col gap-3 rounded-2xl border border-border/40 bg-white/5 px-4 py-4 text-xs uppercase tracking-[0.3em] shadow-lg lg:w-80">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Current word</span>
                    <span className="text-lg font-black tracking-[0.4em] text-primary">
                      {currentMove.word || '(none)'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmitMove} disabled={!isPlayerTurn || currentMove.positions.length === 0} className="h-9 flex-1 rounded-full text-xs uppercase tracking-[0.3em]">
                      Submit
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearMove} className="h-9 flex-1 rounded-full text-xs uppercase tracking-[0.3em]">
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


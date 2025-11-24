'use client';

import { create } from 'zustand';
import { GameState, Player, Move, Letter, Position, AIDifficulty, GameMode } from '@/types';
import { 
  createEmptyBoard, 
  createLetterDistribution, 
  drawLetters, 
  validateMove, 
  applyMove,
  drawLetters as drawNewLetters,
  ensureMoveWordsAreValid,
  LETTER_CONFIG,
  placeStartingWord,
  calculateDamage,
} from '@/lib/gameEngine';
import { isValidWord } from '@/lib/dictionary';
import { calculateAIMove, AI_CONFIGS } from '@/lib/aiEngine';
import { checkWinCondition } from '@/lib/gameEngine';
import { getLevel } from '@/lib/journeyLevels';

interface StartGameOptions {
  journeyLevelId?: number;
}

interface GameStore {
  // State
  game: GameState | null;
  currentMove: {
    positions: Position[];
    word: string;
    direction: 'horizontal' | 'vertical' | null;
    selectedLetterIndices: number[];
  } | null;
  
  // Actions
  startGame: (mode: GameMode, aiDifficulty?: AIDifficulty, options?: StartGameOptions) => void;
  selectLetter: (letter: Letter, index: number) => void;
  selectCell: (position: Position) => void;
  setDirection: (direction: 'horizontal' | 'vertical' | null) => void;
  clearMove: () => void;
  submitMove: () => Promise<{ success: boolean; error?: string }>;
  makeAIMove: () => Promise<void>;
  endGame: () => void;
}

const determineDirection = (positions: Position[]): 'horizontal' | 'vertical' => {
  if (positions.length < 2) {
    return 'horizontal';
  }
  const [first, second] = positions;
  return first.row === second.row ? 'horizontal' : 'vertical';
};

const isOccupied = (positions: Position[], row: number, col: number): boolean =>
  positions.some(pos => pos.row === row && pos.col === col);

const getBridgePositions = (
  board: GameState['board'],
  occupied: Position[],
  start: Position,
  end: Position
): Position[] | null => {
  if (start.row === end.row) {
    const step = end.col > start.col ? 1 : -1;
    const positions: Position[] = [];
    for (let col = start.col + step; col !== end.col; col += step) {
      if (isOccupied(occupied, start.row, col)) {
        continue;
      }
      const cell = board.cells[start.row][col];
      if (!cell.letter) {
        return null;
      }
      positions.push({ row: start.row, col });
    }
    return positions;
  }
  
  if (start.col === end.col) {
    const step = end.row > start.row ? 1 : -1;
    const positions: Position[] = [];
    for (let row = start.row + step; row !== end.row; row += step) {
      if (isOccupied(occupied, row, start.col)) {
        continue;
      }
      const cell = board.cells[row][start.col];
      if (!cell.letter) {
        return null;
      }
      positions.push({ row, col: start.col });
    }
    return positions;
  }
  
  return null;
};

const BEGINNER_EASY_WORDS = ['CAT', 'SUN', 'TEA', 'RAIN', 'NOTE', 'READ', 'LINE', 'SALT', 'MOON'];

const hasBeginnerWord = (hand: Letter[]): string | null => {
  const counts: Record<string, number> = {};
  for (const letter of hand) {
    counts[letter.char] = (counts[letter.char] || 0) + 1;
  }
  
  for (const word of BEGINNER_EASY_WORDS) {
    const temp = { ...counts };
    let canForm = true;
    for (const ch of word) {
      if (!temp[ch] || temp[ch] === 0) {
        canForm = false;
        break;
      }
      temp[ch] -= 1;
    }
    if (canForm) {
      return word;
    }
  }
  return null;
};

const injectBeginnerWord = (hand: Letter[]): Letter[] => {
  const word = BEGINNER_EASY_WORDS[Math.floor(Math.random() * BEGINNER_EASY_WORDS.length)];
  const updated = [...hand];
  let index = 0;
  
  for (const ch of word) {
    const existing = updated.find(letter => letter.char === ch);
    if (existing) {
      continue;
    }
    const letterConfig = LETTER_CONFIG[ch];
    const replacement: Letter = {
      char: ch,
      points: letterConfig?.points ?? 1,
    };
    updated[index % updated.length] = replacement;
    index += 1;
  }
  
  return updated;
};

const softenAIHand = (hand: Letter[]): Letter[] => {
  const allowedChars = ['A', 'E', 'I', 'O', 'U', 'S', 'T', 'L', 'N', 'R'];
  return hand.map(letter => {
    if (letter.points <= 2) {
      return letter;
    }
    const replacementChar = allowedChars[Math.floor(Math.random() * allowedChars.length)];
    const replacementConfig = LETTER_CONFIG[replacementChar];
    return {
      char: replacementChar,
      points: replacementConfig?.points ?? 1,
    };
  });
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  currentMove: null,
  
  startGame: (mode: GameMode, aiDifficulty: AIDifficulty = 'easy', options?: StartGameOptions) => {
    const distribution = createLetterDistribution();
    const shuffled = [...distribution].sort(() => Math.random() - 0.5);
    
    const playerId = 'player-1';
    const aiId = 'ai-1';
    const isBeginnerJourney = mode === 'journey' && options?.journeyLevelId && options.journeyLevelId <= 3;
    
    let playerHand = drawLetters(10, shuffled);
    const needsGuarantee = Math.random() < 0.45;
    if (isBeginnerJourney && (needsGuarantee || !hasBeginnerWord(playerHand))) {
      playerHand = injectBeginnerWord(playerHand);
    }
    
    // Check if boss battle (levels 5 or 10)
    const isBossBattle = options?.journeyLevelId === 5 || options?.journeyLevelId === 10;
    
    const player: Player = {
      id: playerId,
      name: 'You',
      hand: playerHand,
      score: 0,
      hp: isBossBattle ? 100 : undefined,
      isAI: false,
    };
    
    let aiHand = drawLetters(10, shuffled);
    if (isBeginnerJourney) {
      aiHand = softenAIHand(aiHand);
    }
    
    const ai: Player = {
      id: aiId,
      name: `AI (${aiDifficulty})`,
      hand: aiHand,
      score: 0,
      hp: isBossBattle ? 200 : undefined,
      isAI: true,
      aiDifficulty,
    };
    
    let initialBoard = createEmptyBoard();
    
    // For Level 3, place "RACING" on the board at start
    if (options?.journeyLevelId === 3) {
      initialBoard = placeStartingWord(initialBoard, 'RACING');
    }
    
    const game: GameState = {
      id: `game-${Date.now()}`,
      mode,
      board: initialBoard,
      players: [player, ai],
      currentPlayerId: playerId,
      turn: 1,
      status: 'playing',
      createdAt: new Date(),
      turnHistory: [],
      activePowerUps: [],
      wordCount: 0,
      journeyLevelId: options?.journeyLevelId,
      sigilCount: isBossBattle ? 0 : undefined,
      activeSigilEffects: isBossBattle ? [] : undefined,
      fiveLetterWordCount: options?.journeyLevelId === 10 ? 0 : undefined,
    };
    
    set({ game, currentMove: null });
  },
  
  selectLetter: (letter: Letter, index: number) => {
    const { game, currentMove } = get();
    if (!game) return;
    
    const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) return;
    
    // Check if letter is already selected in this move
    const isAlreadySelected = currentMove?.selectedLetterIndices.includes(index);
    
    if (isAlreadySelected && currentMove) {
      // Deselect this letter
      const newIndices = currentMove.selectedLetterIndices.filter(i => i !== index);
      const newWord = newIndices.map(i => currentPlayer.hand[i].char).join('');
      const newPositions = currentMove.positions.slice(0, newWord.length);
      
      set({
        currentMove: {
          ...currentMove,
          word: newWord,
          selectedLetterIndices: newIndices,
          positions: newPositions,
          direction: currentMove.direction,
        },
      });
      return;
    }
    
    // Add letter to word
    if (!currentMove) {
      set({ 
        currentMove: { 
          positions: [], 
          word: letter.char, 
          direction: null,
          selectedLetterIndices: [index],
        } 
      });
    } else {
      // Add letter if we haven't used all selected letters yet
      const newIndices = [...currentMove.selectedLetterIndices, index];
      const newWord = newIndices.map(i => currentPlayer.hand[i].char).join('');
      
      set({
        currentMove: {
          ...currentMove,
          word: newWord,
          selectedLetterIndices: newIndices,
          // Clear positions if word changed
          positions: currentMove.positions.slice(0, newWord.length),
        },
      });
    }
  },
  
  selectCell: (position: Position) => {
    const { game, currentMove } = get();
    if (!game) return;
    
    const activeMove = currentMove;
    const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) return;
    
    const cell = game.board.cells[position.row][position.col];
    const boardLetter = cell.letter;
    
    if (!activeMove) {
      if (!boardLetter) {
        return;
      }
      set({
        currentMove: {
          positions: [position],
          word: boardLetter.char,
          direction: null,
          selectedLetterIndices: [],
        },
      });
      return;
    }
    
    // Check if position is already selected
    const isAlreadySelected = activeMove.positions.some(
      pos => pos.row === position.row && pos.col === position.col
    );
    
    if (isAlreadySelected) {
      // Deselect this position and all after it
      const index = activeMove.positions.findIndex(
        pos => pos.row === position.row && pos.col === position.col
      );
      const newPositions = activeMove.positions.slice(0, index);
      // Rebuild word up to this point
      const newWord = newPositions.map((pos, i) => {
        const cell = game.board.cells[pos.row][pos.col];
        if (cell.letter) {
          return cell.letter.char;
        }
        const letterIndex = activeMove.selectedLetterIndices[i];
        if (letterIndex !== undefined && currentPlayer.hand[letterIndex]) {
          return currentPlayer.hand[letterIndex].char;
        }
        return '';
      }).join('');
      
      set({
        currentMove: {
          ...activeMove,
          positions: newPositions,
          word: newWord,
          selectedLetterIndices: activeMove.selectedLetterIndices.slice(0, index),
        },
      });
      return;
    }
    
    // Check if cell has a letter already on board
    
    
    // If cell has a letter, use it (don't need to select from hand)
    if (boardLetter) {
      // Validate position is adjacent to last position and follows direction
      const lastPos = activeMove.positions[activeMove.positions.length - 1];
      if (lastPos) {
        const rowDiff = position.row - lastPos.row;
        const colDiff = position.col - lastPos.col;
        
        // Must be adjacent in exactly one direction (horizontal or vertical)
        const isHorizontalAdjacent = rowDiff === 0 && Math.abs(colDiff) === 1;
        const isVerticalAdjacent = colDiff === 0 && Math.abs(rowDiff) === 1;
        
        let bridgePositions: Position[] | null = null;
        if (!isHorizontalAdjacent && !isVerticalAdjacent) {
          bridgePositions = getBridgePositions(game.board, activeMove.positions, lastPos, position);
          if (!bridgePositions) {
            return; // Invalid path - contains gaps
          }
        }
        
        // Determine direction
        const newDirection: 'horizontal' | 'vertical' = (isHorizontalAdjacent || (bridgePositions && lastPos.row === position.row))
          ? 'horizontal'
          : 'vertical';
        
        // If direction is already set, it must match
        if (activeMove.direction && activeMove.direction !== newDirection) {
          return; // Invalid - cannot change direction mid-word
        }
        
        // Ensure positions form a consecutive sequence in the correct direction
        const existingDirection = activeMove.direction || newDirection;
        
        if (existingDirection === 'horizontal') {
          // Must be in same row
          if (position.row !== lastPos.row) {
            return; // Not in same row
          }
          // Check if all existing positions are in the same row
          for (const pos of currentMove.positions) {
            if (pos.row !== lastPos.row) {
              return; // Existing positions not all horizontal
            }
          }
        } else {
          // Must be in same column
          if (position.col !== lastPos.col) {
            return; // Not in same column
          }
          // Check if all existing positions are in the same column
          for (const pos of currentMove.positions) {
            if (pos.col !== lastPos.col) {
              return; // Existing positions not all vertical
            }
          }
        }
        
        // Update direction
        let updatedWord = activeMove.word;
        const updatedPositions = [...activeMove.positions];
        
        if (bridgePositions && bridgePositions.length > 0) {
          for (const bridgePos of bridgePositions) {
            const bridgeCell = game.board.cells[bridgePos.row][bridgePos.col];
            if (!bridgeCell.letter) {
              return;
            }
            updatedWord += bridgeCell.letter.char;
            updatedPositions.push(bridgePos);
          }
        }
        
        updatedPositions.push(position);
        updatedWord += boardLetter.char;
        
        set({
          currentMove: {
            ...activeMove,
            direction: newDirection,
            positions: updatedPositions,
            word: updatedWord,
          },
        });
        return;
      }
      
      // Use board letter with no previous positions (should not happen)
      set({
        currentMove: {
          ...activeMove,
          word: activeMove.word + boardLetter.char,
          positions: [...activeMove.positions, position],
        },
      });
      return;
    }
    
    // Cell is empty - need letter from hand
    if (activeMove.word.length === activeMove.positions.length) {
      if (activeMove.selectedLetterIndices.length === 0) {
        return; // Need to select letter from hand first
      }
    } else if (activeMove.selectedLetterIndices.length === 0) {
      return;
    }
    
    // Validate position is adjacent to last position and follows direction
    const lastPos = activeMove.positions[activeMove.positions.length - 1];
    if (lastPos) {
      const rowDiff = position.row - lastPos.row;
      const colDiff = position.col - lastPos.col;
      
      // Must be adjacent in exactly one direction (horizontal or vertical)
      const isHorizontalAdjacent = rowDiff === 0 && Math.abs(colDiff) === 1;
      const isVerticalAdjacent = colDiff === 0 && Math.abs(rowDiff) === 1;
      
      if (!isHorizontalAdjacent && !isVerticalAdjacent) {
        return; // Invalid position - not adjacent or diagonal
      }
      
      // Determine direction
      const newDirection: 'horizontal' | 'vertical' = isHorizontalAdjacent ? 'horizontal' : 'vertical';
      
      // If direction is already set, it must match
      if (activeMove.direction && activeMove.direction !== newDirection) {
        return; // Invalid - cannot change direction mid-word
      }
      
      // Ensure positions form a consecutive sequence in the correct direction
      const existingDirection = activeMove.direction || newDirection;
      
      if (existingDirection === 'horizontal') {
        // Must be in same row
        if (position.row !== lastPos.row) {
          return; // Not in same row
        }
        // Check if all existing positions are in the same row
        for (const pos of currentMove.positions) {
          if (pos.row !== lastPos.row) {
            return; // Existing positions not all horizontal
          }
        }
      } else {
        // Must be in same column
        if (position.col !== lastPos.col) {
          return; // Not in same column
        }
        // Check if all existing positions are in the same column
        for (const pos of currentMove.positions) {
          if (pos.col !== lastPos.col) {
            return; // Existing positions not all vertical
          }
        }
      }
      
      // Update direction
      set({ currentMove: { ...activeMove, direction: newDirection } });
    }
    
    // Add position if there's a letter in current word that matches hand
    if (activeMove.word.length > activeMove.positions.length) {
      set({
        currentMove: {
          ...activeMove,
          positions: [...activeMove.positions, position],
        },
      });
    }
  },
  
  setDirection: (direction: 'horizontal' | 'vertical' | null) => {
    const { currentMove } = get();
    if (currentMove) {
      set({ currentMove: { ...currentMove, direction } });
    }
  },
  
  clearMove: () => {
    set({ currentMove: null });
  },
  
  submitMove: async () => {
    const { game, currentMove } = get();
    if (!game || !currentMove) {
      return { success: false, error: 'No move to submit' };
    }
    
    const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Check turn limit BEFORE allowing move
    const levelConfig = game.mode === 'journey' && game.journeyLevelId 
      ? getLevel(game.journeyLevelId) 
      : null;
    // Prevent moves if the NEXT turn would exceed the limit (check BEFORE incrementing)
    // Since turn will be incremented to game.turn + 1, we check if that would exceed the limit
    if (levelConfig?.turnLimit && (game.turn + 1) > levelConfig.turnLimit) {
      // End the game now
      const levelForWinCheck = levelConfig ? {
        baseObjective: levelConfig.baseObjective,
        targetScore: levelConfig.targetScore,
        targetWordCount: levelConfig.targetWordCount,
        turnLimit: levelConfig.turnLimit,
      } : undefined;
      const winCheck = checkWinCondition(game, levelForWinCheck, game.journeyLevelId);
      if (winCheck.finished) {
        set({
          game: {
            ...game,
            status: 'finished',
            winnerId: winCheck.winnerId,
          },
        });
      } else {
        // Force end if not already finished
        const player = game.players.find(p => !p.isAI);
        const ai = game.players.find(p => p.isAI);
        set({
          game: {
            ...game,
            status: 'finished',
            winnerId: player && ai && player.score >= ai.score ? player.id : ai?.id,
          },
        });
      }
      return { success: false, error: 'Turn limit reached. Game is over.' };
    }
    
    if (currentMove.positions.length === 0 || currentMove.word.length === 0) {
      return { success: false, error: 'Invalid move' };
    }
    
    if (currentMove.positions.length !== currentMove.word.length) {
      return { success: false, error: 'Word length does not match positions' };
    }
    
    const moveDirection = currentMove.direction || determineDirection(currentMove.positions);

    const move: Move = {
      positions: currentMove.positions,
      word: currentMove.word,
      direction: moveDirection,
      score: 0, // Will be calculated
      playerId: currentPlayer.id,
    };

    // Get level config to check if gaps are allowed (already retrieved above)
    const allowGaps = levelConfig?.allowGaps ?? false;
    
    const dictionaryValidation = await ensureMoveWordsAreValid(game.board, move);
    if (!dictionaryValidation.valid) {
      return { success: false, error: dictionaryValidation.error || 'Invalid word' };
    }
    
    const validation = validateMove(game.board, move, currentPlayer.hand, isValidWord, allowGaps);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid move' };
    }
    
    // Check if boss battle
    const isBossBattle = game.journeyLevelId === 5 || game.journeyLevelId === 10;
    
    // Apply move
    const { newBoard, newHand, score } = applyMove(game.board, move, currentPlayer.hand);
    const moveWithScore: Move = {
      ...move,
      score,
    };
    
    // Update word count for level 1
    const newWordCount = (game.wordCount || 0) + 1;
    
    // Boss battle: Calculate damage and apply to opponent
    let updatedPlayers = game.players.map(p => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          hand: newHand,
          score: p.score + score,
        };
      }
      return p;
    });
    
    // Apply damage and sigil effects for boss battles
    if (isBossBattle && currentPlayer.hp !== undefined) {
      const opponent = game.players.find(p => p.id !== currentPlayer.id);
      const mainWordLength = move.word.length;
      let damageToOpponent = calculateDamage(mainWordLength);
      
      // Apply active sigil effects (from previous turns)
      const activeEffects = game.activeSigilEffects || [];
      for (const effect of activeEffects) {
        if (effect.turnsRemaining > 0) {
          damageToOpponent += effect.damage;
        }
      }
      
      // Update sigil count and check for activation
      let newSigilCount = (game.sigilCount || 0) + 1;
      let newActiveEffects = [...(game.activeSigilEffects || [])];
      let newFiveLetterWordCount = game.fiveLetterWordCount || 0;
      
      // Track 5-letter words for Level 10
      if (game.journeyLevelId === 10 && mainWordLength === 5) {
        newFiveLetterWordCount += 1;
      }
      
      // Level 5: Sigil activates every 3 words
      if (game.journeyLevelId === 5 && newSigilCount % 3 === 0) {
        // "Endless Knowledge": 4 damage immediately + 2 damage over next 3 turns
        damageToOpponent += 4; // Immediate 4 damage
        // Schedule +2 damage for each of the next 3 turns
        newActiveEffects.push({ type: 'endless_knowledge', damage: 2, turnsRemaining: 1 });
        newActiveEffects.push({ type: 'endless_knowledge', damage: 2, turnsRemaining: 2 });
        newActiveEffects.push({ type: 'endless_knowledge', damage: 2, turnsRemaining: 3 });
      }
      
      // Level 10: Sigil activates every 5 words
      if (game.journeyLevelId === 10 && newSigilCount % 5 === 0) {
        // "Endless Knowledge+": 10 * X damage (X = number of 5-letter words built)
        const sigilDamage = 10 * newFiveLetterWordCount;
        damageToOpponent += sigilDamage;
      }
      
      // Update opponent HP with total damage
      if (opponent && opponent.hp !== undefined) {
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === opponent.id) {
            return { ...p, hp: Math.max(0, (opponent.hp || 0) - damageToOpponent) };
          }
          return p;
        });
      }
      
      // Update sigil effects (decrease turns remaining)
      newActiveEffects = newActiveEffects.map(effect => ({
        ...effect,
        turnsRemaining: effect.turnsRemaining - 1,
      })).filter(effect => effect.turnsRemaining > 0);
      
      // Update game state with sigil info
      const updatedGameWithSigils: GameState = {
        ...game,
        board: newBoard,
        players: updatedPlayers,
        currentPlayerId: game.currentPlayerId,
        turn: game.turn,
        turnHistory: [...game.turnHistory, moveWithScore],
        lastMoveAt: new Date(),
        wordCount: newWordCount,
        sigilCount: newSigilCount,
        activeSigilEffects: newActiveEffects,
        fiveLetterWordCount: newFiveLetterWordCount,
      };
      
      // Switch turn
      const nextPlayerId = opponent?.id || game.currentPlayerId;
      const finalGame: GameState = {
        ...updatedGameWithSigils,
        currentPlayerId: nextPlayerId,
        turn: game.turn + 1,
      };
      
      set({ game: finalGame, currentMove: null });
      
      // Check win condition after player move
      const levelForWinCheck = levelConfig ? {
        baseObjective: levelConfig.baseObjective,
        targetScore: levelConfig.targetScore,
        targetWordCount: levelConfig.targetWordCount,
        turnLimit: levelConfig.turnLimit,
      } : undefined;
      const winCheck = checkWinCondition(finalGame, levelForWinCheck, game.journeyLevelId);
      if (winCheck.finished) {
        set({
          game: {
            ...finalGame,
            status: 'finished',
            winnerId: winCheck.winnerId,
          },
        });
        return { success: true };
      }
      
      // Continue with normal flow for boss battles
      return { success: true };
    }
    
    // Switch turn (for non-boss battles or after boss battle processing)
    const otherPlayer = game.players.find(p => p.id !== game.currentPlayerId);
    const nextPlayerId = otherPlayer?.id || game.currentPlayerId;
    
    const updatedGame: GameState = {
      ...game,
      board: newBoard,
      players: updatedPlayers,
      currentPlayerId: nextPlayerId,
      turn: game.turn + 1,
      turnHistory: [...game.turnHistory, moveWithScore],
      lastMoveAt: new Date(),
      wordCount: newWordCount,
    };
    
    set({ game: updatedGame, currentMove: null });
    
    // Check win condition after player move
    const levelForWinCheck = levelConfig ? {
      baseObjective: levelConfig.baseObjective,
      targetScore: levelConfig.targetScore,
      targetWordCount: levelConfig.targetWordCount,
      turnLimit: levelConfig.turnLimit,
    } : undefined;
    const winCheck = checkWinCondition(updatedGame, levelForWinCheck, game.journeyLevelId);
    if (winCheck.finished) {
      set({
        game: {
          ...updatedGame,
          status: 'finished',
          winnerId: winCheck.winnerId,
        },
      });
      return { success: true };
    }
    
    // Draw new letters after every 2 turns (for both players)
    if (updatedGame.turn % 2 === 0) {
      const distribution = createLetterDistribution();
      const updatedWithNewLetters = updatedGame.players.map(player => {
        const newLetters = drawNewLetters(5, distribution);
        return {
          ...player,
          hand: [...player.hand, ...newLetters],
        };
      });
      
      const gameWithNewLetters = {
        ...updatedGame,
        players: updatedWithNewLetters,
      };
      
      set({ game: gameWithNewLetters });
      
      // If it's AI's turn, trigger AI move after a short delay
      const aiPlayer = gameWithNewLetters.players.find(p => p.id === gameWithNewLetters.currentPlayerId && p.isAI);
      if (aiPlayer) {
        setTimeout(() => {
          get().makeAIMove();
        }, 1000); // 1 second delay for AI thinking
      }
    } else {
      // If it's AI's turn, trigger AI move after a short delay
      const aiPlayer = updatedGame.players.find(p => p.id === updatedGame.currentPlayerId && p.isAI);
      if (aiPlayer) {
        setTimeout(() => {
          get().makeAIMove();
        }, 1000); // 1 second delay for AI thinking
      }
    }
    
    return { success: true };
  },
  
  makeAIMove: async () => {
    const { game } = get();
    if (!game) return;
    
    const aiPlayer = game.players.find(p => p.id === game.currentPlayerId && p.isAI);
    if (!aiPlayer || !aiPlayer.aiDifficulty) {
      return;
    }
    
    // Get level config
    const levelConfigForAI = game.mode === 'journey' && game.journeyLevelId 
      ? getLevel(game.journeyLevelId) 
      : null;
    
    // Check turn limit BEFORE allowing AI move
    if (levelConfigForAI?.turnLimit && game.turn >= levelConfigForAI.turnLimit) {
      // Game should already be finished, but check win condition to end it properly
      const levelForWinCheck = levelConfigForAI ? {
        baseObjective: levelConfigForAI.baseObjective,
        targetScore: levelConfigForAI.targetScore,
        targetWordCount: levelConfigForAI.targetWordCount,
        turnLimit: levelConfigForAI.turnLimit,
      } : undefined;
      const winCheck = checkWinCondition(game, levelForWinCheck, game.journeyLevelId);
      if (winCheck.finished) {
        set({
          game: {
            ...game,
            status: 'finished',
            winnerId: winCheck.winnerId,
          },
        });
      }
      return;
    }
    
    const allowGaps = levelConfigForAI?.allowGaps ?? false;
    
    const playerHand = game.players.find(p => !p.isAI)?.hand || [];
    
    // Make level 3 AI much easier
    let config = AI_CONFIGS[aiPlayer.aiDifficulty];
    if (game.journeyLevelId === 3) {
      // Create a very easy config for level 3
      config = {
        ...config,
        minWordLength: 2,
        maxWordLength: 3,
        pointsWeight: 10,
        blockingWeight: 0,
        boardControlWeight: 0,
        letterManagementWeight: 5,
        randomnessFactor: 50, // Much more random = easier
      };
    }
    
    // Calculate AI move
    const aiMove = calculateAIMove(game.board, aiPlayer.hand, playerHand, config, game.turn, allowGaps);
    
    if (!aiMove) {
      // AI has no valid moves - game might be stuck
      console.log('AI has no valid moves');
      return;
    }
    
    const dictionaryValidation = await ensureMoveWordsAreValid(game.board, aiMove);
    if (!dictionaryValidation.valid) {
      console.error('AI attempted invalid word:', dictionaryValidation.error);
      return;
    }

    // Validate and apply AI move
    const validation = validateMove(game.board, aiMove, aiPlayer.hand, isValidWord, allowGaps);
    if (!validation.valid) {
      console.error('AI move validation failed:', validation.error);
      return;
    }
    
    const { newBoard, newHand, score } = applyMove(game.board, aiMove, aiPlayer.hand);
    const aiMoveWithScore: Move = {
      ...aiMove,
      score,
    };
    
    // Check if boss battle
    const isBossBattle = game.journeyLevelId === 5 || game.journeyLevelId === 10;
    
    // Update game state
    let updatedPlayers = game.players.map(p => {
      if (p.id === aiPlayer.id) {
        return {
          ...p,
          hand: newHand,
          score: p.score + score,
        };
      }
      return p;
    });
    
    // Boss battle: Apply AI damage to player
    if (isBossBattle && aiPlayer.hp !== undefined) {
      const player = game.players.find(p => !p.isAI);
      const mainWordLength = aiMove.word.length;
      const damageToPlayer = calculateDamage(mainWordLength);
      
      // Update player HP
      if (player && player.hp !== undefined) {
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === player.id) {
            return { ...p, hp: Math.max(0, (player.hp || 0) - damageToPlayer) };
          }
          return p;
        });
      }
    }
    
    // Switch turn back to player
    const player = game.players.find(p => !p.isAI);
    const nextPlayerId = player?.id || game.currentPlayerId;
    
    const updatedGame: GameState = {
      ...game,
      board: newBoard,
      players: updatedPlayers,
      currentPlayerId: nextPlayerId,
      turn: game.turn + 1,
      turnHistory: [...game.turnHistory, aiMoveWithScore],
      lastMoveAt: new Date(),
    };
    
    set({ game: updatedGame });
    
    // Draw new letters after every 2 turns
    if (updatedGame.turn % 2 === 0) {
      const distribution = createLetterDistribution();
      const updatedWithNewLetters = updatedGame.players.map(player => {
        const newLetters = drawNewLetters(5, distribution);
        return {
          ...player,
          hand: [...player.hand, ...newLetters],
        };
      });
      
      const gameWithNewLetters = {
        ...updatedGame,
        players: updatedWithNewLetters,
      };
      
      set({ game: gameWithNewLetters });
    }
    
    // Check win condition after AI move
    const levelForWinCheck = levelConfigForAI ? {
      baseObjective: levelConfigForAI.baseObjective,
      targetScore: levelConfigForAI.targetScore,
      targetWordCount: levelConfigForAI.targetWordCount,
      turnLimit: levelConfigForAI.turnLimit,
    } : undefined;
    const winCheck = checkWinCondition(updatedGame, levelForWinCheck, game.journeyLevelId);
    if (winCheck.finished) {
      set({
        game: {
          ...updatedGame,
          status: 'finished',
          winnerId: winCheck.winnerId,
        },
      });
    }
  },
  
  endGame: () => {
    set({ game: null, currentMove: null });
  },
}));


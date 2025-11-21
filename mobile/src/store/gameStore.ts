import { create } from 'zustand';
import { GameState, Player, Move, Letter, Board, Position, AIDifficulty, GameMode } from '../types';
import { 
  createEmptyBoard, 
  createLetterDistribution, 
  drawLetters, 
  validateMove, 
  applyMove,
  isValidPosition,
  drawLetters as drawNewLetters,
  checkWinCondition,
} from '../lib/gameEngine';
import { isValidWord } from '../lib/dictionary';
import { calculateAIMove, AI_CONFIGS } from '../lib/aiEngine';

interface GameStore {
  // State
  game: GameState | null;
  currentMove: {
    positions: Position[];
    word: string;
    direction: 'horizontal' | 'vertical';
    selectedLetterIndices: number[];
  } | null;
  
  // Actions
  startGame: (mode: GameMode, aiDifficulty?: AIDifficulty) => void;
  selectLetter: (letter: Letter, index: number) => void;
  selectCell: (position: Position) => void;
  setDirection: (direction: 'horizontal' | 'vertical') => void;
  clearMove: () => void;
  submitMove: () => { success: boolean; error?: string };
  makeAIMove: () => Promise<void>;
  endGame: () => void;
}

export const useGameStore = create<GameStore>((set: any, get: any) => ({
  game: null,
  currentMove: null,
  
  startGame: (mode: GameMode, aiDifficulty: AIDifficulty = 'easy') => {
    const distribution = createLetterDistribution();
    const shuffled = [...distribution].sort(() => Math.random() - 0.5);
    
    const playerId = 'player-1';
    const aiId = 'ai-1';
    
    const player: Player = {
      id: playerId,
      name: 'You',
      hand: drawLetters(10, shuffled),
      score: 0,
      isAI: false,
    };
    
    const ai: Player = {
      id: aiId,
      name: `AI (${aiDifficulty})`,
      hand: drawLetters(10, shuffled),
      score: 0,
      isAI: true,
      aiDifficulty,
    };
    
    const game: GameState = {
      id: `game-${Date.now()}`,
      mode,
      board: createEmptyBoard(),
      players: [player, ai],
      currentPlayerId: playerId,
      turn: 1,
      status: 'playing',
      createdAt: new Date(),
      turnHistory: [],
      activePowerUps: [],
    };
    
    set({ game, currentMove: null });
  },
  
  selectLetter: (letter: Letter, index: number) => {
    const { game, currentMove } = get();
    if (!game) return;
    
    const currentPlayer = game.players.find((p: Player) => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) return;
    
    // Check if letter is already selected in this move
    const isAlreadySelected = currentMove?.selectedLetterIndices.includes(index);
    
    if (isAlreadySelected && currentMove) {
      // Deselect this letter
      const newIndices = currentMove.selectedLetterIndices.filter((i: number) => i !== index);
      const newWord = newIndices.map((i: number) => currentPlayer.hand[i].char).join('');
      const newPositions = currentMove.positions.slice(0, newWord.length);
      
      set({
        currentMove: {
          ...currentMove,
          word: newWord,
          selectedLetterIndices: newIndices,
          positions: newPositions,
          direction: currentMove.direction || 'horizontal',
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
          direction: 'horizontal',
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
    if (!game || !currentMove) return;
    
    const currentPlayer = game.players.find((p: Player) => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) return;
    
    // Check if position is already selected
    const isAlreadySelected = currentMove.positions.some(
      (pos: Position) => pos.row === position.row && pos.col === position.col
    );
    
    if (isAlreadySelected) {
      // Deselect this position and all after it
      const index = currentMove.positions.findIndex(
        (pos: Position) => pos.row === position.row && pos.col === position.col
      );
      const newPositions = currentMove.positions.slice(0, index);
      // Rebuild word up to this point
      const newWord = newPositions.map((pos: Position, i: number) => {
        const cell = game.board.cells[pos.row][pos.col];
        if (cell.letter) {
          return cell.letter.char;
        }
        const letterIndex = currentMove.selectedLetterIndices[i];
        if (letterIndex !== undefined && currentPlayer.hand[letterIndex]) {
          return currentPlayer.hand[letterIndex].char;
        }
        return '';
      }).join('');
      
      set({
        currentMove: {
          ...currentMove,
          positions: newPositions,
          word: newWord,
          selectedLetterIndices: currentMove.selectedLetterIndices.slice(0, index),
        },
      });
      return;
    }
    
    // Check if cell has a letter already on board
    const cell = game.board.cells[position.row][position.col];
    const boardLetter = cell.letter;
    
    // If cell has a letter, use it (don't need to select from hand)
    if (boardLetter) {
      // Validate position is adjacent to last position and follows direction
      const lastPos = currentMove.positions[currentMove.positions.length - 1];
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
        if (currentMove.direction && currentMove.direction !== newDirection) {
          return; // Invalid - cannot change direction mid-word
        }
        
        // Ensure positions form a consecutive sequence in the correct direction
        const existingDirection = currentMove.direction || newDirection;
        
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
        set({ currentMove: { ...currentMove, direction: newDirection } });
      }
      
      // Use board letter - add to word without using hand letter
      set({
        currentMove: {
          ...currentMove,
          word: currentMove.word + boardLetter.char,
          positions: [...currentMove.positions, position],
          // Don't add to selectedLetterIndices since it's from board
        },
      });
      return;
    }
    
    // Cell is empty - need letter from hand
    // Check if we have a letter selected from hand
    if (currentMove.selectedLetterIndices.length === 0 || 
        currentMove.word.length === currentMove.positions.length) {
      return; // Need to select letter from hand first
    }
    
    // Validate position is adjacent to last position and follows direction
    const lastPos = currentMove.positions[currentMove.positions.length - 1];
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
      if (currentMove.direction && currentMove.direction !== newDirection) {
        return; // Invalid - cannot change direction mid-word
      }
      
      // Ensure positions form a consecutive sequence in the correct direction
      const existingDirection = currentMove.direction || newDirection;
      
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
      set({ currentMove: { ...currentMove, direction: newDirection } });
    }
    
    // Add position if there's a letter in current word that matches hand
    if (currentMove.word.length > currentMove.positions.length) {
      const nextLetterIndex = currentMove.positions.length;
      const nextLetter = currentMove.word[nextLetterIndex];
      
      // Verify this position should have this letter
      set({
        currentMove: {
          ...currentMove,
          positions: [...currentMove.positions, position],
        },
      });
    }
  },
  
  setDirection: (direction: 'horizontal' | 'vertical') => {
    const { currentMove } = get();
    if (currentMove) {
      set({ currentMove: { ...currentMove, direction } });
    }
  },
  
  clearMove: () => {
    set({ currentMove: null });
  },
  
  submitMove: () => {
    const { game, currentMove } = get();
    if (!game || !currentMove) {
      return { success: false, error: 'No move to submit' };
    }
    
    const currentPlayer = game.players.find((p: Player) => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) {
      return { success: false, error: 'Not your turn' };
    }
    
    if (currentMove.positions.length === 0 || currentMove.word.length === 0) {
      return { success: false, error: 'Invalid move' };
    }
    
    if (currentMove.positions.length !== currentMove.word.length) {
      return { success: false, error: 'Word length does not match positions' };
    }
    
    const move: Move = {
      positions: currentMove.positions,
      word: currentMove.word,
      direction: currentMove.direction,
      score: 0, // Will be calculated
      playerId: currentPlayer.id,
    };
    
    const validation = validateMove(game.board, move, currentPlayer.hand, isValidWord);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid move' };
    }
    
    // Apply move
    const { newBoard, newHand, score } = applyMove(game.board, move, currentPlayer.hand);
    
    // Update game state
    const updatedPlayers = game.players.map((p: Player) => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          hand: newHand,
          score: p.score + score,
        };
      }
      return p;
    });
    
    // Switch turn
    const otherPlayer = game.players.find((p: Player) => p.id !== game.currentPlayerId);
    const nextPlayerId = otherPlayer?.id || game.currentPlayerId;
    
    const updatedGame: GameState = {
      ...game,
      board: newBoard,
      players: updatedPlayers,
      currentPlayerId: nextPlayerId,
      turn: game.turn + 1,
      turnHistory: [...game.turnHistory, move],
      lastMoveAt: new Date(),
    };
    
    set({ game: updatedGame, currentMove: null });
    
    // Draw new letters after every 2 turns (for both players)
    if (updatedGame.turn % 2 === 0) {
      const distribution = createLetterDistribution();
      const updatedWithNewLetters = updatedGame.players.map((player: Player) => {
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
      const aiPlayer = gameWithNewLetters.players.find((p: Player) => p.id === gameWithNewLetters.currentPlayerId && p.isAI);
      if (aiPlayer) {
        setTimeout(() => {
          get().makeAIMove();
        }, 1000); // 1 second delay for AI thinking
      }
    } else {
      // If it's AI's turn, trigger AI move after a short delay
      const aiPlayer = updatedGame.players.find((p: Player) => p.id === updatedGame.currentPlayerId && p.isAI);
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
    
    const aiPlayer = game.players.find((p: Player) => p.id === game.currentPlayerId && p.isAI);
    if (!aiPlayer || !aiPlayer.aiDifficulty) {
      return;
    }
    
    const playerHand = game.players.find((p: Player) => !p.isAI)?.hand || [];
    const config = AI_CONFIGS[aiPlayer.aiDifficulty as AIDifficulty];
    
    // Calculate AI move
    const aiMove = calculateAIMove(game.board, aiPlayer.hand, playerHand, config, game.turn);
    
    if (!aiMove) {
      // AI has no valid moves - game might be stuck
      console.log('AI has no valid moves');
      return;
    }
    
    // Validate and apply AI move
    const validation = validateMove(game.board, aiMove, aiPlayer.hand, isValidWord);
    if (!validation.valid) {
      console.error('AI move validation failed:', validation.error);
      return;
    }
    
    const { newBoard, newHand, score } = applyMove(game.board, aiMove, aiPlayer.hand);
    
    // Update game state
    const updatedPlayers = game.players.map((p: Player) => {
      if (p.id === aiPlayer.id) {
        return {
          ...p,
          hand: newHand,
          score: p.score + score,
        };
      }
      return p;
    });
    
    // Switch turn back to player
    const player = game.players.find((p: Player) => !p.isAI);
    const nextPlayerId = player?.id || game.currentPlayerId;
    
    const updatedGame: GameState = {
      ...game,
      board: newBoard,
      players: updatedPlayers,
      currentPlayerId: nextPlayerId,
      turn: game.turn + 1,
      turnHistory: [...game.turnHistory, aiMove],
      lastMoveAt: new Date(),
    };
    
    set({ game: updatedGame });
    
    // Draw new letters after every 2 turns
    if (updatedGame.turn % 2 === 0) {
      const distribution = createLetterDistribution();
      const updatedWithNewLetters = updatedGame.players.map((player: Player) => {
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
    
    // Check win condition
    const winCheck = checkWinCondition(updatedGame);
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


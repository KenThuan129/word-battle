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
  markCorruptedSquares,
  doesBoardContainWord,
} from '@/lib/gameEngine';
import { isValidWord } from '@/lib/dictionary';
import { calculateAIMove, AI_CONFIGS } from '@/lib/aiEngine';
import { checkWinCondition } from '@/lib/gameEngine';
import { getLevel } from '@/lib/journeyLevels';
import { addWordToBank } from '@/lib/wordBankUtils';

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
  exchangeVowel: () => { success: boolean; error?: string };
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
    
    // Get level config for special mechanics
    const levelConfig = mode === 'journey' && options?.journeyLevelId 
      ? getLevel(options.journeyLevelId) 
      : null;
    
    // Check if level has AI (defaults to true for backward compatibility)
    const hasAI = levelConfig?.hasAI !== false;
    
    // Create board with custom size if specified
    const boardWidth = levelConfig?.boardWidth;
    const boardHeight = levelConfig?.boardHeight;
    let initialBoard = createEmptyBoard(boardWidth, boardHeight);
    
    // For Level 3, place "RACING" on the board at start
    if (options?.journeyLevelId === 3) {
      initialBoard = placeStartingWord(initialBoard, 'RACING');
    }
    
    // Place level-specific starting word if defined (e.g., Level 6, 7)
    if (levelConfig?.startingWord) {
      initialBoard = placeStartingWord(initialBoard, levelConfig.startingWord);
    }
    
    // For Level 7, mark 3 random squares as corrupted
    if (options?.journeyLevelId === 7) {
      const boardW = initialBoard.width || initialBoard.size;
      const boardH = initialBoard.height || initialBoard.size;
      const corruptedSquares: Position[] = [];
      const usedPositions = new Set<string>();
      
      // Randomly select 3 non-center, non-occupied squares
      while (corruptedSquares.length < 3) {
        const row = Math.floor(Math.random() * boardH);
        const col = Math.floor(Math.random() * boardW);
        const posKey = `${row},${col}`;
        const cell = initialBoard.cells[row][col];
        
        // Skip if already used, is center, or has a letter
        if (!usedPositions.has(posKey) && !cell.isCenter && !cell.letter) {
          corruptedSquares.push({ row, col });
          usedPositions.add(posKey);
        }
      }
      
      initialBoard = markCorruptedSquares(initialBoard, corruptedSquares);
    }
    
    let playerHand = drawLetters(10, shuffled);
    const needsGuarantee = Math.random() < 0.45;
    if (isBeginnerJourney && (needsGuarantee || !hasBeginnerWord(playerHand))) {
      playerHand = injectBeginnerWord(playerHand);
    }
    
    // For Level 7, boost S, T, R, A letters for first 3 turns
    if (options?.journeyLevelId === 7 && levelConfig?.specialLetterDistribution) {
      const { letters, turns } = levelConfig.specialLetterDistribution;
      // Replace some letters in hand with boosted letters (higher chance)
      const boostedLetters = letters.map(char => ({
        char,
        points: LETTER_CONFIG[char]?.points || 1,
      }));
      
      // Replace 3-4 random letters with boosted letters
      const numReplacements = Math.min(4, playerHand.length);
      for (let i = 0; i < numReplacements; i++) {
        const randomIndex = Math.floor(Math.random() * playerHand.length);
        const randomBoosted = boostedLetters[Math.floor(Math.random() * boostedLetters.length)];
        playerHand[randomIndex] = randomBoosted;
      }
    }
    
    // Check if boss battle (levels 5 or 10)
    const isBossBattle = options?.journeyLevelId === 5 || options?.journeyLevelId === 10;
    
    // Set AI HP based on level: Level 5 = 65 HP, Level 10 = 75 HP
    const aiHp = isBossBattle 
      ? (options.journeyLevelId === 5 ? 65 : options.journeyLevelId === 10 ? 75 : 200)
      : undefined;
    
    const player: Player = {
      id: playerId,
      name: 'You',
      hand: playerHand,
      score: 0,
      hp: isBossBattle ? 100 : undefined,
      isAI: false,
    };
    
    const players: Player[] = [player];
    
    // Only add AI if level has AI
    if (hasAI) {
      let aiHand = drawLetters(10, shuffled);
      if (isBeginnerJourney) {
        aiHand = softenAIHand(aiHand);
      }
      
      const ai: Player = {
        id: aiId,
        name: `AI (${aiDifficulty})`,
        hand: aiHand,
        score: 0,
        hp: aiHp,
        isAI: true,
        aiDifficulty,
      };
      players.push(ai);
    }
    
    const game: GameState = {
      id: `game-${Date.now()}`,
      mode,
      board: initialBoard,
      players,
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
      
      // If we have board letters in the word, we need to append the hand letter to the existing word
      // Otherwise, build word from scratch from selected hand letters
      let newWord: string;
      if (currentMove.positions.length > 0 && currentMove.word.length === currentMove.positions.length) {
        // We have board letters only - append hand letter to extend the word
        newWord = currentMove.word + letter.char;
      } else {
        // Build word from selected hand letters
        newWord = newIndices.map(i => currentPlayer.hand[i].char).join('');
      }
      
      set({
        currentMove: {
          ...currentMove,
          word: newWord,
          selectedLetterIndices: newIndices,
          // Don't clear positions if we're extending board letters
          // Only adjust positions if word is shorter than positions
          positions: currentMove.positions.length <= newWord.length 
            ? currentMove.positions 
            : currentMove.positions.slice(0, newWord.length),
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
    // Allow placing if:
    // 1. We have selected letters from hand that haven't been placed yet (word.length > positions.length), OR
    // 2. We have board letters and have selected a letter from hand to extend (selectedLetterIndices.length > 0)
    const hasUnplacedHandLetters = activeMove.word.length > activeMove.positions.length;
    const hasSelectedHandLetter = activeMove.selectedLetterIndices.length > 0;
    const hasBoardLetters = activeMove.positions.length > 0;
    
    // Must have either unplaced hand letters OR (board letters + selected hand letter to extend)
    if (!hasUnplacedHandLetters) {
      if (!hasSelectedHandLetter || !hasBoardLetters) {
        // Need to select a letter from hand first if we have board letters
        // OR need to have something selected if we don't have board letters
        if (activeMove.selectedLetterIndices.length === 0 && activeMove.positions.length === 0) {
          return; // Nothing selected yet
        }
        if (hasBoardLetters && !hasSelectedHandLetter) {
          return; // Have board letters but no hand letter selected to extend
        }
      }
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
  
  exchangeVowel: () => {
    const { game } = get();
    if (!game) {
      return { success: false, error: 'No game active' };
    }
    
    const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Find first consonant in hand
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const consonantIndex = currentPlayer.hand.findIndex(
      letter => !vowels.includes(letter.char.toUpperCase())
    );
    
    if (consonantIndex === -1) {
      return { success: false, error: 'No consonants in hand to exchange' };
    }
    
    // Weighted random vowel selection
    // E: 45% chance, A/I/O: 15% each, U: 10% chance
    const random = Math.random();
    let newVowel: string;
    if (random < 0.45) {
      newVowel = 'E';
    } else if (random < 0.60) {
      newVowel = 'A';
    } else if (random < 0.75) {
      newVowel = 'I';
    } else if (random < 0.90) {
      newVowel = 'O';
    } else {
      newVowel = 'U';
    }
    
    // Get points for the new vowel from LETTER_CONFIG
    const vowelPoints = LETTER_CONFIG[newVowel]?.points || 1;
    
    // Replace consonant with vowel
    const newHand = [...currentPlayer.hand];
    newHand[consonantIndex] = {
      char: newVowel,
      points: vowelPoints,
    };
    
    // Update player's hand
    const updatedPlayers = game.players.map(p => 
      p.id === currentPlayer.id 
        ? { ...p, hand: newHand }
        : p
    );
    
    set({
      game: {
        ...game,
        players: updatedPlayers,
      },
    });
    
    return { success: true };
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
        targetWord: levelConfig.targetWord,
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
    
    // Replenish hand to maintain 10 letters after move
    const targetHandSize = 10;
    const lettersNeeded = Math.max(0, targetHandSize - newHand.length);
    let replenishedHand = [...newHand];
    
    if (lettersNeeded > 0) {
      const distribution = createLetterDistribution();
      const newLetters = drawNewLetters(lettersNeeded, distribution);
      replenishedHand = [...newHand, ...newLetters];
    }
    
    // Boss battle: Calculate damage and apply to opponent
    let updatedPlayers = game.players.map(p => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          hand: replenishedHand,
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
      
      // Add word to word bank (only for player moves, not AI)
      addWordToBank(move.word, score, true).catch(error => {
        console.error('Error adding word to bank:', error);
      });
      
      // For Level 7, check if target word "STARS" was built in this move or exists on the board
      if (game.journeyLevelId === 7 && levelConfig?.targetWord) {
        const moveBuiltTargetWord = move.word.toUpperCase() === levelConfig.targetWord.toUpperCase();
        const hasTargetWord = moveBuiltTargetWord || doesBoardContainWord(newBoard, levelConfig.targetWord);
        
        if (hasTargetWord) {
          set({
            game: {
              ...finalGame,
              status: 'finished',
              winnerId: currentPlayer.id,
            },
            currentMove: null,
          });
          return { success: true };
        }
      }
      
      // Check win condition after player move
      const levelForWinCheck = levelConfig ? {
        baseObjective: levelConfig.baseObjective,
        targetScore: levelConfig.targetScore,
        targetWordCount: levelConfig.targetWordCount,
        turnLimit: levelConfig.turnLimit,
        targetWord: levelConfig.targetWord,
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
      
      // If it's AI's turn, trigger AI move after a short delay
      const aiPlayer = finalGame.players.find(p => p.id === finalGame.currentPlayerId && p.isAI);
      if (aiPlayer) {
        setTimeout(() => {
          get().makeAIMove();
        }, 1000); // 1 second delay for AI thinking
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
    
    // Add word to word bank (only for player moves, not AI)
    addWordToBank(move.word, score, true).catch(error => {
      console.error('Error adding word to bank:', error);
    });

    // For Level 7, check if target word "STARS" exists anywhere on the board
    if (game.journeyLevelId === 7 && levelConfig?.targetWord) {
      const moveBuiltTargetWord = move.word.toUpperCase() === levelConfig.targetWord.toUpperCase();
      const hasTargetWord = moveBuiltTargetWord || doesBoardContainWord(newBoard, levelConfig.targetWord);

      if (hasTargetWord) {
        set({
          game: {
            ...updatedGame,
            status: 'finished',
            winnerId: currentPlayer.id,
          },
          currentMove: null,
        });
        return { success: true };
      }
    }
    
    // Check win condition after player move
    const levelForWinCheck = levelConfig ? {
      baseObjective: levelConfig.baseObjective,
      targetScore: levelConfig.targetScore,
      targetWordCount: levelConfig.targetWordCount,
      turnLimit: levelConfig.turnLimit,
      targetWord: levelConfig.targetWord,
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
    
    // If it's AI's turn, trigger AI move after a short delay
    const aiPlayer = updatedGame.players.find(p => p.id === updatedGame.currentPlayerId && p.isAI);
    if (aiPlayer) {
      setTimeout(() => {
        get().makeAIMove();
      }, 1000); // 1 second delay for AI thinking
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
    
    // Replenish AI hand to maintain 10 letters after move
    const targetHandSize = 10;
    const lettersNeeded = Math.max(0, targetHandSize - newHand.length);
    let replenishedHand = [...newHand];
    
    if (lettersNeeded > 0) {
      const distribution = createLetterDistribution();
      const newLetters = drawNewLetters(lettersNeeded, distribution);
      replenishedHand = [...newHand, ...newLetters];
    }
    
    // Update game state
    let updatedPlayers = game.players.map(p => {
      if (p.id === aiPlayer.id) {
        return {
          ...p,
          hand: replenishedHand,
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
    
    // Add AI's word to word bank (so player can learn from AI moves, but don't show toast)
    addWordToBank(aiMove.word, score, false).catch(error => {
      console.error('Error adding AI word to bank:', error);
    });
    
    // Hand replenishment is now done after each move, so no need for periodic replenishment
    
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


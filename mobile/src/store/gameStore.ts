import { create } from 'zustand';
import { GameState, Player, Move, Letter, Position, AIDifficulty, GameMode } from '../types';
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
  checkWinCondition,
} from '../lib/gameEngine';
import { isValidWord } from '../lib/dictionary';
import { calculateAIMove, AI_CONFIGS, hasValidMove } from '../lib/aiEngine';
import { getLevel } from '../lib/journeyLevels';
import { addWordToBank } from '../lib/wordBankUtils';

interface StartGameOptions {
  journeyLevelId?: number;
  dailyPuzzleId?: string;
  dailyTargetScore?: number;
}

interface GameStore {
  game: GameState | null;
  currentMove: {
    positions: Position[];
    word: string;
    direction: 'horizontal' | 'vertical' | null;
    selectedLetterIndices: number[];
  } | null;
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

export const useGameStore = create<GameStore>((set, get) => {
  const finishWithCheckmate = (gameState: GameState, winner: Player, message: string) => {
    const updatedPlayers = gameState.players.map(p =>
      p.id === winner.id ? { ...p, score: p.score + 5 } : p
    );

    set({
      game: {
        ...gameState,
        players: updatedPlayers,
        status: 'finished',
        winnerId: winner.id,
        lastEvent: { type: 'checkmate', message },
        lastMoveAt: new Date(),
      },
      currentMove: null,
    });
  };

  const ensureHumanHasMove = (gameState: GameState, allowGaps: boolean): boolean => {
    const currentPlayer = gameState.players.find(
      p => p.id === gameState.currentPlayerId && !p.isAI
    );
    if (!currentPlayer) {
      return false;
    }
    const aiOpponent = gameState.players.find(p => p.isAI);
    if (!aiOpponent) {
      return false;
    }
    const hasMove = hasValidMove(
      gameState.board,
      currentPlayer.hand,
      AI_CONFIGS.easy,
      allowGaps
    );
    if (!hasMove) {
      finishWithCheckmate(gameState, aiOpponent, 'Checkmate! AI wins +5 points.');
      return true;
    }
    return false;
  };

  return ({
  game: null,
  currentMove: null,
  
  startGame: (mode: GameMode, aiDifficulty: AIDifficulty = 'easy', options?: StartGameOptions) => {
    const distribution = createLetterDistribution();
    const shuffled = [...distribution].sort(() => Math.random() - 0.5);
    
    const playerId = 'player-1';
    const aiId = 'ai-1';
    const isBeginnerJourney = mode === 'journey' && options?.journeyLevelId && options.journeyLevelId <= 3;
    
    const levelConfig = mode === 'journey' && options?.journeyLevelId 
      ? getLevel(options.journeyLevelId) 
      : null;
    
    const hasAI = levelConfig?.hasAI !== false;
    
    const boardWidth = levelConfig?.boardWidth;
    const boardHeight = levelConfig?.boardHeight;
    let initialBoard = createEmptyBoard(boardWidth, boardHeight);
    
    if (options?.journeyLevelId === 3) {
      initialBoard = placeStartingWord(initialBoard, 'RACING');
    }
    
    if (levelConfig?.startingWord) {
      initialBoard = placeStartingWord(initialBoard, levelConfig.startingWord);
    }
    
    if (options?.journeyLevelId === 7) {
      const boardW = initialBoard.width || initialBoard.size;
      const boardH = initialBoard.height || initialBoard.size;
      const corruptedSquares: Position[] = [];
      const usedPositions = new Set<string>();
      
      while (corruptedSquares.length < 3) {
        const row = Math.floor(Math.random() * boardH);
        const col = Math.floor(Math.random() * boardW);
        const posKey = `${row},${col}`;
        const cell = initialBoard.cells[row][col];
        
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
    
    if (options?.journeyLevelId === 7 && levelConfig?.specialLetterDistribution) {
      const { letters } = levelConfig.specialLetterDistribution;
      const boostedLetters = letters.map(char => ({
        char,
        points: LETTER_CONFIG[char]?.points || 1,
      }));
      
      const numReplacements = Math.min(4, playerHand.length);
      for (let i = 0; i < numReplacements; i++) {
        const randomIndex = Math.floor(Math.random() * playerHand.length);
        const randomBoosted = boostedLetters[Math.floor(Math.random() * boostedLetters.length)];
        playerHand[randomIndex] = randomBoosted;
      }
    }
    
    const isBossBattle = options?.journeyLevelId === 5 || options?.journeyLevelId === 10;
    
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
      dailyChallenge: mode === 'daily' && options?.dailyPuzzleId
        ? {
            puzzleId: options.dailyPuzzleId,
            targetScore: options.dailyTargetScore,
          }
        : undefined,
      sigilCount: isBossBattle ? 0 : undefined,
      activeSigilEffects: isBossBattle ? [] : undefined,
      fiveLetterWordCount: options?.journeyLevelId === 10 ? 0 : undefined,
    };
    
    set({ game, currentMove: null });

    const allowGapsForStart = levelConfig?.allowGaps ?? false;
    ensureHumanHasMove(game, allowGapsForStart);
  },
  
  selectLetter: (letter: Letter, index: number) => {
    const { game, currentMove } = get();
    if (!game) return;
    
    const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
    if (!currentPlayer || currentPlayer.isAI) return;
    
    const isAlreadySelected = currentMove?.selectedLetterIndices.includes(index);
    
    if (isAlreadySelected && currentMove) {
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
      const newIndices = [...currentMove.selectedLetterIndices, index];
      let newWord: string;
      if (currentMove.positions.length > 0 && currentMove.word.length === currentMove.positions.length) {
        newWord = currentMove.word + letter.char;
      } else {
        newWord = newIndices.map(i => currentPlayer.hand[i].char).join('');
      }
      
      set({
        currentMove: {
          ...currentMove,
          word: newWord,
          selectedLetterIndices: newIndices,
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
    
    const isAlreadySelected = activeMove.positions.some(
      pos => pos.row === position.row && pos.col === position.col
    );
    
    if (isAlreadySelected) {
      const index = activeMove.positions.findIndex(
        pos => pos.row === position.row && pos.col === position.col
      );
      const newPositions = activeMove.positions.slice(0, index);
      const newWord = newPositions.map((pos, i) => {
        const tile = game.board.cells[pos.row][pos.col];
        if (tile.letter) {
          return tile.letter.char;
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
    
    if (boardLetter) {
      const lastPos = activeMove.positions[activeMove.positions.length - 1];
      if (lastPos) {
        const rowDiff = position.row - lastPos.row;
        const colDiff = position.col - lastPos.col;
        
        const isHorizontalAdjacent = rowDiff === 0 && Math.abs(colDiff) === 1;
        const isVerticalAdjacent = colDiff === 0 && Math.abs(rowDiff) === 1;
        
        let bridgePositions: Position[] | null = null;
        if (!isHorizontalAdjacent && !isVerticalAdjacent) {
          bridgePositions = getBridgePositions(game.board, activeMove.positions, lastPos, position);
          if (!bridgePositions) {
            return;
          }
        }
        
        const newDirection: 'horizontal' | 'vertical' = (isHorizontalAdjacent || (bridgePositions && lastPos.row === position.row))
          ? 'horizontal'
          : 'vertical';
        
        if (activeMove.direction && activeMove.direction !== newDirection) {
          return;
        }
        
        const existingDirection = activeMove.direction || newDirection;
        
        if (existingDirection === 'horizontal') {
          if (position.row !== lastPos.row) {
            return;
          }
          for (const pos of currentMove.positions) {
            if (pos.row !== lastPos.row) {
              return;
            }
          }
        } else {
          if (position.col !== lastPos.col) {
            return;
          }
          for (const pos of currentMove.positions) {
            if (pos.col !== lastPos.col) {
              return;
            }
          }
        }
        
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
      
      set({
        currentMove: {
          ...activeMove,
          word: activeMove.word + boardLetter.char,
          positions: [...activeMove.positions, position],
        },
      });
      return;
    }
    
    const hasUnplacedHandLetters = activeMove.word.length > activeMove.positions.length;
    const hasSelectedHandLetter = activeMove.selectedLetterIndices.length > 0;
    const hasBoardLetters = activeMove.positions.length > 0;
    
    if (!hasUnplacedHandLetters) {
      if (!hasSelectedHandLetter || !hasBoardLetters) {
        if (activeMove.selectedLetterIndices.length === 0 && activeMove.positions.length === 0) {
          return;
        }
        if (hasBoardLetters && !hasSelectedHandLetter) {
          return;
        }
      }
    }
    
    const lastPos = activeMove.positions[activeMove.positions.length - 1];
    if (lastPos) {
      const rowDiff = position.row - lastPos.row;
      const colDiff = position.col - lastPos.col;
      
      const isHorizontalAdjacent = rowDiff === 0 && Math.abs(colDiff) === 1;
      const isVerticalAdjacent = colDiff === 0 && Math.abs(rowDiff) === 1;
      
      if (!isHorizontalAdjacent && !isVerticalAdjacent) {
        return;
      }
      
      const newDirection: 'horizontal' | 'vertical' = isHorizontalAdjacent ? 'horizontal' : 'vertical';
      
      if (activeMove.direction && activeMove.direction !== newDirection) {
        return;
      }
      
      const existingDirection = activeMove.direction || newDirection;
      
      if (existingDirection === 'horizontal') {
        if (position.row !== lastPos.row) {
          return;
        }
        for (const pos of currentMove.positions) {
          if (pos.row !== lastPos.row) {
            return;
          }
        }
      } else {
        if (position.col !== lastPos.col) {
          return;
        }
        for (const pos of currentMove.positions) {
          if (pos.col !== lastPos.col) {
            return;
          }
        }
      }
      
      set({ currentMove: { ...activeMove, direction: newDirection } });
    }
    
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
    
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const consonantIndex = currentPlayer.hand.findIndex(
      letter => !vowels.includes(letter.char.toUpperCase())
    );
    
    if (consonantIndex === -1) {
      return { success: false, error: 'No consonants in hand to exchange' };
    }
    
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
    
    const vowelPoints = LETTER_CONFIG[newVowel]?.points || 1;
    
    const newHand = [...currentPlayer.hand];
    newHand[consonantIndex] = {
      char: newVowel,
      points: vowelPoints,
    };
    
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
    
    const levelConfig = game.mode === 'journey' && game.journeyLevelId 
      ? getLevel(game.journeyLevelId) 
      : null;
    
    if (levelConfig?.turnLimit && (game.turn + 1) > levelConfig.turnLimit) {
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
      score: 0,
      playerId: currentPlayer.id,
    };

    const allowGaps = levelConfig?.allowGaps ?? false;
    
    // Wrap dictionary validation in try-catch to prevent hanging
    let dictionaryValidation;
    try {
      // Add timeout wrapper for dictionary validation (5 seconds)
      const validationPromise = ensureMoveWordsAreValid(game.board, move);
      const timeoutPromise = new Promise<{ valid: boolean; error?: string }>((resolve) => {
        setTimeout(() => resolve({ valid: false, error: 'Dictionary validation timed out. Please check your word.' }), 5000);
      });
      
      dictionaryValidation = await Promise.race([validationPromise, timeoutPromise]);
    } catch (error) {
      console.error('Dictionary validation error:', error);
      // Fallback: validate using local dictionary only (synchronous check)
      // Check if the main word is valid in local dictionary
      const mainWordValid = isValidWord(move.word);
      if (!mainWordValid) {
        dictionaryValidation = { valid: false, error: `"${move.word}" is not a valid word` };
      } else {
        // For now, allow the move if local dictionary says it's valid
        // This prevents hanging while still validating
        dictionaryValidation = { valid: true };
      }
    }
    
    if (!dictionaryValidation.valid) {
      return { success: false, error: dictionaryValidation.error || 'Invalid word' };
    }
    
    const validation = validateMove(game.board, move, currentPlayer.hand, isValidWord, allowGaps);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid move' };
    }
    
    const isBossBattle = game.journeyLevelId === 5 || game.journeyLevelId === 10;
    
    const { newBoard, newHand, score } = applyMove(game.board, move, currentPlayer.hand);
    const moveWithScore: Move = {
      ...move,
      score,
    };
    
    const newWordCount = (game.wordCount || 0) + 1;
    
    const targetHandSize = 10;
    const lettersNeeded = Math.max(0, targetHandSize - newHand.length);
    let replenishedHand = [...newHand];
    
    if (lettersNeeded > 0) {
      const distribution = createLetterDistribution();
      const newLetters = drawNewLetters(lettersNeeded, distribution);
      replenishedHand = [...newHand, ...newLetters];
    }
    
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
    
    if (isBossBattle && currentPlayer.hp !== undefined) {
      const opponent = game.players.find(p => p.id !== currentPlayer.id);
      const mainWordLength = move.word.length;
      let damageToOpponent = calculateDamage(mainWordLength);
      
      const activeEffects = game.activeSigilEffects || [];
      for (const effect of activeEffects) {
        if (effect.turnsRemaining > 0) {
          damageToOpponent += effect.damage;
        }
      }
      
      let newSigilCount = (game.sigilCount || 0) + 1;
      let newActiveEffects = [...(game.activeSigilEffects || [])];
      let newFiveLetterWordCount = game.fiveLetterWordCount || 0;
      
      if (game.journeyLevelId === 10 && mainWordLength === 5) {
        newFiveLetterWordCount += 1;
      }
      
      if (game.journeyLevelId === 5 && newSigilCount % 3 === 0) {
        damageToOpponent += 4;
        newActiveEffects.push({ type: 'endless_knowledge', damage: 2, turnsRemaining: 1 });
        newActiveEffects.push({ type: 'endless_knowledge', damage: 2, turnsRemaining: 2 });
        newActiveEffects.push({ type: 'endless_knowledge', damage: 2, turnsRemaining: 3 });
      }
      
      if (game.journeyLevelId === 10 && newSigilCount % 5 === 0) {
        const sigilDamage = 10 * newFiveLetterWordCount;
        damageToOpponent += sigilDamage;
      }
      
      if (opponent && opponent.hp !== undefined) {
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === opponent.id) {
            return { ...p, hp: Math.max(0, (opponent.hp || 0) - damageToOpponent) };
          }
          return p;
        });
      }
      
      newActiveEffects = newActiveEffects.map(effect => ({
        ...effect,
        turnsRemaining: effect.turnsRemaining - 1,
      })).filter(effect => effect.turnsRemaining > 0);
      
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
      
      const nextPlayerId = opponent?.id || game.currentPlayerId;
      const finalGame: GameState = {
        ...updatedGameWithSigils,
        currentPlayerId: nextPlayerId,
        turn: game.turn + 1,
      };
      
      set({ game: finalGame, currentMove: null });
      
      addWordToBank(move.word, score, true).catch(error => {
        console.error('Error adding word to bank:', error);
      });
      
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
      
      const aiPlayer = finalGame.players.find(p => p.id === finalGame.currentPlayerId && p.isAI);
      if (aiPlayer) {
        const aiDifficulty = aiPlayer.aiDifficulty ?? 'easy';
        const aiConfig = AI_CONFIGS[aiDifficulty];
        const aiHasMove = hasValidMove(finalGame.board, aiPlayer.hand, aiConfig, allowGaps);
        if (!aiHasMove) {
          const humanWinner = finalGame.players.find(p => !p.isAI);
          if (humanWinner) {
            finishWithCheckmate(finalGame, humanWinner, 'Checkmate! Player wins +5 points.');
            return { success: true };
          }
        }

        setTimeout(() => {
          get().makeAIMove();
        }, 1000);
      }
      
      return { success: true };
    }
    
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
    
    addWordToBank(move.word, score, true).catch(error => {
      console.error('Error adding word to bank:', error);
    });

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
    
    const aiPlayer = updatedGame.players.find(p => p.id === updatedGame.currentPlayerId && p.isAI);
    if (aiPlayer) {
      const aiDifficulty = aiPlayer.aiDifficulty ?? 'easy';
      const aiConfig = AI_CONFIGS[aiDifficulty];
      const aiHasMove = hasValidMove(updatedGame.board, aiPlayer.hand, aiConfig, allowGaps);
      if (!aiHasMove) {
        const humanWinner = updatedGame.players.find(p => !p.isAI);
        if (humanWinner) {
          finishWithCheckmate(updatedGame, humanWinner, 'Checkmate! Player wins +5 points.');
          return { success: true };
        }
      }

      setTimeout(() => {
        get().makeAIMove();
      }, 1000);
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
    
    const levelConfigForAI = game.mode === 'journey' && game.journeyLevelId 
      ? getLevel(game.journeyLevelId) 
      : null;
    
    if (levelConfigForAI?.turnLimit && game.turn >= levelConfigForAI.turnLimit) {
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
    
    let config = AI_CONFIGS[aiPlayer.aiDifficulty];
    if (game.journeyLevelId === 3) {
      config = {
        ...config,
        minWordLength: 2,
        maxWordLength: 3,
        pointsWeight: 10,
        blockingWeight: 0,
        boardControlWeight: 0,
        letterManagementWeight: 5,
        randomnessFactor: 50,
      };
    }
    
    const aiMove = calculateAIMove(game.board, aiPlayer.hand, playerHand, config, game.turn, allowGaps);
    
    if (!aiMove) {
      const playerWinner = game.players.find(p => !p.isAI);
      if (playerWinner) {
        finishWithCheckmate(game, playerWinner, 'Checkmate! Player wins +5 points.');
      }
      return;
    }
    
    const dictionaryValidation = await ensureMoveWordsAreValid(game.board, aiMove);
    if (!dictionaryValidation.valid) {
      console.error('AI attempted invalid word:', dictionaryValidation.error);
      return;
    }

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
    
    const isBossBattle = game.journeyLevelId === 5 || game.journeyLevelId === 10;
    
    const targetHandSize = 10;
    const lettersNeeded = Math.max(0, targetHandSize - newHand.length);
    let replenishedHand = [...newHand];
    
    if (lettersNeeded > 0) {
      const distribution = createLetterDistribution();
      const newLetters = drawNewLetters(lettersNeeded, distribution);
      replenishedHand = [...newHand, ...newLetters];
    }
    
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
    
    if (isBossBattle && aiPlayer.hp !== undefined) {
      const player = game.players.find(p => !p.isAI);
      const mainWordLength = aiMove.word.length;
      const damageToPlayer = calculateDamage(mainWordLength);
      
      if (player && player.hp !== undefined) {
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === player.id) {
            return { ...p, hp: Math.max(0, (player.hp || 0) - damageToPlayer) };
          }
          return p;
        });
      }
    }
    
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
    
    addWordToBank(aiMove.word, score, false).catch(error => {
      console.error('Error adding AI word to bank:', error);
    });

    if (ensureHumanHasMove(updatedGame, allowGaps)) {
      return;
    }
    
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
});
})

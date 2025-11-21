// AI Decision Engine

import { Board, Letter, Move, Position, AIDifficulty, AIConfig } from '@/types';
import { 
  isValidPosition, 
  validateMove, 
  getAllWordsFromMove, 
  calculateWordScore,
  isFirstMove,
  passesThroughCenter,
  hasAdjacentLetter,
  LETTER_CONFIG,
} from './gameEngine';
import { isValidWord } from './dictionary';

// AI Configuration presets
export const AI_CONFIGS: Record<AIDifficulty, AIConfig> = {
  easy: {
    difficulty: 'easy',
    minWordLength: 2,
    maxWordLength: 4,
    vocabularyTier: 1,
    pointsWeight: 30,
    blockingWeight: 10,
    boardControlWeight: 10,
    letterManagementWeight: 20,
    randomnessFactor: 30,
    bluffMoves: false,
    usePowerUps: false,
    powerUpAggression: 0,
  },
  medium: {
    difficulty: 'medium',
    minWordLength: 3,
    maxWordLength: 5,
    vocabularyTier: 2,
    pointsWeight: 50,
    blockingWeight: 30,
    boardControlWeight: 30,
    letterManagementWeight: 40,
    randomnessFactor: 15,
    bluffMoves: false,
    usePowerUps: false,
    powerUpAggression: 0,
  },
  hard: {
    difficulty: 'hard',
    minWordLength: 4,
    maxWordLength: 6,
    vocabularyTier: 3,
    pointsWeight: 70,
    blockingWeight: 60,
    boardControlWeight: 50,
    letterManagementWeight: 60,
    randomnessFactor: 10,
    bluffMoves: true,
    usePowerUps: true,
    powerUpAggression: 30,
  },
  very_hard: {
    difficulty: 'very_hard',
    minWordLength: 4,
    maxWordLength: 7,
    vocabularyTier: 4,
    pointsWeight: 85,
    blockingWeight: 80,
    boardControlWeight: 70,
    letterManagementWeight: 80,
    randomnessFactor: 5,
    bluffMoves: true,
    usePowerUps: true,
    powerUpAggression: 50,
  },
  nightmare: {
    difficulty: 'nightmare',
    minWordLength: 4,
    maxWordLength: 8,
    vocabularyTier: 5,
    pointsWeight: 100,
    blockingWeight: 100,
    boardControlWeight: 90,
    letterManagementWeight: 95,
    randomnessFactor: 5,
    bluffMoves: true,
    usePowerUps: true,
    powerUpAggression: 70,
  },
};

interface PossibleMove {
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  score: number;
  lettersNeeded: Letter[];
}

export function calculateAIMove(
  board: Board,
  aiHand: Letter[],
  playerHand: Letter[],
  config: AIConfig,
  turn: number
): Move | null {
  // Get all possible words from AI's hand
  const possibleMoves = generatePossibleMoves(board, aiHand, config);
  
  if (possibleMoves.length === 0) {
    return null; // No valid moves
  }
  
  // Score each move
  const scoredMoves = possibleMoves.map(move => ({
    move,
    score: calculateMoveScore(move, board, aiHand, playerHand, config, turn),
  }));
  
  // Apply randomness
  const adjustedMoves = applyRandomness(scoredMoves, config);
  
  // Sort by score (descending)
  adjustedMoves.sort((a, b) => b.score - a.score);
  
  // Select best move
  const bestMove = adjustedMoves[0]?.move;
  if (!bestMove) {
    return null;
  }
  
  return {
    positions: bestMove.positions,
    word: bestMove.word,
    direction: bestMove.direction,
    score: bestMove.score,
    playerId: 'ai-1',
  };
}

function generatePossibleMoves(
  board: Board,
  hand: Letter[],
  config: AIConfig
): PossibleMove[] {
  const moves: PossibleMove[] = [];
  const handLetters = hand.map(l => l.char).join('').toLowerCase();
  
  // Generate all possible word combinations from hand
  const words = generateWordsFromLetters(handLetters, config.minWordLength, config.maxWordLength);
  
  // For first move, word must pass through center
  if (isFirstMove(board)) {
    const centerRow = Math.floor(board.size / 2);
    const centerCol = Math.floor(board.size / 2);
    
    for (const word of words) {
      // Try horizontal placement through center
      if (word.length <= board.size) {
        const startCol = Math.max(0, centerCol - word.length + 1);
        const endCol = Math.min(board.size - word.length, centerCol);
        
        for (let col = startCol; col <= endCol; col++) {
          if (col <= centerCol && centerCol < col + word.length) {
            const positions: Position[] = [];
            const lettersNeeded: Letter[] = [];
            
            for (let i = 0; i < word.length; i++) {
              positions.push({ row: centerRow, col: col + i });
              const char = word[i].toUpperCase();
              const existingLetter = hand.find(l => l.char === char);
              if (existingLetter) {
                lettersNeeded.push(existingLetter);
              }
            }
            
            if (canPlaceWord(board, positions, word, hand)) {
              moves.push({
                word: word.toUpperCase(),
                positions,
                direction: 'horizontal',
                score: 0, // Will be calculated
                lettersNeeded,
              });
            }
          }
        }
      }
      
      // Try vertical placement through center
      if (word.length <= board.size) {
        const startRow = Math.max(0, centerRow - word.length + 1);
        const endRow = Math.min(board.size - word.length, centerRow);
        
        for (let row = startRow; row <= endRow; row++) {
          if (row <= centerRow && centerRow < row + word.length) {
            const positions: Position[] = [];
            const lettersNeeded: Letter[] = [];
            
            for (let i = 0; i < word.length; i++) {
              positions.push({ row: row + i, col: centerCol });
              const char = word[i].toUpperCase();
              const existingLetter = hand.find(l => l.char === char);
              if (existingLetter) {
                lettersNeeded.push(existingLetter);
              }
            }
            
            if (canPlaceWord(board, positions, word, hand)) {
              moves.push({
                word: word.toUpperCase(),
                positions,
                direction: 'vertical',
                score: 0, // Will be calculated
                lettersNeeded,
              });
            }
          }
        }
      }
    }
  } else {
    // Subsequent moves must connect to existing letters
    // First, try words generated from hand letters
    for (const word of words) {
      // Find all positions where word can be placed
      const placements = findWordPlacements(board, word, hand);
      for (const placement of placements) {
        moves.push({
          word: word.toUpperCase(),
          positions: placement.positions,
          direction: placement.direction,
          score: 0,
          lettersNeeded: placement.lettersNeeded,
        });
      }
    }
    
    // Also generate words that use board letters as starting points
    const boardLetterMoves = generateWordsFromBoardLetters(board, hand, config);
    moves.push(...boardLetterMoves);
  }
  
  // Calculate scores
  return moves.map(move => ({
    ...move,
    score: calculateMoveScore(move, board, hand, [], config, 1),
  }));
}

function generateWordsFromLetters(letters: string, minLength: number, maxLength: number): string[] {
  const words: string[] = [];
  const letterCounts: Record<string, number> = {};
  
  // Count letters
  for (const char of letters) {
    letterCounts[char] = (letterCounts[char] || 0) + 1;
  }
  
  // Simple recursive word generation
  function generate(current: string, remaining: Record<string, number>) {
    if (current.length >= minLength && current.length <= maxLength && isValidWord(current)) {
      words.push(current);
    }
    
    if (current.length >= maxLength) {
      return;
    }
    
    for (const [char, count] of Object.entries(remaining)) {
      if (count > 0) {
        const newRemaining = { ...remaining };
        newRemaining[char] = count - 1;
        generate(current + char, newRemaining);
      }
    }
  }
  
  generate('', letterCounts);
  
  // Remove duplicates
  return [...new Set(words)];
}

function canPlaceWord(
  board: Board,
  positions: Position[],
  word: string,
  hand: Letter[]
): boolean {
  if (positions.length !== word.length) {
    return false;
  }
  
  // Check all positions are valid and cells are empty or match
  const requiredLetters: Record<string, number> = {};
  const availableLetters: Record<string, number> = {};
  
  // Count available letters
  for (const letter of hand) {
    availableLetters[letter.char] = (availableLetters[letter.char] || 0) + 1;
  }
  
  for (let i = 0; i < word.length; i++) {
    const pos = positions[i];
    if (!isValidPosition(pos)) {
      return false;
    }
    
    const cell = board.cells[pos.row][pos.col];
    const char = word[i].toUpperCase();
    
    if (cell.letter) {
      // Cell already has a letter - must match
      if (cell.letter.char !== char) {
        return false;
      }
    } else {
      // Need letter from hand
      requiredLetters[char] = (requiredLetters[char] || 0) + 1;
    }
  }
  
  // Check if we have required letters
  for (const [char, count] of Object.entries(requiredLetters)) {
    if ((availableLetters[char] || 0) < count) {
      return false;
    }
  }
  
  // Validate word placement
  const move: Move = {
    positions,
    word: word.toUpperCase(),
    direction: positions[0].row === positions[positions.length - 1].row ? 'horizontal' : 'vertical',
    score: 0,
    playerId: 'ai',
  };
  
  const validation = validateMove(board, move, hand, isValidWord);
  return validation.valid;
}

function findWordPlacements(
  board: Board,
  word: string,
  hand: Letter[]
): Array<{ positions: Position[]; direction: 'horizontal' | 'vertical'; lettersNeeded: Letter[] }> {
  const placements: Array<{ positions: Position[]; direction: 'horizontal' | 'vertical'; lettersNeeded: Letter[] }> = [];
  
  // Try horizontal placements - can use board letters
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col <= board.size - word.length; col++) {
      const positions: Position[] = [];
      let canBuild = true;
      const usedHand: Letter[] = [];
      const handAvailable: Record<string, number> = {};
      
      // Count available hand letters
      for (const letter of hand) {
        const char = letter.char.toUpperCase();
        handAvailable[char] = (handAvailable[char] || 0) + 1;
      }
      
      // Build word checking each position
      for (let i = 0; i < word.length && canBuild; i++) {
        const pos = { row, col: col + i };
        positions.push(pos);
        const cell = board.cells[pos.row][pos.col];
        const requiredChar = word[i].toUpperCase();
        
        if (cell.letter) {
          // Use board letter if it matches
          if (cell.letter.char !== requiredChar) {
            canBuild = false;
            break;
          }
          // Letter matches - use it from board
        } else {
          // Need letter from hand
          if (!handAvailable[requiredChar] || handAvailable[requiredChar] === 0) {
            canBuild = false;
            break;
          }
          // Use letter from hand
          const letter = hand.find(l => l.char === requiredChar && !usedHand.includes(l));
          if (letter) {
            usedHand.push(letter);
            handAvailable[requiredChar]--;
          } else {
            canBuild = false;
            break;
          }
        }
      }
      
      if (canBuild && canPlaceWord(board, positions, word, hand)) {
        // Check if placement connects to existing letters (for non-first moves)
        if (isFirstMove(board) || positions.some(pos => {
          const cell = board.cells[pos.row][pos.col];
          return cell.letter !== null || hasAdjacentLetter(board, pos);
        })) {
          placements.push({ 
            positions, 
            direction: 'horizontal', 
            lettersNeeded: usedHand 
          });
        }
      }
    }
  }
  
  // Try vertical placements - can use board letters
  for (let row = 0; row <= board.size - word.length; row++) {
    for (let col = 0; col < board.size; col++) {
      const positions: Position[] = [];
      let canBuild = true;
      const usedHand: Letter[] = [];
      const handAvailable: Record<string, number> = {};
      
      // Count available hand letters
      for (const letter of hand) {
        const char = letter.char.toUpperCase();
        handAvailable[char] = (handAvailable[char] || 0) + 1;
      }
      
      // Build word checking each position
      for (let i = 0; i < word.length && canBuild; i++) {
        const pos = { row: row + i, col };
        positions.push(pos);
        const cell = board.cells[pos.row][pos.col];
        const requiredChar = word[i].toUpperCase();
        
        if (cell.letter) {
          // Use board letter if it matches
          if (cell.letter.char !== requiredChar) {
            canBuild = false;
            break;
          }
          // Letter matches - use it from board
        } else {
          // Need letter from hand
          if (!handAvailable[requiredChar] || handAvailable[requiredChar] === 0) {
            canBuild = false;
            break;
          }
          // Use letter from hand
          const letter = hand.find(l => l.char === requiredChar && !usedHand.includes(l));
          if (letter) {
            usedHand.push(letter);
            handAvailable[requiredChar]--;
          } else {
            canBuild = false;
            break;
          }
        }
      }
      
      if (canBuild && canPlaceWord(board, positions, word, hand)) {
        // Check if placement connects to existing letters (for non-first moves)
        if (isFirstMove(board) || positions.some(pos => {
          const cell = board.cells[pos.row][pos.col];
          return cell.letter !== null || hasAdjacentLetter(board, pos);
        })) {
          placements.push({ 
            positions, 
            direction: 'vertical', 
            lettersNeeded: usedHand 
          });
        }
      }
    }
  }
  
  return placements;
}

function calculateMoveScore(
  move: PossibleMove,
  board: Board,
  aiHand: Letter[],
  playerHand: Letter[],
  config: AIConfig,
  turn: number
): number {
  let score = 0;
  
  // Test move on board
  const testBoard = JSON.parse(JSON.stringify(board)) as Board;
  const testMove: Move = {
    positions: move.positions,
    word: move.word,
    direction: move.direction,
    score: move.score,
    playerId: 'ai',
  };
  
  // Calculate base score
  const allWords = getAllWordsFromMove(testBoard, testMove);
  let totalScore = 0;
  for (const { word, positions } of allWords) {
    totalScore += calculateWordScore(word, positions, testBoard);
  }
  
  // Points weight
  score += (totalScore / 100) * config.pointsWeight;
  
  // Blocking weight (higher if move blocks player opportunities)
  const blockingScore = calculateBlockingScore(move, board, config);
  score += blockingScore * config.blockingWeight;
  
  // Board control (center and edges)
  const controlScore = calculateControlScore(move, board, config);
  score += controlScore * config.boardControlWeight;
  
  // Letter management (save high-value letters)
  const letterScore = calculateLetterManagementScore(move, aiHand, config);
  score += letterScore * config.letterManagementWeight;
  
  return score;
}

function calculateBlockingScore(move: PossibleMove, board: Board, config: AIConfig): number {
  // Simple heuristic: more blocking opportunities = higher score
  // TODO: Implement actual blocking detection
  return 0.1;
}

function calculateControlScore(move: PossibleMove, board: Board, config: AIConfig): number {
  const centerRow = Math.floor(board.size / 2);
  const centerCol = Math.floor(board.size / 2);
  
  let score = 0;
  
  // Bonus for placing near center
  for (const pos of move.positions) {
    const distFromCenter = Math.abs(pos.row - centerRow) + Math.abs(pos.col - centerCol);
    score += (1 / (distFromCenter + 1)) * 0.5;
  }
  
  return score;
}

function calculateLetterManagementScore(move: PossibleMove, hand: Letter[], config: AIConfig): number {
  // Prefer using low-value letters
  let score = 0;
  for (const letter of move.lettersNeeded) {
    // Lower letter value = higher score (save high-value letters)
    const letterValue = letter.points;
    score += (10 - letterValue) / 10;
  }
  return score / Math.max(move.lettersNeeded.length, 1);
}

/**
 * Generate words that extend from or use existing board letters
 * This allows building words like "TEA" from an existing "T" on the board
 */
function generateWordsFromBoardLetters(
  board: Board,
  hand: Letter[],
  config: AIConfig
): PossibleMove[] {
  const moves: PossibleMove[] = [];
  
  // Find all letters on the board
  const boardLetters: Array<{ pos: Position; letter: Letter }> = [];
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      const cell = board.cells[row][col];
      if (cell.letter) {
        boardLetters.push({
          pos: { row, col },
          letter: cell.letter,
        });
      }
    }
  }
  
  // For each board letter, try to build words that include it
  for (const boardLetter of boardLetters) {
    const handLetters = hand.map(l => l.char).join('').toLowerCase();
    
    // Generate words that start with the board letter + hand letters
    const possibleWords = generateWordsIncludingLetter(
      boardLetter.letter.char.toLowerCase(),
      handLetters,
      config.minWordLength,
      config.maxWordLength
    );
    
    // Try to place these words extending from the board letter
    for (const word of possibleWords) {
      // Try horizontal placements
      const horizontalPlacements = findPlacementsExtendingFrom(
        board,
        hand,
        word,
        boardLetter.pos,
        'horizontal'
      );
      moves.push(...horizontalPlacements);
      
      // Try vertical placements
      const verticalPlacements = findPlacementsExtendingFrom(
        board,
        hand,
        word,
        boardLetter.pos,
        'vertical'
      );
      moves.push(...verticalPlacements);
    }
  }
  
  return moves;
}

/**
 * Generate words that include a specific letter (from board) plus hand letters
 */
function generateWordsIncludingLetter(
  requiredLetter: string,
  handLetters: string,
  minLength: number,
  maxLength: number
): string[] {
  const words: string[] = [];
  const allLetters = requiredLetter + handLetters;
  const letterCounts: Record<string, number> = {};
  
  // Count all letters (board + hand)
  for (const char of allLetters) {
    letterCounts[char] = (letterCounts[char] || 0) + 1;
  }
  
  // Ensure required letter is used at least once
  function generate(current: string, remaining: Record<string, number>, usedRequired: boolean) {
    // Must use required letter at least once
    if (current.length >= minLength && current.length <= maxLength && usedRequired && isValidWord(current)) {
      words.push(current);
    }
    
    if (current.length >= maxLength) {
      return;
    }
    
    for (const [char, count] of Object.entries(remaining)) {
      if (count > 0) {
        const newRemaining = { ...remaining };
        newRemaining[char] = count - 1;
        const newUsedRequired = usedRequired || char === requiredLetter;
        generate(current + char, newRemaining, newUsedRequired);
      }
    }
  }
  
  generate('', letterCounts, false);
  return [...new Set(words)];
}

/**
 * Find placements for a word that extends from a specific board position
 */
function findPlacementsExtendingFrom(
  board: Board,
  hand: Letter[],
  word: string,
  startPos: Position,
  direction: 'horizontal' | 'vertical'
): PossibleMove[] {
  const moves: PossibleMove[] = [];
  
  // Try different starting positions relative to the board letter
  const boardChar = board.cells[startPos.row][startPos.col].letter?.char.toLowerCase();
  if (!boardChar) return moves;
  
  // Find where the board letter appears in the word
  const boardCharIndex = word.indexOf(boardChar);
  if (boardCharIndex === -1) return moves;
  
  // Try placing word so board letter is at word[boardCharIndex]
  let baseRow: number;
  let baseCol: number;
  
  if (direction === 'horizontal') {
    baseRow = startPos.row;
    baseCol = startPos.col - boardCharIndex;
  } else {
    baseRow = startPos.row - boardCharIndex;
    baseCol = startPos.col;
  }
  
  // Check if word fits at this position
  const positions: Position[] = [];
  let canBuild = true;
  const usedHand: Letter[] = [];
  const handAvailable: Record<string, number> = {};
  
  // Count hand letters
  for (const letter of hand) {
    const char = letter.char.toLowerCase();
    handAvailable[char] = (handAvailable[char] || 0) + 1;
  }
  
  // Build word checking each position
  for (let i = 0; i < word.length && canBuild; i++) {
    let pos: Position;
    if (direction === 'horizontal') {
      pos = { row: baseRow, col: baseCol + i };
    } else {
      pos = { row: baseRow + i, col: baseCol };
    }
    
    // Check bounds
    if (pos.row < 0 || pos.row >= board.size || pos.col < 0 || pos.col >= board.size) {
      canBuild = false;
      break;
    }
    
    positions.push(pos);
    const cell = board.cells[pos.row][pos.col];
    const requiredChar = word[i].toUpperCase();
    
    if (cell.letter) {
      // Must match board letter
      if (cell.letter.char.toUpperCase() !== requiredChar) {
        canBuild = false;
        break;
      }
      // Letter matches - use from board
    } else {
      // Need from hand
      const char = requiredChar.toLowerCase();
      if (!handAvailable[char] || handAvailable[char] === 0) {
        canBuild = false;
        break;
      }
      const letter = hand.find(l => l.char.toLowerCase() === char && !usedHand.includes(l));
      if (letter) {
        usedHand.push(letter);
        handAvailable[char]--;
      } else {
        canBuild = false;
        break;
      }
    }
  }
  
  if (canBuild && canPlaceWord(board, positions, word, hand)) {
    // Check connection requirement
    if (positions.some(pos => {
      const cell = board.cells[pos.row][pos.col];
      return cell.letter !== null || hasAdjacentLetter(board, pos);
    })) {
      moves.push({
        word: word.toUpperCase(),
        positions,
        direction,
        score: 0,
        lettersNeeded: usedHand,
      });
    }
  }
  
  return moves;
}

function applyRandomness(
  scoredMoves: Array<{ move: PossibleMove; score: number }>,
  config: AIConfig
): Array<{ move: PossibleMove; score: number }> {
  if (config.randomnessFactor === 0) {
    return scoredMoves;
  }
  
  // Add random variance to scores
  return scoredMoves.map(({ move, score }) => {
    const variance = (Math.random() - 0.5) * 2 * config.randomnessFactor;
    return {
      move,
      score: score * (1 + variance / 100),
    };
  });
}


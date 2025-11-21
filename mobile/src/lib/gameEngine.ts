// Core Game Engine Logic

import { Board, Cell, Position, Letter, Move, Player, GameState } from '../types';

const BOARD_SIZE = 8;
const CENTER_ROW = Math.floor(BOARD_SIZE / 2);
const CENTER_COL = Math.floor(BOARD_SIZE / 2);

// Letter distribution based on English frequency
export const LETTER_CONFIG: Record<string, { count: number; points: number }> = {
  A: { count: 9, points: 1 },   B: { count: 2, points: 3 },
  C: { count: 2, points: 3 },   D: { count: 4, points: 2 },
  E: { count: 12, points: 1 },  F: { count: 2, points: 4 },
  G: { count: 3, points: 2 },   H: { count: 2, points: 4 },
  I: { count: 9, points: 1 },   J: { count: 1, points: 8 },
  K: { count: 1, points: 5 },   L: { count: 4, points: 1 },
  M: { count: 2, points: 3 },   N: { count: 6, points: 1 },
  O: { count: 8, points: 1 },   P: { count: 2, points: 3 },
  Q: { count: 1, points: 10 },  R: { count: 6, points: 1 },
  S: { count: 4, points: 1 },   T: { count: 6, points: 1 },
  U: { count: 4, points: 1 },   V: { count: 2, points: 4 },
  W: { count: 2, points: 4 },   X: { count: 1, points: 8 },
  Y: { count: 2, points: 4 },   Z: { count: 1, points: 10 },
};

export function createEmptyBoard(): Board {
  const cells: Cell[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    cells[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      cells[row][col] = {
        letter: null,
        isCenter: row === CENTER_ROW && col === CENTER_COL,
        isNewlyPlaced: false,
      };
    }
  }
  return { cells, size: BOARD_SIZE };
}

export function createLetterDistribution(): Letter[] {
  const distribution: Letter[] = [];
  for (const [char, config] of Object.entries(LETTER_CONFIG)) {
    for (let i = 0; i < config.count; i++) {
      distribution.push({
        char,
        points: config.points,
      });
    }
  }
  return distribution;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawLetters(count: number, distribution: Letter[]): Letter[] {
  const drawn: Letter[] = [];
  const shuffled = shuffleArray(distribution);
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    drawn.push(shuffled[i]);
  }
  
  return drawn;
}

export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

export function getAdjacentPositions(pos: Position): Position[] {
  const adjacent: Position[] = [];
  const directions = [
    { row: -1, col: 0 },  // up
    { row: 1, col: 0 },   // down
    { row: 0, col: -1 },  // left
    { row: 0, col: 1 },   // right
  ];
  
  for (const dir of directions) {
    const newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
    if (isValidPosition(newPos)) {
      adjacent.push(newPos);
    }
  }
  
  return adjacent;
}

export function hasAdjacentLetter(board: Board, pos: Position): boolean {
  return getAdjacentPositions(pos).some(adj => 
    board.cells[adj.row][adj.col].letter !== null
  );
}

export function isFirstMove(board: Board): boolean {
  // Check if board is empty except center
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board.cells[row][col];
      if (cell.letter !== null && !cell.isCenter) {
        return false;
      }
    }
  }
  return true;
}

export function passesThroughCenter(positions: Position[]): boolean {
  return positions.some(pos => pos.row === CENTER_ROW && pos.col === CENTER_COL);
}

export function extractWordFromBoard(
  board: Board,
  startPos: Position,
  direction: 'horizontal' | 'vertical'
): string {
  const word: string[] = [];
  const { row, col } = startPos;
  
  // Find start of word (go backwards until no letter)
  let startRow = row;
  let startCol = col;
  
  if (direction === 'horizontal') {
    while (startCol > 0 && board.cells[startRow][startCol - 1].letter !== null) {
      startCol--;
    }
    // Collect letters going right
    while (startCol < BOARD_SIZE && board.cells[startRow][startCol].letter !== null) {
      word.push(board.cells[startRow][startCol].letter!.char);
      startCol++;
    }
  } else {
    while (startRow > 0 && board.cells[startRow - 1][startCol].letter !== null) {
      startRow--;
    }
    // Collect letters going down
    while (startRow < BOARD_SIZE && board.cells[startRow][startCol].letter !== null) {
      word.push(board.cells[startRow][startCol].letter!.char);
      startRow++;
    }
  }
  
  return word.join('');
}

export function getAllWordsFromMove(
  board: Board,
  move: Move
): { word: string; positions: Position[] }[] {
  const words: { word: string; positions: Position[] }[] = [];
  
  // Main word
  const mainWord = move.word;
  words.push({
    word: mainWord,
    positions: [...move.positions],
  });
  
  // Cross words (perpendicular to main word)
  for (const pos of move.positions) {
    const crossDirection = move.direction === 'horizontal' ? 'vertical' : 'horizontal';
    const crossWord = extractWordFromBoard(board, pos, crossDirection);
    
    // Only add if it's longer than single letter and not already the main word
    if (crossWord.length > 1 && crossWord !== mainWord) {
      // Find all positions for cross word
      const crossPositions: Position[] = [];
      const { row, col } = pos;
      
      if (crossDirection === 'horizontal') {
        let startCol = col;
        while (startCol > 0 && board.cells[row][startCol - 1].letter !== null) {
          startCol--;
        }
        while (startCol < BOARD_SIZE && board.cells[row][startCol].letter !== null) {
          crossPositions.push({ row, col: startCol });
          startCol++;
        }
      } else {
        let startRow = row;
        while (startRow > 0 && board.cells[startRow - 1][col].letter !== null) {
          startRow--;
        }
        while (startRow < BOARD_SIZE && board.cells[startRow][col].letter !== null) {
          crossPositions.push({ row: startRow, col });
          startRow++;
        }
      }
      
      words.push({
        word: crossWord,
        positions: crossPositions,
      });
    }
  }
  
  return words;
}

export function calculateWordScore(word: string, positions: Position[], board: Board): number {
  let score = 0;
  for (let i = 0; i < word.length; i++) {
    const pos = positions[i];
    const cell = board.cells[pos.row][pos.col];
    if (cell.letter) {
      score += cell.letter.points;
    }
  }
  return score;
}

/**
 * Validates that positions form a continuous line in one direction (horizontal or vertical)
 * Returns the detected direction or null if invalid
 */
function validatePositionSequence(positions: Position[]): { 
  valid: boolean; 
  direction: 'horizontal' | 'vertical' | null;
  error?: string;
} {
  if (positions.length === 0) {
    return { valid: false, direction: null, error: 'No positions provided' };
  }
  
  if (positions.length === 1) {
    // Single position is valid, but we can't determine direction
    return { valid: true, direction: null };
  }
  
  // Check if all positions are in a straight line
  const firstPos = positions[0];
  const secondPos = positions[1];
  
  // Determine direction from first two positions
  const isHorizontal = firstPos.row === secondPos.row;
  const isVertical = firstPos.col === secondPos.col;
  
  if (!isHorizontal && !isVertical) {
    return { 
      valid: false, 
      direction: null, 
      error: 'Positions must form a straight line (horizontal or vertical)' 
    };
  }
  
  const direction: 'horizontal' | 'vertical' = isHorizontal ? 'horizontal' : 'vertical';
  
  // Sort positions based on direction to ensure they're in order
  const sortedPositions = [...positions].sort((a, b) => {
    if (direction === 'horizontal') {
      return a.col - b.col; // Sort by column
    } else {
      return a.row - b.row; // Sort by row
    }
  });
  
  // Verify all positions are in the same row/column
  const referenceRow = sortedPositions[0].row;
  const referenceCol = sortedPositions[0].col;
  
  for (const pos of sortedPositions) {
    if (direction === 'horizontal' && pos.row !== referenceRow) {
      return { 
        valid: false, 
        direction: null, 
        error: 'All positions must be in the same row for horizontal words' 
      };
    }
    if (direction === 'vertical' && pos.col !== referenceCol) {
      return { 
        valid: false, 
        direction: null, 
        error: 'All positions must be in the same column for vertical words' 
      };
    }
  }
  
  // Verify positions are consecutive (no gaps)
  for (let i = 1; i < sortedPositions.length; i++) {
    const prev = sortedPositions[i - 1];
    const curr = sortedPositions[i];
    
    if (direction === 'horizontal') {
      if (curr.col !== prev.col + 1) {
        return { 
          valid: false, 
          direction: null, 
          error: 'Positions must be consecutive with no gaps' 
        };
      }
    } else {
      if (curr.row !== prev.row + 1) {
        return { 
          valid: false, 
          direction: null, 
          error: 'Positions must be consecutive with no gaps' 
        };
      }
    }
  }
  
  return { valid: true, direction };
}

export function validateMove(
  board: Board,
  move: Move,
  playerHand: Letter[],
  isValidWord: (word: string) => boolean
): { valid: boolean; error?: string } {
  // Validate positions form a continuous line in one direction
  const sequenceValidation = validatePositionSequence(move.positions);
  if (!sequenceValidation.valid) {
    return { valid: false, error: sequenceValidation.error || 'Invalid position sequence' };
  }
  
  // Update move direction if detected from positions
  if (sequenceValidation.direction && !move.direction) {
    move.direction = sequenceValidation.direction;
  }
  
  // Verify declared direction matches actual positions
  if (move.direction && sequenceValidation.direction && 
      move.direction !== sequenceValidation.direction) {
    return { 
      valid: false, 
      error: `Declared direction (${move.direction}) does not match actual positions (${sequenceValidation.direction})` 
    };
  }
  
  // Check if first move passes through center
  if (isFirstMove(board)) {
    if (!passesThroughCenter(move.positions)) {
      return { valid: false, error: 'First word must pass through the center' };
    }
  } else {
    // Must connect to existing letters
    const hasConnection = move.positions.some(pos => 
      hasAdjacentLetter(board, pos) || board.cells[pos.row][pos.col].letter !== null
    );
    
    if (!hasConnection) {
      return { valid: false, error: 'Word must connect to existing letters' };
    }
  }
  
  // Check all positions are valid
  for (const pos of move.positions) {
    if (!isValidPosition(pos)) {
      return { valid: false, error: 'Invalid position' };
    }
  }
  
  // Check word length matches positions
  if (move.word.length !== move.positions.length) {
    return { valid: false, error: 'Word length does not match positions' };
  }
  
  // Check player has required letters (accounting for letters on board)
  const requiredLetters: Record<string, number> = {};
  const availableLetters: Record<string, number> = {};
  
  // Count letters in player hand
  for (const letter of playerHand) {
    availableLetters[letter.char] = (availableLetters[letter.char] || 0) + 1;
  }
  
  // Count letters needed
  for (let i = 0; i < move.word.length; i++) {
    const char = move.word[i].toUpperCase();
    const pos = move.positions[i];
    const cell = board.cells[pos.row][pos.col];
    
    // If cell already has this letter, we don't need it from hand
    if (cell.letter && cell.letter.char === char) {
      continue;
    }
    
    requiredLetters[char] = (requiredLetters[char] || 0) + 1;
  }
  
  // Check if player has required letters
  for (const [char, count] of Object.entries(requiredLetters)) {
    if ((availableLetters[char] || 0) < count) {
      return { valid: false, error: `Not enough letters: ${char}` };
    }
  }
  
  // Validate all words formed are valid
  const testBoard = JSON.parse(JSON.stringify(board)) as Board;
  
  // Place letters temporarily
  for (let i = 0; i < move.word.length; i++) {
    const char = move.word[i].toUpperCase();
    const pos = move.positions[i];
    const cell = testBoard.cells[pos.row][pos.col];
    
    if (!cell.letter) {
      const letter: Letter = {
        char,
        points: LETTER_CONFIG[char]?.points || 0,
      };
      cell.letter = letter;
    }
  }
  
  // Check all words formed
  const allWords = getAllWordsFromMove(testBoard, move);
  for (const { word } of allWords) {
    if (word.length > 1 && !isValidWord(word.toLowerCase())) {
      return { valid: false, error: `Invalid word: ${word}` };
    }
  }
  
  return { valid: true };
}

export function applyMove(board: Board, move: Move, playerHand: Letter[]): {
  newBoard: Board;
  newHand: Letter[];
  score: number;
} {
  const newBoard = JSON.parse(JSON.stringify(board)) as Board;
  const newHand = [...playerHand];
  let score = 0;
  
  // Place letters and remove from hand
  for (let i = 0; i < move.word.length; i++) {
    const char = move.word[i].toUpperCase();
    const pos = move.positions[i];
    const cell = newBoard.cells[pos.row][pos.col];
    
    if (!cell.letter) {
      // Find and remove letter from hand
      const letterIndex = newHand.findIndex(l => l.char === char);
      if (letterIndex >= 0) {
        const letter = newHand[letterIndex];
        cell.letter = letter;
        cell.isNewlyPlaced = true;
        score += letter.points;
        newHand.splice(letterIndex, 1);
      }
    } else {
      // Letter already on board, still count score
      score += cell.letter.points;
    }
  }
  
  // Calculate total score for all words formed
  const allWords = getAllWordsFromMove(newBoard, move);
  let totalScore = 0;
  for (const { word, positions } of allWords) {
    totalScore += calculateWordScore(word, positions, newBoard);
  }
  
  // Clear newly placed flags after processing
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (newBoard.cells[row][col].isNewlyPlaced) {
        newBoard.cells[row][col].isNewlyPlaced = false;
      }
    }
  }
  
  return {
    newBoard,
    newHand,
    score: totalScore,
  };
}

export function checkWinCondition(game: GameState): {
  finished: boolean;
  winnerId?: string;
  reason?: string;
} {
  const players = game.players;
  
  // Check if any player has no letters left
  for (const player of players) {
    if (player.hand.length === 0) {
      return {
        finished: true,
        winnerId: player.id,
        reason: 'letter_depletion',
      };
    }
  }
  
  // Check for deadlock (no valid moves possible)
  // TODO: Implement actual deadlock detection
  // For now, we'll use a simple check
  
  return { finished: false };
}


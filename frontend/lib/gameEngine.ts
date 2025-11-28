// Core Game Engine Logic

import { Board, Cell, Position, Letter, Move, Player, GameState } from '@/types';
import { ensureWordIsValid } from './dictionary';

const BOARD_SIZE = 8;

export function getBoardDimensions(width?: number, height?: number): { width: number; height: number } {
  return {
    width: width || BOARD_SIZE,
    height: height || BOARD_SIZE,
  };
}

export function getBoardWidth(board: Board): number {
  return board.width ?? board.size ?? BOARD_SIZE;
}

export function getBoardHeight(board: Board): number {
  return board.height ?? board.size ?? BOARD_SIZE;
}

export function getBoardCenter(board: Board): Position {
  return {
    row: Math.floor(getBoardHeight(board) / 2),
    col: Math.floor(getBoardWidth(board) / 2),
  };
}

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

export function createEmptyBoard(width?: number, height?: number): Board {
  const dims = getBoardDimensions(width, height);
  const centerRow = Math.floor(dims.height / 2);
  const centerCol = Math.floor(dims.width / 2);
  
  const cells: Cell[][] = [];
  for (let row = 0; row < dims.height; row++) {
    cells[row] = [];
    for (let col = 0; col < dims.width; col++) {
      cells[row][col] = {
        letter: null,
        isCenter: row === centerRow && col === centerCol,
        isNewlyPlaced: false,
      };
    }
  }
  return { 
    cells, 
    size: Math.max(dims.width, dims.height), // For backward compatibility
    width: dims.width,
    height: dims.height,
  };
}

/**
 * Places a starting word horizontally on the board passing through center
 * Used for Level 3 (RACING) and Level 6 (EMISSION)
 */
export function placeStartingWord(board: Board, word: string): Board {
  const newBoard = JSON.parse(JSON.stringify(board)) as Board;
  const boardWidth = board.width || board.size;
  const boardHeight = board.height || board.size;
  const centerRow = Math.floor(boardHeight / 2);
  const centerCol = Math.floor(boardWidth / 2);
  
  // Place word horizontally, ensuring it passes through the center
  // Find the center letter index (middle of the word)
  const centerLetterIndex = Math.floor(word.length / 2);
  const startCol = centerCol - centerLetterIndex;
  
  for (let i = 0; i < word.length; i++) {
    const col = startCol + i;
    if (col >= 0 && col < boardWidth && centerRow >= 0 && centerRow < boardHeight) {
      const char = word[i].toUpperCase();
      const letterConfig = LETTER_CONFIG[char];
      if (letterConfig) {
        newBoard.cells[centerRow][col] = {
          ...newBoard.cells[centerRow][col],
          letter: {
            char: char,
            points: letterConfig.points,
          },
          isNewlyPlaced: false, // Not newly placed, it's already there
        };
      }
    }
  }
  
  return newBoard;
}

/**
 * Marks squares as corrupted (cannot place letters on them)
 * Used for Level 7
 */
export function markCorruptedSquares(board: Board, positions: Position[]): Board {
  const newBoard = JSON.parse(JSON.stringify(board)) as Board;
  const boardWidth = board.width || board.size;
  const boardHeight = board.height || board.size;
  
  for (const pos of positions) {
    if (pos.row >= 0 && pos.row < boardHeight && pos.col >= 0 && pos.col < boardWidth) {
      newBoard.cells[pos.row][pos.col] = {
        ...newBoard.cells[pos.row][pos.col],
        isCorrupted: true,
      };
    }
  }
  
  return newBoard;
}

/**
 * Checks if a given word exists on the board in a straight line
 * Used for Level 7 objective (build "STARS")
 */
export function doesBoardContainWord(board: Board, word: string): boolean {
  if (!word) {
    return false;
  }

  const target = word.toUpperCase();
  const length = target.length;
  const width = board.width || board.size;
  const height = board.height || board.size;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cellChar = board.cells[row][col].letter?.char?.toUpperCase();
      if (cellChar !== target[0]) {
        continue;
      }

      // Check horizontally
      if (col + length <= width) {
        let matches = true;
        for (let i = 0; i < length; i++) {
          const char = board.cells[row][col + i].letter?.char?.toUpperCase();
          if (char !== target[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return true;
        }
      }

      // Check vertically
      if (row + length <= height) {
        let matches = true;
        for (let i = 0; i < length; i++) {
          const char = board.cells[row + i][col].letter?.char?.toUpperCase();
          if (char !== target[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Calculate damage for boss battles based on word length
 * Default 5 damage for words below 5 letters, +1 damage per letter exceeding 5
 */
export function calculateDamage(wordLength: number): number {
  if (wordLength < 5) {
    return 5;
  }
  return 5 + (wordLength - 5);
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

export function isValidPosition(pos: Position, board?: Board): boolean {
  const height = board ? getBoardHeight(board) : BOARD_SIZE;
  const width = board ? getBoardWidth(board) : BOARD_SIZE;
  return pos.row >= 0 && pos.row < height && pos.col >= 0 && pos.col < width;
}

export function getAdjacentPositions(board: Board, pos: Position): Position[] {
  const adjacent: Position[] = [];
  const directions = [
    { row: -1, col: 0 },  // up
    { row: 1, col: 0 },   // down
    { row: 0, col: -1 },  // left
    { row: 0, col: 1 },   // right
  ];
  
  for (const dir of directions) {
    const newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
    if (isValidPosition(newPos, board)) {
      adjacent.push(newPos);
    }
  }
  
  return adjacent;
}

export function hasAdjacentLetter(board: Board, pos: Position): boolean {
  return getAdjacentPositions(board, pos).some(adj => 
    board.cells[adj.row][adj.col].letter !== null
  );
}

export function isFirstMove(board: Board): boolean {
  const height = getBoardHeight(board);
  const width = getBoardWidth(board);
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = board.cells[row]?.[col];
      if (cell?.letter !== null && !cell.isCenter) {
        return false;
      }
    }
  }
  return true;
}

export function passesThroughCenter(board: Board, positions: Position[]): boolean {
  const center = getBoardCenter(board);
  return positions.some(pos => pos.row === center.row && pos.col === center.col);
}

export function extractWordFromBoard(
  board: Board,
  startPos: Position,
  direction: 'horizontal' | 'vertical'
): string {
  const word: string[] = [];
  const { row, col } = startPos;
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);
  
  // Find start of word (go backwards until no letter)
  let startRow = row;
  let startCol = col;
  
  if (direction === 'horizontal') {
    while (startCol > 0 && board.cells[startRow][startCol - 1].letter !== null) {
      startCol--;
    }
    // Collect letters going right
    while (startCol < boardWidth && board.cells[startRow][startCol].letter !== null) {
      word.push(board.cells[startRow][startCol].letter!.char);
      startCol++;
    }
  } else {
    while (startRow > 0 && board.cells[startRow - 1][startCol].letter !== null) {
      startRow--;
    }
    // Collect letters going down
    while (startRow < boardHeight && board.cells[startRow][startCol].letter !== null) {
      word.push(board.cells[startRow][startCol].letter!.char);
      startRow++;
    }
  }
  
  return word.join('');
}

function determineMoveDirection(move: Move): 'horizontal' | 'vertical' {
  if (move.direction) {
    return move.direction;
  }
  if (move.positions.length <= 1) {
    return 'horizontal';
  }
  const [first, second] = move.positions;
  return first.row === second.row ? 'horizontal' : 'vertical';
}

function collectWordPositions(board: Board, anchor: Position, direction: 'horizontal' | 'vertical'): Position[] {
  const positions: Position[] = [];
  let startRow = anchor.row;
  let startCol = anchor.col;
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);
  
  if (direction === 'horizontal') {
    while (startCol > 0 && board.cells[startRow][startCol - 1].letter) {
      startCol--;
    }
    while (startCol < boardWidth && board.cells[startRow][startCol].letter) {
      positions.push({ row: startRow, col: startCol });
      startCol++;
    }
  } else {
    while (startRow > 0 && board.cells[startRow - 1][startCol].letter) {
      startRow--;
    }
    while (startRow < boardHeight && board.cells[startRow][startCol].letter) {
      positions.push({ row: startRow, col: startCol });
      startRow++;
    }
  }
  
  return positions;
}

export function getAllWordsFromMove(
  board: Board,
  move: Move
): { word: string; positions: Position[] }[] {
  const words: { word: string; positions: Position[] }[] = [];
  const direction = determineMoveDirection(move);
  
  // Main word from board
  const anchor = move.positions[0];
  const mainPositions = collectWordPositions(board, anchor, direction);
  const mainWord = mainPositions
    .map(pos => board.cells[pos.row][pos.col].letter?.char || '')
    .join('');
  
  if (mainWord.length > 1) {
    words.push({
      word: mainWord,
      positions: mainPositions,
    });
  }
  
  // Cross words (perpendicular to main word)
  const crossDirection = direction === 'horizontal' ? 'vertical' : 'horizontal';
  for (const pos of move.positions) {
    const crossPositions = collectWordPositions(board, pos, crossDirection);
    if (crossPositions.length <= 1) {
      continue;
    }
    const crossWord = crossPositions
      .map(p => board.cells[p.row][p.col].letter?.char || '')
      .join('');
    
    if (crossWord.length > 1) {
      // Avoid duplicating main word
      if (!(crossWord === mainWord && crossPositions.length === mainPositions.length)) {
        words.push({
          word: crossWord,
          positions: crossPositions,
        });
      }
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

export function projectMoveOntoBoard(board: Board, move: Move): Board {
  const clonedBoard = JSON.parse(JSON.stringify(board)) as Board;

  for (let i = 0; i < move.word.length; i++) {
    const char = move.word[i].toUpperCase();
    const pos = move.positions[i];
    const cell = clonedBoard.cells[pos.row][pos.col];

    if (!cell.letter) {
      const letter: Letter = {
        char,
        points: LETTER_CONFIG[char]?.points || 0,
      };
      cell.letter = letter;
    }
  }

  return clonedBoard;
}

/**
 * Check if parallel words (same direction) are too close without sharing letters
 * Parallel words must have at least one empty square between them OR share a letter
 */
function checkParallelWordSpacing(
  board: Board,
  move: Move
): { valid: boolean; error?: string } {
  const moveDirection = determineMoveDirection(move);
  const newlyPlacedPositions = move.positions.filter(
    pos => !board.cells[pos.row][pos.col].letter
  );
  
  // Get all positions that will have letters after the move
  const allMovePositions = new Set(
    move.positions.map(p => `${p.row},${p.col}`)
  );
  
  // For each newly placed position, check perpendicular adjacent positions
  for (const newPos of newlyPlacedPositions) {
    // For horizontal words, check positions above and below (perpendicular)
    // For vertical words, check positions left and right (perpendicular)
    const perpendicularDirections = moveDirection === 'horizontal'
      ? [{ row: -1, col: 0 }, { row: 1, col: 0 }]  // up, down
      : [{ row: 0, col: -1 }, { row: 0, col: 1 }]; // left, right
    
    for (const dir of perpendicularDirections) {
      const adjPos = { row: newPos.row + dir.row, col: newPos.col + dir.col };
      
      if (!isValidPosition(adjPos, board)) {
        continue;
      }
      
      const adjKey = `${adjPos.row},${adjPos.col}`;
      
      // Skip if this adjacent position is part of our move (sharing a letter is OK)
      if (allMovePositions.has(adjKey)) {
        continue;
      }
      
      const adjCell = board.cells[adjPos.row][adjPos.col];
      if (!adjCell.letter) {
        continue;
      }
      
      // Found an existing letter perpendicularly adjacent to our new position
      // This means we have parallel words that are touching without sharing a letter
      // Check if the adjacent letter is actually part of a parallel word
      // (same direction as our move, but in adjacent row/column)
      const isInParallelWord = moveDirection === 'horizontal'
        ? adjPos.col === newPos.col  // Same column, different row = parallel horizontal words
        : adjPos.row === newPos.row; // Same row, different column = parallel vertical words
      
      if (isInParallelWord) {
        // Check if any move position shares this adjacent position
        // If not, we have parallel words that are too close
        const sharesPosition = move.positions.some(
          mp => mp.row === adjPos.row && mp.col === adjPos.col
        );
        
        if (!sharesPosition) {
          return {
            valid: false,
            error: 'Parallel words must have at least one empty square between them, or share a letter at an intersection'
          };
        }
      }
    }
  }
  
  return { valid: true };
}

export async function ensureMoveWordsAreValid(
  board: Board,
  move: Move
): Promise<{ valid: boolean; error?: string }> {
  // First check parallel word spacing
  const spacingCheck = checkParallelWordSpacing(board, move);
  if (!spacingCheck.valid) {
    return spacingCheck;
  }
  
  const projectedBoard = projectMoveOntoBoard(board, move);
  const allWords = getAllWordsFromMove(projectedBoard, move);

  // Check all words formed (main + crosses) against dictionary
  const wordChecks = await Promise.all(
    allWords.map(async ({ word }) => {
      if (word.length > 1) {
        const isValid = await ensureWordIsValid(word.toLowerCase());
        return { word, isValid };
      }
      return { word, isValid: true };
    })
  );

  const invalidWords = wordChecks.filter(check => !check.isValid && check.word.length > 1);
  if (invalidWords.length > 0) {
    const wordList = invalidWords.map(w => w.word).join(', ');
    return { 
      valid: false, 
      error: `Invalid word(s) found: ${wordList}. All words must be valid dictionary words.` 
    };
  }

  return { valid: true };
}

/**
 * Validates that positions form a continuous line in one direction (horizontal or vertical)
 * If allowGaps is true, allows non-consecutive positions if gaps are filled by existing letters on the board
 * Returns the detected direction or null if invalid
 */
function validatePositionSequence(
  positions: Position[],
  board?: Board,
  allowGaps: boolean = false
): { 
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
  
  // Verify positions are consecutive or gaps are filled by existing letters
  for (let i = 1; i < sortedPositions.length; i++) {
    const prev = sortedPositions[i - 1];
    const curr = sortedPositions[i];
    
    if (direction === 'horizontal') {
      const gap = curr.col - prev.col;
      if (gap > 1) {
        if (!allowGaps || !board) {
          return { 
            valid: false, 
            direction: null, 
            error: 'Positions must be consecutive with no gaps' 
          };
        }
        // Check if all gaps are filled by existing letters
        for (let col = prev.col + 1; col < curr.col; col++) {
          const gapCell = board.cells[referenceRow][col];
          if (!gapCell.letter) {
            return { 
              valid: false, 
              direction: null, 
              error: 'Gaps between positions must be filled by existing letters on the board' 
            };
          }
        }
      } else if (gap < 1) {
        return { 
          valid: false, 
          direction: null, 
          error: 'Positions must be in order' 
        };
      }
    } else {
      const gap = curr.row - prev.row;
      if (gap > 1) {
        if (!allowGaps || !board) {
          return { 
            valid: false, 
            direction: null, 
            error: 'Positions must be consecutive with no gaps' 
          };
        }
        // Check if all gaps are filled by existing letters
        for (let row = prev.row + 1; row < curr.row; row++) {
          const gapCell = board.cells[row][referenceCol];
          if (!gapCell.letter) {
            return { 
              valid: false, 
              direction: null, 
              error: 'Gaps between positions must be filled by existing letters on the board' 
            };
          }
        }
      } else if (gap < 1) {
        return { 
          valid: false, 
          direction: null, 
          error: 'Positions must be in order' 
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
  isValidWord: (word: string) => boolean,
  allowGaps: boolean = false
): { valid: boolean; error?: string } {
  // Check for corrupted squares (Level 7)
  for (const pos of move.positions) {
    const cell = board.cells[pos.row]?.[pos.col];
    if (cell?.isCorrupted) {
      return { valid: false, error: 'Cannot place letters on corrupted squares' };
    }
  }
  
  // Validate positions form a continuous line in one direction
  const sequenceValidation = validatePositionSequence(move.positions, board, allowGaps);
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
    if (!passesThroughCenter(board, move.positions)) {
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
    if (!isValidPosition(pos, board)) {
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
  
  // Check parallel word spacing (must have gap or share letters)
  const spacingCheck = checkParallelWordSpacing(board, move);
  if (!spacingCheck.valid) {
    return spacingCheck;
  }
  
  // Validate all words formed are valid
  const testBoard = projectMoveOntoBoard(board, move);
  
  // Check all words formed (main word + perpendicular crosses)
  const allWords = getAllWordsFromMove(testBoard, move);
  const invalidWords: string[] = [];
  
  for (const { word } of allWords) {
    if (word.length > 1 && !isValidWord(word.toLowerCase())) {
      invalidWords.push(word);
    }
  }
  
  if (invalidWords.length > 0) {
    const wordList = invalidWords.join(', ');
    return { 
      valid: false, 
      error: `Invalid word(s): ${wordList}. All words (main + crosses) must be valid dictionary words.` 
    };
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
  const boardHeight = getBoardHeight(newBoard);
  const boardWidth = getBoardWidth(newBoard);
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
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

export function checkWinCondition(
  game: GameState, 
  level?: { baseObjective: string; targetScore?: number; targetWordCount?: number; turnLimit?: number; targetWord?: string },
  levelId?: number
): {
  finished: boolean;
  winnerId?: string;
  reason?: string;
} {
  const players = game.players;
  const player = players.find(p => !p.isAI);
  const ai = players.find(p => p.isAI);

  // Daily challenge: end as soon as the player reaches the target score
  if (game.mode === 'daily') {
    const targetScore = game.dailyChallenge?.targetScore;
    if (targetScore !== undefined && player && player.score >= targetScore) {
      return {
        finished: true,
        winnerId: player.id,
        reason: 'daily_target_reached',
      };
    }
  }
  
  // Arena mode: Check for rank-specific score win condition
  if (game.mode === 'arena') {
    if (player && ai) {
      // Get score threshold based on arena rank
      // Novice (0) and Apprentice (1): 100 points
      // Adept (2) and Expert (3): 150 points
      // Master (4): 220 points
      let scoreThreshold = 200; // Default fallback
      if (game.arenaRankId !== undefined) {
        if (game.arenaRankId === 0 || game.arenaRankId === 1) {
          scoreThreshold = 100;
        } else if (game.arenaRankId === 2 || game.arenaRankId === 3) {
          scoreThreshold = 150;
        } else if (game.arenaRankId === 4) {
          scoreThreshold = 220;
        }
      }
      
      // Check if any player reached the threshold
      if (player.score >= scoreThreshold) {
        return {
          finished: true,
          winnerId: player.id,
          reason: 'score_limit_reached',
        };
      }
      if (ai.score >= scoreThreshold) {
        return {
          finished: true,
          winnerId: ai.id,
          reason: 'score_limit_reached',
        };
      }
    }
    
    // Check HP-based win conditions for arena boss battles
    if (player && ai && player.hp !== undefined && ai.hp !== undefined) {
      // Check if AI HP reached 0
      if (ai.hp <= 0) {
        return {
          finished: true,
          winnerId: player.id,
          reason: 'boss_defeated',
        };
      }
      // Check if player HP reached 0
      if (player.hp <= 0) {
        return {
          finished: true,
          winnerId: ai.id,
          reason: 'player_defeated',
        };
      }
    }
  }
  
  // Check HP-based win conditions for boss battles (levels 5 and 10)
  if (game.mode === 'journey' && (game.journeyLevelId === 5 || game.journeyLevelId === 10)) {
    const player = players.find(p => !p.isAI);
    const ai = players.find(p => p.isAI);
    
    if (player && ai && player.hp !== undefined && ai.hp !== undefined) {
      // Check if AI HP reached 0
      if (ai.hp <= 0) {
        return {
          finished: true,
          winnerId: player.id,
          reason: 'boss_defeated',
        };
      }
      // Check if player HP reached 0
      if (player.hp <= 0) {
        return {
          finished: true,
          winnerId: ai.id,
          reason: 'player_defeated',
        };
      }
    }
  }
  
  // Journey mode level-specific win conditions
  if (game.mode === 'journey' && level) {
    const player = players.find(p => !p.isAI);
    const ai = players.find(p => p.isAI);
    
    // Level 7: Check if target word "STARS" exists anywhere on the board or in history
    if (levelId === 7 && level.baseObjective === 'build_word' && level.targetWord) {
      const historyHasWord = game.turnHistory.some(move => 
        move.word.toUpperCase() === level.targetWord!.toUpperCase()
      );
      if ((historyHasWord || doesBoardContainWord(game.board, level.targetWord)) && player) {
        return {
          finished: true,
          winnerId: player.id,
          reason: 'target_word_built',
        };
      }
    }
    
    // No-AI levels (6, 7): Only check player
    if ((levelId === 6 || levelId === 7) && !ai) {
      if (!player) {
        return { finished: false };
      }
      
      // Level 6: Score-based win condition at turn limit
      if (levelId === 6 && level.turnLimit && game.turn >= level.turnLimit) {
        // Player always wins if they reached turn limit (score determines stars)
        return {
          finished: true,
          winnerId: player.id,
          reason: 'turn_limit_reached',
        };
      }
      
      // Level 7: Already handled above (target word check)
      // If turn limit reached without building word, player loses
      if (levelId === 7 && level.turnLimit && game.turn >= level.turnLimit) {
        // No winner - player failed to build target word
        return {
          finished: true,
          winnerId: undefined,
          reason: 'turn_limit_reached_no_winner',
        };
      }
      
      return { finished: false };
    }
    
    // Levels with AI (8, 9): Check both player and AI
    if (!player || !ai) {
      return { finished: false };
    }
    
    // Default behavior: Check for early 3-star completion (levels 2, 3, 4)
    // This allows immediate ending before turn 10 if 3-star condition is met
    switch (level.baseObjective) {
      case 'score_threshold':
        // Level 2 & 4: Check for 3-star condition (45 points) - end immediately
        if (level.targetScore) {
          if ((levelId === 2 || levelId === 4) && player.score >= 45) {
            return {
              finished: true,
              winnerId: player.id,
              reason: 'three_star_achieved',
            };
          }
        }
        break;
      
      case 'race_to_score':
        // Level 3: Check for 3-star condition (50 points) - end immediately
        if (level.targetScore && levelId === 3) {
          if (player.score >= 50) {
            return {
              finished: true,
              winnerId: player.id,
              reason: 'three_star_achieved',
            };
          }
        }
        break;
    }
    
    // Levels 8 & 9: Score-based win condition at turn limit
    if ((levelId === 8 || levelId === 9) && level.turnLimit && game.turn >= level.turnLimit) {
      // Player wins if they have higher score, otherwise AI wins
      if (player.score > ai.score) {
        return {
          finished: true,
          winnerId: player.id,
          reason: 'turn_limit_reached',
        };
      } else {
        return {
          finished: true,
          winnerId: ai.id,
          reason: 'turn_limit_reached',
        };
      }
    }
    
    // Default win condition: Game ends when turn limit is reached AND 1-star objective is met
    if (level.turnLimit && game.turn >= level.turnLimit) {
      // Check if player met 1-star objective
      let oneStarMet = false;
      
      switch (level.baseObjective) {
        case 'word_count':
          // Level 1: Need at least targetWordCount words
          if (game.wordCount !== undefined && level.targetWordCount) {
            oneStarMet = game.wordCount >= level.targetWordCount;
          }
          break;
        
        case 'score_threshold':
          // Levels 2 & 4: Need at least targetScore points
          if (level.targetScore) {
            oneStarMet = player.score >= level.targetScore;
          }
          break;
        
        case 'race_to_score':
          // Level 3: Need to reach 10 points for 1 star
          oneStarMet = player.score >= 10;
          break;
      }
      
      // Game ends - player wins if they met 1-star objective, otherwise AI wins
      if (oneStarMet) {
        return {
          finished: true,
          winnerId: player.id,
          reason: 'turn_limit_reached',
        };
      } else {
        return {
          finished: true,
          winnerId: ai.id,
          reason: 'turn_limit_reached',
        };
      }
    }
  }
  
  // Default: Check if any player has no letters left
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


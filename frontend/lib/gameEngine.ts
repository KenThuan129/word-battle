// Core Game Engine Logic

import { Board, Cell, Position, Letter, Move, Player, GameState } from '@/types';
import { ensureWordIsValid } from './dictionary';

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

/**
 * Places the word "RACING" horizontally on the board passing through center
 * Used for Level 3 start
 */
export function placeStartingWord(board: Board, word: string): Board {
  const newBoard = JSON.parse(JSON.stringify(board)) as Board;
  const centerRow = CENTER_ROW;
  const centerCol = CENTER_COL;
  
  // Place word horizontally, ensuring it passes through the center
  // "RACING" has 6 letters (R-A-C-I-N-G)
  // We want center at position 3 (the 'C'), so start at col 1
  const startCol = centerCol - 2; // Center is at index 2 of "RACING" (the 'C')
  
  for (let i = 0; i < word.length; i++) {
    const col = startCol + i;
    if (col >= 0 && col < BOARD_SIZE) {
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
  
  if (direction === 'horizontal') {
    while (startCol > 0 && board.cells[startRow][startCol - 1].letter) {
      startCol--;
    }
    while (startCol < board.size && board.cells[startRow][startCol].letter) {
      positions.push({ row: startRow, col: startCol });
      startCol++;
    }
  } else {
    while (startRow > 0 && board.cells[startRow - 1][startCol].letter) {
      startRow--;
    }
    while (startRow < board.size && board.cells[startRow][startCol].letter) {
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
      
      if (!isValidPosition(adjPos)) {
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

export function checkWinCondition(
  game: GameState, 
  level?: { baseObjective: string; targetScore?: number; targetWordCount?: number; turnLimit?: number },
  levelId?: number
): {
  finished: boolean;
  winnerId?: string;
  reason?: string;
} {
  const players = game.players;
  
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
    
    // Default win condition: Game ends when turn 10 is reached AND 1-star objective is met
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


// Word Generation Engine - Supports building words using board letters

import { Board, Letter, Position } from '@/types';
import { isValidWord } from './dictionary';

/**
 * Generate all possible words that can be formed using:
 * - Letters from player's hand
 * - Letters already on the board
 * - Must connect to existing letters on board
 */
export function generateWordsFromBoard(
  board: Board,
  hand: Letter[],
  minLength: number,
  maxLength: number
): Array<{
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  lettersFromHand: Letter[];
  lettersFromBoard: Position[];
}> {
  const words: Array<{
    word: string;
    positions: Position[];
    direction: 'horizontal' | 'vertical';
    lettersFromHand: Letter[];
    lettersFromBoard: Position[];
  }> = [];
  
  // First move: must pass through center
  if (isFirstMove(board)) {
    const centerRow = Math.floor(board.size / 2);
    const centerCol = Math.floor(board.size / 2);
    
    // Generate words from hand only for first move
    const handLetters = hand.map(l => l.char).join('').toLowerCase();
    const possibleWords = generateWordsFromLetters(handLetters, minLength, maxLength);
    
    for (const word of possibleWords) {
      // Try horizontal
      if (word.length <= board.size) {
        const startCol = Math.max(0, centerCol - word.length + 1);
        for (let col = startCol; col <= centerCol && col + word.length <= board.size; col++) {
          if (col <= centerCol && centerCol < col + word.length) {
            const positions: Position[] = [];
            const lettersFromHand: Letter[] = [];
            
            for (let i = 0; i < word.length; i++) {
              positions.push({ row: centerRow, col: col + i });
            }
            
            // Check if word can be placed
            if (canFormWord(board, hand, word, positions)) {
              words.push({
                word: word.toUpperCase(),
                positions,
                direction: 'horizontal',
                lettersFromHand: [...hand], // All letters from hand
                lettersFromBoard: [],
              });
            }
          }
        }
      }
      
      // Try vertical
      if (word.length <= board.size) {
        const startRow = Math.max(0, centerRow - word.length + 1);
        for (let row = startRow; row <= centerRow && row + word.length <= board.size; row++) {
          if (row <= centerRow && centerRow < row + word.length) {
            const positions: Position[] = [];
            const lettersFromHand: Letter[] = [];
            
            for (let i = 0; i < word.length; i++) {
              positions.push({ row: row + i, col: centerCol });
            }
            
            // Check if word can be placed
            if (canFormWord(board, hand, word, positions)) {
              words.push({
                word: word.toUpperCase(),
                positions,
                direction: 'vertical',
                lettersFromHand: [...hand],
                lettersFromBoard: [],
              });
            }
          }
        }
      }
    }
  } else {
    // Subsequent moves: can use board letters and must connect
    words.push(...generateWordsConnectingToBoard(board, hand, minLength, maxLength));
  }
  
  return words;
}

/**
 * Generate words that connect to existing letters on the board
 * Can use both hand letters and board letters
 */
function generateWordsConnectingToBoard(
  board: Board,
  hand: Letter[],
  minLength: number,
  maxLength: number
): Array<{
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  lettersFromHand: Letter[];
  lettersFromBoard: Position[];
}> {
  const words: Array<{
    word: string;
    positions: Position[];
    direction: 'horizontal' | 'vertical';
    lettersFromHand: Letter[];
    lettersFromBoard: Position[];
  }> = [];
  
  const handLetters = hand.map(l => l.char).join('').toLowerCase();
  
  // Find all existing letters on board
  const boardLetters: Array<{ pos: Position; char: string }> = [];
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      const cell = board.cells[row][col];
      if (cell.letter) {
        boardLetters.push({
          pos: { row, col },
          char: cell.letter.char.toLowerCase(),
        });
      }
    }
  }
  
  // Try building words starting from each board letter
  for (const boardLetter of boardLetters) {
    // Horizontal: extend left/right from this letter
    const horizontalWords = generateWordsFromPosition(
      board,
      hand,
      boardLetter.pos,
      'horizontal',
      boardLetter.char,
      minLength,
      maxLength
    );
    words.push(...horizontalWords);
    
    // Vertical: extend up/down from this letter
    const verticalWords = generateWordsFromPosition(
      board,
      hand,
      boardLetter.pos,
      'vertical',
      boardLetter.char,
      minLength,
      maxLength
    );
    words.push(...verticalWords);
  }
  
  // Also try building words that will connect to board letters
  const allPossibleWords = generateWordsFromLetters(handLetters, minLength, maxLength);
  
  for (const word of allPossibleWords) {
    // Try placing word near existing letters
    const placements = findWordPlacementsUsingBoard(board, hand, word);
    words.push(...placements);
  }
  
  return words;
}

/**
 * Generate words extending from a specific position using board and hand letters
 */
function generateWordsFromPosition(
  board: Board,
  hand: Letter[],
  startPos: Position,
  direction: 'horizontal' | 'vertical',
  startChar: string,
  minLength: number,
  maxLength: number
): Array<{
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  lettersFromHand: Letter[];
  lettersFromBoard: Position[];
}> {
  const words: Array<{
    word: string;
    positions: Position[];
    direction: 'horizontal' | 'vertical';
    lettersFromHand: Letter[];
    lettersFromBoard: Position[];
  }> = [];
  
  const handLetters = hand.map(l => l.char.toLowerCase()).join('').split('');
  const handCounts: Record<string, number> = {};
  for (const char of handLetters) {
    handCounts[char] = (handCounts[char] || 0) + 1;
  }
  
  // Try extending in both directions
  if (direction === 'horizontal') {
    // Try extending right
    for (let length = 1; length <= maxLength; length++) {
      const positions: Position[] = [startPos];
      const lettersFromBoard: Position[] = [startPos];
      const lettersFromHand: Letter[] = [];
      const usedHand: Record<string, number> = {};
      
      let word = startChar;
      let valid = true;
      
      for (let i = 1; i < length && valid; i++) {
        const col = startPos.col + i;
        if (col >= board.size) {
          valid = false;
          break;
        }
        
        const pos = { row: startPos.row, col };
        const cell = board.cells[pos.row][pos.col];
        
        if (cell.letter) {
          // Use board letter
          word += cell.letter.char.toLowerCase();
          positions.push(pos);
          lettersFromBoard.push(pos);
        } else {
          // Need to use hand letter
          // Find a letter that can form a valid word
          // This is complex - we'd need to try all combinations
          // For now, skip this optimization
          valid = false;
        }
      }
      
      if (valid && word.length >= minLength && isValidWord(word)) {
        words.push({
          word: word.toUpperCase(),
          positions,
          direction: 'horizontal',
          lettersFromHand,
          lettersFromBoard,
        });
      }
    }
  }
  
  // Similar for vertical...
  // This is a simplified version - full implementation would be more complex
  
  return words;
}

/**
 * Find all valid placements for a word that uses board letters
 */
function findWordPlacementsUsingBoard(
  board: Board,
  hand: Letter[],
  word: string
): Array<{
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  lettersFromHand: Letter[];
  lettersFromBoard: Position[];
}> {
  const placements: Array<{
    word: string;
    positions: Position[];
    direction: 'horizontal' | 'vertical';
    lettersFromHand: Letter[];
    lettersFromBoard: Position[];
  }> = [];
  
  // Try horizontal placements
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col <= board.size - word.length; col++) {
      const result = tryPlaceWordAt(board, hand, word, { row, col }, 'horizontal');
      if (result) {
        placements.push(result);
      }
    }
  }
  
  // Try vertical placements
  for (let row = 0; row <= board.size - word.length; row++) {
    for (let col = 0; col < board.size; col++) {
      const result = tryPlaceWordAt(board, hand, word, { row, col }, 'vertical');
      if (result) {
        placements.push(result);
      }
    }
  }
  
  return placements;
}

/**
 * Try placing a word at a specific position, using board letters where possible
 */
function tryPlaceWordAt(
  board: Board,
  hand: Letter[],
  word: string,
  startPos: Position,
  direction: 'horizontal' | 'vertical'
): {
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  lettersFromHand: Letter[];
  lettersFromBoard: Position[];
} | null {
  const positions: Position[] = [];
  const lettersFromHand: Letter[] = [];
  const lettersFromBoard: Position[] = [];
  
  const handAvailable: Record<string, number> = {};
  for (const letter of hand) {
    const char = letter.char.toLowerCase();
    handAvailable[char] = (handAvailable[char] || 0) + 1;
  }
  
  // Build word checking each position
  let wordBuilt = '';
  let usesBoardLetter = false;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    let pos: Position;
    
    if (direction === 'horizontal') {
      pos = { row: startPos.row, col: startPos.col + i };
    } else {
      pos = { row: startPos.row + i, col: startPos.col };
    }
    
    // Check bounds
    if (pos.row < 0 || pos.row >= board.size || pos.col < 0 || pos.col >= board.size) {
      return null;
    }
    
    const cell = board.cells[pos.row][pos.col];
    
    if (cell.letter) {
      // Use board letter if it matches
      if (cell.letter.char.toLowerCase() !== char) {
        return null; // Letter doesn't match
      }
      wordBuilt += char;
      positions.push(pos);
      lettersFromBoard.push(pos);
      usesBoardLetter = true;
    } else {
      // Need letter from hand
      if (!handAvailable[char] || handAvailable[char] === 0) {
        return null; // Don't have this letter
      }
      wordBuilt += char;
      positions.push(pos);
      const handLetter = hand.find(l => l.char.toLowerCase() === char);
      if (handLetter) {
        lettersFromHand.push(handLetter);
        handAvailable[char]--;
      }
    }
  }
  
  // Must connect to existing letters (or be first move)
  if (!isFirstMove(board) && !usesBoardLetter) {
    // Check if any position is adjacent to existing letters
    const hasAdjacent = positions.some(pos => {
      const adj = [
        { row: pos.row - 1, col: pos.col },
        { row: pos.row + 1, col: pos.col },
        { row: pos.row, col: pos.col - 1 },
        { row: pos.row, col: pos.col + 1 },
      ];
      
      return adj.some(a => {
        if (a.row < 0 || a.row >= board.size || a.col < 0 || a.col >= board.size) {
          return false;
        }
        return board.cells[a.row][a.col].letter !== null;
      });
    });
    
    if (!hasAdjacent) {
      return null;
    }
  }
  
  // Verify word is valid
  if (!isValidWord(wordBuilt)) {
    return null;
  }
  
  return {
    word: wordBuilt.toUpperCase(),
    positions,
    direction,
    lettersFromHand,
    lettersFromBoard,
  };
}

/**
 * Check if a word can be formed at given positions using hand and board letters
 */
function canFormWord(
  board: Board,
  hand: Letter[],
  word: string,
  positions: Position[]
): boolean {
  const handAvailable: Record<string, number> = {};
  for (const letter of hand) {
    const char = letter.char.toLowerCase();
    handAvailable[char] = (handAvailable[char] || 0) + 1;
  }
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    const pos = positions[i];
    const cell = board.cells[pos.row][pos.col];
    
    if (cell.letter) {
      if (cell.letter.char.toLowerCase() !== char) {
        return false;
      }
    } else {
      if (!handAvailable[char] || handAvailable[char] === 0) {
        return false;
      }
      handAvailable[char]--;
    }
  }
  
  return true;
}

/**
 * Generate all valid words from given letters (simple permutation)
 */
function generateWordsFromLetters(
  letters: string,
  minLength: number,
  maxLength: number
): string[] {
  const words: string[] = [];
  const letterCounts: Record<string, number> = {};
  
  // Count letters
  for (const char of letters) {
    letterCounts[char] = (letterCounts[char] || 0) + 1;
  }
  
  // Generate all combinations
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
  
  return [...new Set(words)];
}

function isFirstMove(board: Board): boolean {
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      const cell = board.cells[row][col];
      if (cell.letter !== null && !cell.isCenter) {
        return false;
      }
    }
  }
  return true;
}


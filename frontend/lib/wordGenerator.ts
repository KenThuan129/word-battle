// Word Generation Engine - Supports building words using board letters

import { Board, Letter, Position } from '@/types';
import { isValidWord } from './dictionary';
import { getBoardWidth, getBoardHeight } from './gameEngine';

type GeneratedWord = {
  word: string;
  positions: Position[];
  direction: 'horizontal' | 'vertical';
  lettersFromHand: Letter[];
  lettersFromBoard: Position[];
};

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
): GeneratedWord[] {
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);
  const words: GeneratedWord[] = [];

  if (isFirstMove(board)) {
    const centerRow = Math.floor(boardHeight / 2);
    const centerCol = Math.floor(boardWidth / 2);
    const handLetters = hand.map((l) => l.char).join('').toLowerCase();
    const possibleWords = generateWordsFromLetters(handLetters, minLength, maxLength);

    for (const word of possibleWords) {
      if (word.length <= boardWidth) {
        const startCol = Math.max(0, centerCol - word.length + 1);
        for (let col = startCol; col <= centerCol && col + word.length <= boardWidth; col++) {
          if (col <= centerCol && centerCol < col + word.length) {
            const positions: Position[] = [];
            for (let i = 0; i < word.length; i++) {
              positions.push({ row: centerRow, col: col + i });
            }

            if (canFormWord(board, hand, word, positions)) {
              words.push({
                word: word.toUpperCase(),
                positions,
                direction: 'horizontal',
                lettersFromHand: [...hand],
                lettersFromBoard: [],
              });
            }
          }
        }
      }

      if (word.length <= boardHeight) {
        const startRow = Math.max(0, centerRow - word.length + 1);
        for (let row = startRow; row <= centerRow && row + word.length <= boardHeight; row++) {
          if (row <= centerRow && centerRow < row + word.length) {
            const positions: Position[] = [];
            for (let i = 0; i < word.length; i++) {
              positions.push({ row: row + i, col: centerCol });
            }

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
    words.push(...generateWordsConnectingToBoard(board, hand, minLength, maxLength));
  }

  return words;
}

/**
 * Generate words that connect to existing letters on the board.
 */
function generateWordsConnectingToBoard(
  board: Board,
  hand: Letter[],
  minLength: number,
  maxLength: number
): GeneratedWord[] {
  const words: GeneratedWord[] = [];
  const handLetters = hand.map((l) => l.char).join('').toLowerCase();
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);

  const boardLetters: Array<{ pos: Position; char: string }> = [];
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board.cells[row][col];
      if (cell.letter) {
        boardLetters.push({
          pos: { row, col },
          char: cell.letter.char.toLowerCase(),
        });
      }
    }
  }

  for (const boardLetter of boardLetters) {
    words.push(
      ...generateWordsFromPosition(
        board,
        hand,
        boardLetter.pos,
        'horizontal',
        boardLetter.char,
        minLength,
        maxLength
      )
    );
    words.push(
      ...generateWordsFromPosition(
        board,
        hand,
        boardLetter.pos,
        'vertical',
        boardLetter.char,
        minLength,
        maxLength
      )
    );
  }

  const allPossibleWords = generateWordsFromLetters(handLetters, minLength, maxLength);
  for (const word of allPossibleWords) {
    words.push(...findWordPlacementsUsingBoard(board, hand, word));
  }

  return words;
}

/**
 * Attempt to build words extending from a specific board position.
 * This simplified routine only uses contiguous board letters.
 */
function generateWordsFromPosition(
  board: Board,
  hand: Letter[],
  startPos: Position,
  direction: 'horizontal' | 'vertical',
  startChar: string,
  minLength: number,
  maxLength: number
): GeneratedWord[] {
  const words: GeneratedWord[] = [];
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);
  const delta = direction === 'horizontal' ? { row: 0, col: 1 } : { row: 1, col: 0 };

  let word = startChar;
  const positions: Position[] = [startPos];
  const lettersFromBoard: Position[] = [startPos];

  for (let step = 1; step < maxLength; step++) {
    const next = { row: startPos.row + delta.row * step, col: startPos.col + delta.col * step };
    if (next.row < 0 || next.row >= boardHeight || next.col < 0 || next.col >= boardWidth) {
      break;
    }

    const cell = board.cells[next.row][next.col];
    if (!cell.letter) {
      break;
    }

    word += cell.letter.char.toLowerCase();
    positions.push(next);
    lettersFromBoard.push(next);

    if (word.length >= minLength && word.length <= maxLength && isValidWord(word)) {
      words.push({
        word: word.toUpperCase(),
        positions: [...positions],
        direction,
        lettersFromHand: [],
        lettersFromBoard: [...lettersFromBoard],
      });
    }
  }

  return words;
}

/**
 * Find all valid placements for a word that uses board letters.
 */
function findWordPlacementsUsingBoard(board: Board, hand: Letter[], word: string): GeneratedWord[] {
  const placements: GeneratedWord[] = [];
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);

  if (word.length <= boardWidth) {
    for (let row = 0; row < boardHeight; row++) {
      for (let col = 0; col <= boardWidth - word.length; col++) {
        const result = tryPlaceWordAt(board, hand, word, { row, col }, 'horizontal');
        if (result) {
          placements.push(result);
        }
      }
    }
  }

  if (word.length <= boardHeight) {
    for (let row = 0; row <= boardHeight - word.length; row++) {
      for (let col = 0; col < boardWidth; col++) {
        const result = tryPlaceWordAt(board, hand, word, { row, col }, 'vertical');
        if (result) {
          placements.push(result);
        }
      }
    }
  }

  return placements;
}

/**
 * Try placing a word at a specific position, using board letters where possible.
 */
function tryPlaceWordAt(
  board: Board,
  hand: Letter[],
  word: string,
  startPos: Position,
  direction: 'horizontal' | 'vertical'
): GeneratedWord | null {
  const positions: Position[] = [];
  const lettersFromHand: Letter[] = [];
  const lettersFromBoard: Position[] = [];
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);

  const handAvailable: Record<string, number> = {};
  for (const letter of hand) {
    const char = letter.char.toLowerCase();
    handAvailable[char] = (handAvailable[char] || 0) + 1;
  }

  let wordBuilt = '';
  let usesBoardLetter = false;

  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    const pos =
      direction === 'horizontal'
        ? { row: startPos.row, col: startPos.col + i }
        : { row: startPos.row + i, col: startPos.col };

    if (pos.row < 0 || pos.row >= boardHeight || pos.col < 0 || pos.col >= boardWidth) {
      return null;
    }

    const cell = board.cells[pos.row][pos.col];
    if (cell.letter) {
      if (cell.letter.char.toLowerCase() !== char) {
        return null;
      }
      wordBuilt += char;
      positions.push(pos);
      lettersFromBoard.push(pos);
      usesBoardLetter = true;
    } else {
      if (!handAvailable[char]) {
        return null;
      }
      handAvailable[char]--;

      const handLetter = hand.find((l) => l.char.toLowerCase() === char);
      if (!handLetter) {
        return null;
      }
      lettersFromHand.push(handLetter);
      positions.push(pos);
      wordBuilt += char;
    }
  }

  if (!isFirstMove(board) && !usesBoardLetter) {
    const touchesExisting = positions.some((pos) => {
      const adj = [
        { row: pos.row - 1, col: pos.col },
        { row: pos.row + 1, col: pos.col },
        { row: pos.row, col: pos.col - 1 },
        { row: pos.row, col: pos.col + 1 },
      ];

      return adj.some((a) => {
        if (a.row < 0 || a.row >= boardHeight || a.col < 0 || a.col >= boardWidth) {
          return false;
        }
        return board.cells[a.row][a.col].letter !== null;
      });
    });

    if (!touchesExisting) {
      return null;
    }
  }

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
 * Check if a word can be formed at given positions using hand and board letters.
 */
function canFormWord(board: Board, hand: Letter[], word: string, positions: Position[]): boolean {
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
      if (!handAvailable[char]) {
        return false;
      }
      handAvailable[char]--;
    }
  }

  return true;
}

/**
 * Generate all valid words from given letters (simple permutation/backtracking).
 */
function generateWordsFromLetters(letters: string, minLength: number, maxLength: number): string[] {
  const words: string[] = [];
  const letterCounts: Record<string, number> = {};

  for (const char of letters) {
    letterCounts[char] = (letterCounts[char] || 0) + 1;
  }

  function explore(current: string, remaining: Record<string, number>) {
    if (current.length >= minLength && current.length <= maxLength && isValidWord(current)) {
      words.push(current);
    }

    if (current.length >= maxLength) {
      return;
    }

    for (const [char, count] of Object.entries(remaining)) {
      if (count > 0) {
        const nextRemaining = { ...remaining, [char]: count - 1 };
        explore(current + char, nextRemaining);
      }
    }
  }

  explore('', letterCounts);
  return [...new Set(words)];
}

function isFirstMove(board: Board): boolean {
  const boardWidth = getBoardWidth(board);
  const boardHeight = getBoardHeight(board);

  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board.cells[row][col];
      if (cell.letter !== null && !cell.isCenter) {
        return false;
      }
    }
  }

  return true;
}


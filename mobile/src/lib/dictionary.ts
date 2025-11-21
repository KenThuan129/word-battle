// Word Dictionary and Validation
// Re-export from dictionaryLoader for backward compatibility

import { VALID_WORDS, isValidWord as isValidWordFromLoader, initializeBasicDictionary, loadComprehensiveDictionary } from './dictionaryLoader';

export { VALID_WORDS, initializeBasicDictionary, loadComprehensiveDictionary };

// Note: The dictionary is initialized in dictionaryLoader.ts
// This file is kept for backward compatibility and additional utilities

export function isValidWord(word: string): boolean {
  return isValidWordFromLoader(word);
}

export function addWordToDictionary(word: string): void {
  VALID_WORDS.add(word.toLowerCase().trim());
}

// For production, you'd want to:
// 1. Load a comprehensive word list from a file
// 2. Use a dictionary API for definitions
// 3. Cache word lookups

// Example: Load dictionary from a file
export async function loadDictionary(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    const words = await response.json();
    for (const word of words) {
      VALID_WORDS.add(word.toLowerCase().trim());
    }
  } catch (error) {
    console.error('Failed to load dictionary:', error);
  }
}


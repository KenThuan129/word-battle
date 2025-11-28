// Word Dictionary and Validation
// Re-export from dictionaryLoader for backward compatibility

import AsyncStorage from '@react-native-async-storage/async-storage';
import { VALID_WORDS, isValidWord as isValidWordFromLoader, initializeBasicDictionary, loadComprehensiveDictionary } from './dictionaryLoader';

const DICTIONARY_API_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const CACHE_PREFIX = 'wordbattle_dictionary_cache_';

const validationCache = new Map<string, boolean>();
const pendingLookups = new Map<string, Promise<boolean>>();

async function getCachedValidity(word: string): Promise<boolean | null> {
  const normalized = word.toLowerCase();
  if (validationCache.has(normalized)) {
    return validationCache.get(normalized)!;
  }
  try {
    const stored = await AsyncStorage.getItem(CACHE_PREFIX + normalized);
    if (stored === null || stored === undefined) {
      return null;
    }
    const parsed = stored === 'true';
    validationCache.set(normalized, parsed);
    return parsed;
  } catch (error) {
    console.warn('Failed to read dictionary cache:', error);
    return null;
  }
}

async function setCachedValidity(word: string, isValid: boolean): Promise<void> {
  const normalized = word.toLowerCase();
  validationCache.set(normalized, isValid);
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + normalized, String(isValid));
  } catch (error) {
    console.warn('Failed to persist dictionary cache:', error);
  }
}

export { VALID_WORDS, initializeBasicDictionary, loadComprehensiveDictionary };

// Note: The dictionary is initialized in dictionaryLoader.ts
// This file is kept for backward compatibility and additional utilities

export function isValidWord(word: string): boolean {
  return isValidWordFromLoader(word);
}

export async function ensureWordIsValid(word: string): Promise<boolean> {
  const normalized = word.toLowerCase().trim();
  if (!normalized) {
    return false;
  }

  // First check local dictionary (fastest)
  if (VALID_WORDS.has(normalized)) {
    return true;
  }

  // Check cache (fast)
  const cached = await getCachedValidity(normalized);
  if (cached !== null) {
    if (cached) {
      VALID_WORDS.add(normalized);
    }
    return cached;
  }

  // If word is already being looked up, wait for that
  if (pendingLookups.has(normalized)) {
    return pendingLookups.get(normalized)!;
  }

  const lookupPromise = (async () => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(`${DICTIONARY_API_ENDPOINT}${normalized}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          VALID_WORDS.add(normalized);
          await setCachedValidity(normalized, true);
          return true;
        }
        if (response.status === 404) {
          await setCachedValidity(normalized, false);
          return false;
        }
        console.warn(`Dictionary API returned unexpected status ${response.status} for word "${normalized}"`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn(`Dictionary API timeout for word "${normalized}"`);
        } else {
          console.error('Failed to validate word via dictionary API:', fetchError);
        }
      }
    } catch (error) {
      console.error('Error in dictionary lookup:', error);
    }
    // Fallback: if API fails or times out, check local dictionary
    // This should have been checked first, but double-check here
    const localCheck = isValidWordFromLoader(normalized);
    if (localCheck) {
      VALID_WORDS.add(normalized);
      await setCachedValidity(normalized, true);
      return true;
    }
    // Cache the negative result to avoid repeated API calls
    await setCachedValidity(normalized, false);
    return false;
  })();

  pendingLookups.set(normalized, lookupPromise);
  const result = await lookupPromise;
  pendingLookups.delete(normalized);
  return result;
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


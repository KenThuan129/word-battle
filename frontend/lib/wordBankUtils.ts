// Word Bank Utility Functions

import { WordEntry, WordBank, WordDifficulty } from '@/types';
import { getWordDefinition, formatDefinition, getPartOfSpeech, getPronunciation } from './dictionaryApi';
import { toast } from 'sonner';

/**
 * Add a word to the word bank
 * Returns true if the word was newly added, false if it already existed
 */
export async function addWordToBank(
  word: string,
  basePoints: number = 0,
  showToast: boolean = true
): Promise<boolean> {
  const normalizedWord = word.toLowerCase().trim();
  
  // Load existing word bank
  const saved = localStorage.getItem('wordBank');
  let wordBank: WordBank = {
    words: [],
    totalWords: 0,
    uniqueWordsUsed: 0,
    wordsEncountered: 0,
  };
  
  if (saved) {
    try {
      const parsed: WordBank = JSON.parse(saved);
      // Convert date strings to Date objects
      wordBank = {
        ...parsed,
        words: parsed.words.map((w: WordEntry) => ({
          ...w,
          firstUsedAt: new Date(w.firstUsedAt),
          lastUsedAt: w.lastUsedAt ? new Date(w.lastUsedAt) : undefined,
        })),
      };
    } catch (error) {
      console.error('Error loading word bank:', error);
    }
  }
  
  // Check if word already exists
  const existingWord = wordBank.words.find(w => w.word.toLowerCase() === normalizedWord);
  
  if (existingWord) {
    // Update existing word
    existingWord.timesUsed += 1;
    existingWord.lastUsedAt = new Date();
    existingWord.timesEncountered += 1;
    
    // Mark as mastered if used 5+ times
    if (existingWord.timesUsed >= 5 && !existingWord.isMastered) {
      existingWord.isMastered = true;
    }
    
    wordBank.wordsEncountered += 1;
  } else {
    // IMPORTANT: Only add words that exist in the dictionary API
    // Fetch definition and pronunciation from API
    let wordDef: Awaited<ReturnType<typeof getWordDefinition>> = null;
    
    try {
      wordDef = await getWordDefinition(normalizedWord);
    } catch (error) {
      console.error('Error fetching word definition:', error);
    }
    
    // Only add word if it exists in the API dictionary
    if (!wordDef) {
      // Word not found in API - don't add to word bank
      console.log(`Word "${normalizedWord}" not found in dictionary API, skipping word bank addition`);
      return false;
    }
    
    // Word exists in API - extract information
    const definition = formatDefinition(wordDef);
    const pronunciation = getPronunciation(wordDef);
    const partOfSpeech = getPartOfSpeech(wordDef);
    
    // Determine difficulty based on word length and complexity
    const difficulty: WordDifficulty = determineDifficulty(normalizedWord);
    
    // Create new word entry
    const newWord: WordEntry = {
      word: normalizedWord,
      definition,
      pronunciation,
      partOfSpeech,
      difficulty,
      timesUsed: 1,
      timesEncountered: 1,
      firstUsedAt: new Date(),
      lastUsedAt: new Date(),
      isMastered: false,
      isFavorite: false,
      basePoints,
      longestWordBonus: 0,
    };
    
    wordBank.words.push(newWord);
    wordBank.totalWords += 1;
    wordBank.uniqueWordsUsed += 1;
    wordBank.wordsEncountered += 1;
    
    // Show toast notification for new word
    if (showToast) {
      toast.success(`New word added to Word Bank!`, {
        description: `${word.toUpperCase()} - ${pronunciation || 'No pronunciation'} - ${definition.substring(0, 50)}${definition.length > 50 ? '...' : ''}`,
        duration: 4000,
      });
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('wordBank', JSON.stringify(wordBank));
    } catch (error) {
      console.error('Error saving word bank:', error);
    }
    
    return true; // Word was newly added
  }
  
  // Save updated word bank
  try {
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
  } catch (error) {
    console.error('Error saving word bank:', error);
  }
  
  return false; // Word already existed
}

/**
 * Determine word difficulty based on length and complexity
 */
function determineDifficulty(word: string): WordDifficulty {
  const length = word.length;
  
  if (length <= 4) {
    return 'common';
  } else if (length <= 6) {
    return 'intermediate';
  } else if (length <= 8) {
    return 'advanced';
  } else {
    return 'rare';
  }
}


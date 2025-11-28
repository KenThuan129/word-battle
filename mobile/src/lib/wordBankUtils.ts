import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordEntry, WordBank, WordDifficulty } from '../types';
import { getWordDefinition, formatDefinition, getPartOfSpeech } from './dictionaryApi';

const STORAGE_KEY = 'wordBank';

async function loadWordBank(): Promise<WordBank> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        words: [],
        totalWords: 0,
        uniqueWordsUsed: 0,
        wordsEncountered: 0,
      };
    }
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      words: parsed.words.map((w: WordEntry) => ({
        ...w,
        firstUsedAt: new Date(w.firstUsedAt),
        lastUsedAt: w.lastUsedAt ? new Date(w.lastUsedAt) : undefined,
      })),
    };
  } catch (error) {
    console.error('Failed to load word bank:', error);
    return {
      words: [],
      totalWords: 0,
      uniqueWordsUsed: 0,
      wordsEncountered: 0,
    };
  }
}

async function saveWordBank(wordBank: WordBank): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(wordBank));
  } catch (error) {
    console.error('Failed to save word bank:', error);
  }
}

export async function addWordToBank(
  word: string,
  basePoints: number = 0,
  _showToast: boolean = false
): Promise<boolean> {
  const normalizedWord = word.toLowerCase().trim();
  if (!normalizedWord) {
    return false;
  }

  const wordBank = await loadWordBank();
  const existingWord = wordBank.words.find(w => w.word.toLowerCase() === normalizedWord);

  if (existingWord) {
    existingWord.timesUsed += 1;
    existingWord.timesEncountered += 1;
    existingWord.lastUsedAt = new Date();

    if (existingWord.timesUsed >= 5 && !existingWord.isMastered) {
      existingWord.isMastered = true;
    }

    wordBank.wordsEncountered += 1;
    await saveWordBank(wordBank);
    return false;
  }

  let wordDef = await getWordDefinition(normalizedWord);
  if (!wordDef) {
    return false;
  }

  const definition = formatDefinition(wordDef);
  const partOfSpeech = getPartOfSpeech(wordDef);
  const difficulty: WordDifficulty = determineDifficulty(normalizedWord);

  const newWord: WordEntry = {
    word: normalizedWord,
    definition,
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

  await saveWordBank(wordBank);
  return true;
}

function determineDifficulty(word: string): WordDifficulty {
  const length = word.length;

  if (length <= 4) {
    return 'common';
  } else if (length <= 6) {
    return 'intermediate';
  } else if (length <= 8) {
    return 'advanced';
  }
  return 'rare';
}


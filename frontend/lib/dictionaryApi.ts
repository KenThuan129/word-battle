// Dictionary API Integration for Word Definitions

export interface WordDefinition {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      synonyms?: string[];
      antonyms?: string[];
      example?: string;
    }>;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
}

const CACHE_KEY_PREFIX = 'word_def_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedDefinition {
  definition: WordDefinition;
  cachedAt: number;
}

export async function getWordDefinition(word: string): Promise<WordDefinition | null> {
  const normalizedWord = word.toLowerCase().trim();
  
  // Check cache first
  const cached = getCachedDefinition(normalizedWord);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${normalizedWord}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Word not found
      }
      throw new Error(`Failed to fetch definition: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // API returns array, take first entry
    if (Array.isArray(data) && data.length > 0) {
      const definition: WordDefinition = data[0];
      
      // Cache the definition
      cacheDefinition(normalizedWord, definition);
      
      return definition;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching word definition:', error);
    return null;
  }
}

export function getCachedDefinition(word: string): WordDefinition | null {
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY_PREFIX + word);
    if (!cachedStr) {
      return null;
    }
    
    const cached: CachedDefinition = JSON.parse(cachedStr);
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.cachedAt > CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(CACHE_KEY_PREFIX + word);
      return null;
    }
    
    return cached.definition;
  } catch (error) {
    console.error('Error reading cached definition:', error);
    return null;
  }
}

function cacheDefinition(word: string, definition: WordDefinition): void {
  try {
    const cached: CachedDefinition = {
      definition,
      cachedAt: Date.now(),
    };
    
    localStorage.setItem(CACHE_KEY_PREFIX + word, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching definition:', error);
    // Storage might be full, ignore error
  }
}

export function formatDefinition(def: WordDefinition): string {
  if (def.meanings && def.meanings.length > 0) {
    const firstMeaning = def.meanings[0];
    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
      return firstMeaning.definitions[0].definition;
    }
  }
  return 'No definition available';
}

export function getPartOfSpeech(def: WordDefinition): string {
  if (def.meanings && def.meanings.length > 0) {
    return def.meanings[0].partOfSpeech || 'unknown';
  }
  return 'unknown';
}


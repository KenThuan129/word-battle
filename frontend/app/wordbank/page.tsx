'use client';

import React, { useState, useEffect } from 'react';
import { WordEntry, WordBank, WordDifficulty } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getWordDefinition, formatDefinition, getPartOfSpeech } from '@/lib/dictionaryApi';

export default function WordBankPage() {
  const [wordBank, setWordBank] = useState<WordBank>({
    words: [],
    totalWords: 0,
    uniqueWordsUsed: 0,
    wordsEncountered: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'mastered' | 'favorites' | 'learning'>('all');
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadWordBank();
  }, []);
  
  const loadWordBank = async () => {
    try {
      // Load from localStorage for now (in production, fetch from API)
      const saved = localStorage.getItem('wordBank');
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings to Date objects
        parsed.words = parsed.words.map((w: any) => ({
          ...w,
          firstUsedAt: new Date(w.firstUsedAt),
          lastUsedAt: w.lastUsedAt ? new Date(w.lastUsedAt) : undefined,
        }));
        setWordBank(parsed);
      } else {
        // Initialize empty word bank
        setWordBank({
          words: [],
          totalWords: 0,
          uniqueWordsUsed: 0,
          wordsEncountered: 0,
        });
      }
    } catch (error) {
      console.error('Error loading word bank:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredWords = wordBank.words.filter((word) => {
    // Search filter
    if (searchTerm && !word.word.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Category filter
    switch (filter) {
      case 'mastered':
        return word.isMastered;
      case 'favorites':
        return word.isFavorite;
      case 'learning':
        return !word.isMastered;
      default:
        return true;
    }
  });
  
  const toggleFavorite = (word: string) => {
    const updated = {
      ...wordBank,
      words: wordBank.words.map((w) =>
        w.word === word ? { ...w, isFavorite: !w.isFavorite } : w
      ),
    };
    setWordBank(updated);
    localStorage.setItem('wordBank', JSON.stringify(updated));
  };
  
  const getDifficultyColor = (difficulty: WordDifficulty) => {
    switch (difficulty) {
      case 'common':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'advanced':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'rare':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };
  
  const handleWordClick = async (word: WordEntry) => {
    setSelectedWord(word);
    
    // Load definition if not already loaded
    if (!word.definition) {
      try {
        const definition = await getWordDefinition(word.word);
        if (definition) {
          const definitionText = formatDefinition(definition);
          const partOfSpeech = getPartOfSpeech(definition);
          
          const updated = {
            ...wordBank,
            words: wordBank.words.map((w) =>
              w.word === word.word
                ? {
                    ...w,
                    definition: definitionText,
                    partOfSpeech: partOfSpeech || w.partOfSpeech,
                  }
                : w
            ),
          };
          setWordBank(updated);
          setSelectedWord({
            ...word,
            definition: definitionText,
            partOfSpeech: partOfSpeech || word.partOfSpeech,
          });
          localStorage.setItem('wordBank', JSON.stringify(updated));
        }
      } catch (error) {
        console.error('Error fetching definition:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center">Loading word bank...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Word Bank</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your collected vocabulary. Click on words to see definitions and learn more!
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Words</div>
            <div className="text-2xl font-bold">{wordBank.totalWords}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Words</div>
            <div className="text-2xl font-bold">{wordBank.uniqueWordsUsed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Encountered</div>
            <div className="text-2xl font-bold">{wordBank.wordsEncountered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Mastered</div>
            <div className="text-2xl font-bold">
              {wordBank.words.filter((w) => w.isMastered).length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'learning' ? 'default' : 'outline'}
                onClick={() => setFilter('learning')}
              >
                Learning
              </Button>
              <Button
                variant={filter === 'mastered' ? 'default' : 'outline'}
                onClick={() => setFilter('mastered')}
              >
                Mastered
              </Button>
              <Button
                variant={filter === 'favorites' ? 'default' : 'outline'}
                onClick={() => setFilter('favorites')}
              >
                Favorites
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Word List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Words Grid */}
        <div className="md:col-span-2">
          {filteredWords.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                {wordBank.totalWords === 0
                  ? 'No words collected yet. Start playing to build your word bank!'
                  : 'No words match your search/filter criteria.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredWords.map((word) => (
                <Card
                  key={word.word}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedWord?.word === word.word ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleWordClick(word)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{word.word.toUpperCase()}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(word.difficulty)}`}
                          >
                            {word.difficulty}
                          </span>
                          {word.isMastered && (
                            <span className="text-yellow-500" title="Mastered">
                              ⭐
                            </span>
                          )}
                        </div>
                        {word.partOfSpeech && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-1">
                            {word.partOfSpeech}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>Used: {word.timesUsed}x</span>
                          <span>Seen: {word.timesEncountered}x</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(word.word);
                        }}
                        className="text-yellow-500 hover:text-yellow-600"
                      >
                        {word.isFavorite ? '❤️' : '🤍'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Word Details Panel */}
        <div className="md:col-span-1">
          {selectedWord ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-2xl">{selectedWord.word.toUpperCase()}</CardTitle>
                <CardDescription>
                  {selectedWord.partOfSpeech && (
                    <span className="italic">{selectedWord.partOfSpeech}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedWord.definition ? (
                  <div>
                    <h4 className="font-semibold mb-2">Definition</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedWord.definition}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Loading definition...</div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Statistics</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Times Used:</span>
                      <span className="font-semibold">{selectedWord.timesUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Times Encountered:</span>
                      <span className="font-semibold">{selectedWord.timesEncountered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">First Used:</span>
                      <span className="font-semibold">
                        {selectedWord.firstUsedAt.toLocaleDateString()}
                      </span>
                    </div>
                    {selectedWord.lastUsedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Used:</span>
                        <span className="font-semibold">
                          {selectedWord.lastUsedAt.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Base Points:</span>
                      <span className="font-semibold">{selectedWord.basePoints}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Mastered:</span>
                      {selectedWord.isMastered ? (
                        <span className="text-yellow-500">⭐ Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Favorite:</span>
                      {selectedWord.isFavorite ? (
                        <span className="text-red-500">❤️ Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toggleFavorite(selectedWord.word)}
                >
                  {selectedWord.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Select a word to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


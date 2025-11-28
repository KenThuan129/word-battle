import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordEntry, WordBank, WordDifficulty } from '../types';

export default function WordBankScreen() {
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
      const saved = await AsyncStorage.getItem('wordBank');
      if (saved) {
        const parsed: WordBank = JSON.parse(saved);
        const normalizedWords = parsed.words.map((w: WordEntry) => ({
          ...w,
          firstUsedAt: new Date(w.firstUsedAt),
          lastUsedAt: w.lastUsedAt ? new Date(w.lastUsedAt) : undefined,
        }));
        setWordBank({
          ...parsed,
          words: normalizedWords,
        });
      }
    } catch (error) {
      console.error('Error loading word bank:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = wordBank.words.filter((word) => {
    if (searchTerm && !word.word.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

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

  const toggleFavorite = async (word: string) => {
    const updated = {
      ...wordBank,
      words: wordBank.words.map((w) =>
        w.word === word ? { ...w, isFavorite: !w.isFavorite } : w
      ),
    };
    setWordBank(updated);
    await AsyncStorage.setItem('wordBank', JSON.stringify(updated));
  };

  const getDifficultyColor = (difficulty: WordDifficulty) => {
    switch (difficulty) {
      case 'common':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#f97316';
      case 'rare':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading word bank...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <Text style={styles.title}>📚 Word Bank</Text>
        <Text style={styles.subtitle}>
          Your collected vocabulary • {wordBank.uniqueWordsUsed} unique words
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search words..."
          placeholderTextColor="#6b7280"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'mastered', 'favorites', 'learning'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === f && styles.filterButtonTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Words</Text>
          <Text style={styles.statValue}>{wordBank.totalWords}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Unique Words</Text>
          <Text style={styles.statValue}>{wordBank.uniqueWordsUsed}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Encountered</Text>
          <Text style={styles.statValue}>{wordBank.wordsEncountered}</Text>
        </View>
      </View>

      <View style={styles.wordsContainer}>
        {filteredWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchTerm
                ? 'No words found matching your search'
                : 'No words in your bank yet. Play games to collect words!'}
            </Text>
          </View>
        ) : (
          filteredWords.map((word) => (
            <TouchableOpacity
              key={word.word}
              style={styles.wordCard}
              onPress={() => setSelectedWord(selectedWord?.word === word.word ? null : word)}
            >
              <View style={styles.wordHeader}>
                <View style={styles.wordTitleContainer}>
                  <Text style={styles.wordText}>{word.word.toUpperCase()}</Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(word.difficulty) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(word.difficulty) },
                      ]}
                    >
                      {word.difficulty}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleFavorite(word.word)}
                  style={styles.favoriteButton}
                >
                  <Text style={styles.favoriteIcon}>
                    {word.isFavorite ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedWord?.word === word.word && (
                <View style={styles.wordDetails}>
                  <Text style={styles.definition}>{word.definition}</Text>
                  <View style={styles.wordMeta}>
                    <Text style={styles.metaItem}>
                      Part of Speech: {word.partOfSpeech}
                    </Text>
                    <Text style={styles.metaItem}>
                      Times Used: {word.timesUsed}
                    </Text>
                    <Text style={styles.metaItem}>
                      Base Points: {word.basePoints}
                    </Text>
                    {word.isMastered && (
                      <Text style={styles.masteredBadge}>✓ Mastered</Text>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d0d0f',
  },
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#b7b5b0',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1d',
    borderBottomWidth: 1,
    borderBottomColor: '#2f5d62',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e5e4e2',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#b7b5b0',
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: '#1a1a1d',
    borderRadius: 8,
    padding: 12,
    color: '#e5e4e2',
    borderWidth: 1,
    borderColor: '#2f5d62',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1d',
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#b7b5b0',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  statLabel: {
    fontSize: 12,
    color: '#b7b5b0',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffb300',
  },
  wordsContainer: {
    padding: 20,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#b7b5b0',
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordTitleContainer: {
    flex: 1,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e4e2',
    marginBottom: 8,
    letterSpacing: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  wordDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2f5d62',
  },
  definition: {
    fontSize: 14,
    color: '#b7b5b0',
    marginBottom: 12,
    lineHeight: 20,
  },
  wordMeta: {
    gap: 8,
  },
  metaItem: {
    fontSize: 12,
    color: '#94a3b8',
  },
  masteredBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
});

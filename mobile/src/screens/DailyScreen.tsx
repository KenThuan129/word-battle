import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '../store/gameStore';
import { ChallengePuzzle, DailyChallenge, KeySystem } from '../types';
import { colors, textStyles } from '../lib/theme';

type RootStackParamList = {
  MainTabs: undefined;
  Journey: undefined;
  Arena: undefined;
  Daily: undefined;
  WordBank: undefined;
  Game: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DailyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [keys, setKeys] = useState<KeySystem>({
    currentKeys: 0,
    totalKeysEarned: 0,
    todayCompleted: [false, false, false],
    currentStreak: 0,
    longestStreak: 0,
    pvpUnlockCost: 10,
    pvpUnlocked: false,
  });
  const [loading, setLoading] = useState(true);

  const { startGame } = useGameStore();

  useEffect(() => {
    loadDailyChallenge();
    loadKeys();
  }, []);

  const loadDailyChallenge = async () => {
    try {
      const today = new Date().toDateString();
      const saved = await AsyncStorage.getItem(`dailyChallenge_${today}`);

      if (saved) {
        const parsed = JSON.parse(saved);
        setDailyChallenge(parsed);
      } else {
        const challenge = generateDailyChallenge();
        setDailyChallenge(challenge);
        await AsyncStorage.setItem(`dailyChallenge_${today}`, JSON.stringify(challenge));
      }
    } catch (error) {
      console.error('Error loading daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKeys = async () => {
    try {
      const saved = await AsyncStorage.getItem('keySystem');
      if (saved) {
        setKeys(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading keys:', error);
    }
  };

  const generateDailyChallenge = (): DailyChallenge => {
    const today = new Date();
    const puzzles: ChallengePuzzle[] = [
      {
        id: `puzzle_${today.getTime()}_1`,
        order: 1,
        difficulty: 'easy',
        type: 'standard',
        config: {
          aiDifficulty: 'easy',
          targetScore: 50,
        },
        keyReward: 1,
        bonusWords: [],
      },
      {
        id: `puzzle_${today.getTime()}_2`,
        order: 2,
        difficulty: 'medium',
        type: 'fixed_letters',
        config: {
          aiDifficulty: 'medium',
          fixedLetters: ['A', 'E', 'I', 'O', 'U'],
          targetScore: 100,
        },
        keyReward: 1,
        bonusWords: [],
      },
      {
        id: `puzzle_${today.getTime()}_3`,
        order: 3,
        difficulty: 'hard',
        type: 'minimum_words',
        config: {
          aiDifficulty: 'hard',
          minWordsRequired: 5,
          targetScore: 150,
        },
        keyReward: 2,
        bonusWords: [],
      },
    ];

    return {
      date: today,
      puzzles,
      keyReward: 4,
      bonusReward: {
        keys: 1,
        powerUps: [],
      },
    };
  };

  const handleStartPuzzle = (puzzle: ChallengePuzzle) => {
    const aiDifficulty = puzzle.config.aiDifficulty || 'easy';
    startGame('daily', aiDifficulty, {
      dailyPuzzleId: puzzle.id,
      dailyTargetScore: puzzle.config.targetScore,
    });
    navigation.navigate('Game' as never);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPuzzleTypeDescription = (type: string) => {
    switch (type) {
      case 'standard':
        return 'Standard word battle';
      case 'fixed_letters':
        return 'Must use specific letters';
      case 'minimum_words':
        return 'Play minimum number of words';
      case 'speed_round':
        return 'Complete within time limit';
      case 'word_hunt':
        return 'Find target words';
      default:
        return 'Special challenge';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading daily challenges...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!dailyChallenge) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No daily challenge available</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isToday =
    new Date(dailyChallenge.date).toDateString() === new Date().toDateString();
  const completedCount = keys.todayCompleted.filter(Boolean).length;
  const allCompleted = completedCount === 3;

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenges</Text>
        <Text style={styles.subtitle}>
          Complete all 3 puzzles to earn keys and unlock PvP Arena!
        </Text>
      </View>

      <View style={styles.keySystemCard}>
        <Text style={styles.keySystemTitle}>🔑 Key System</Text>
        <View style={styles.keyStats}>
          <View style={styles.keyStat}>
            <Text style={styles.keyStatLabel}>Current Keys</Text>
            <Text style={styles.keyStatValue}>{keys.currentKeys}</Text>
          </View>
          <View style={styles.keyStat}>
            <Text style={styles.keyStatLabel}>Total Earned</Text>
            <Text style={styles.keyStatValue}>{keys.totalKeysEarned}</Text>
          </View>
          <View style={styles.keyStat}>
            <Text style={styles.keyStatLabel}>Current Streak</Text>
            <Text style={styles.keyStatValue}>{keys.currentStreak} days</Text>
          </View>
          <View style={styles.keyStat}>
            <Text style={styles.keyStatLabel}>PvP Unlock</Text>
            <Text style={styles.keyStatValue}>
              {keys.currentKeys}/{keys.pvpUnlockCost}
            </Text>
          </View>
        </View>

        {keys.pvpUnlocked && (
          <View style={styles.unlockedBanner}>
            <Text style={styles.unlockedText}>🎉 PvP Arena Unlocked!</Text>
          </View>
        )}
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          Challenge Date: {new Date(dailyChallenge.date).toLocaleDateString()}
        </Text>
        {isToday && (
          <Text style={styles.todayBadge}>✓ Today's Challenge</Text>
        )}
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{completedCount}/3 Completed</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(completedCount / 3) * 100}%` }]}
          />
        </View>
        {allCompleted && <Text style={styles.completedEmoji}>🎉</Text>}
      </View>

      <View style={styles.puzzlesContainer}>
        {dailyChallenge.puzzles.map((puzzle) => {
          const isCompleted = keys.todayCompleted[puzzle.order - 1];

          return (
            <View
              key={puzzle.id}
              style={[
                styles.puzzleCard,
                isCompleted && styles.puzzleCardCompleted,
              ]}
            >
              <View style={styles.puzzleHeader}>
                <View>
                  <Text style={styles.puzzleTitle}>
                    Puzzle {puzzle.order} - {puzzle.difficulty.toUpperCase()}
                  </Text>
                  <Text style={styles.puzzleType}>
                    {getPuzzleTypeDescription(puzzle.type)}
                  </Text>
                </View>
                {isCompleted && <Text style={styles.completedCheck}>✓</Text>}
              </View>

              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(puzzle.difficulty) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: getDifficultyColor(puzzle.difficulty) },
                  ]}
                >
                  {puzzle.difficulty}
                </Text>
              </View>

              <View style={styles.puzzleInfo}>
                {puzzle.config.targetScore && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Target Score:</Text>
                    <Text style={styles.infoValue}>{puzzle.config.targetScore}</Text>
                  </View>
                )}
                {puzzle.config.minWordsRequired && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Minimum Words:</Text>
                    <Text style={styles.infoValue}>
                      {puzzle.config.minWordsRequired}
                    </Text>
                  </View>
                )}
                {puzzle.config.fixedLetters && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fixed Letters:</Text>
                    <Text style={styles.infoValue}>
                      {puzzle.config.fixedLetters.join(', ')}
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Key Reward:</Text>
                  <Text style={[styles.infoValue, styles.keyReward]}>
                    🔑 {puzzle.keyReward}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.startButton,
                  isCompleted && styles.startButtonCompleted,
                ]}
                onPress={() => handleStartPuzzle(puzzle)}
                disabled={isCompleted}
              >
                <Text style={styles.startButtonText}>
                  {isCompleted ? 'Completed ✓' : 'Start Puzzle'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {allCompleted && dailyChallenge.bonusReward && (
        <View style={styles.bonusCard}>
          <Text style={styles.bonusTitle}>🎁 Bonus Reward Unlocked!</Text>
          <Text style={styles.bonusText}>
            You've completed all 3 puzzles today! You earned:
          </Text>
          <Text style={styles.bonusItem}>
            🔑 {dailyChallenge.bonusReward.keys} bonus keys
          </Text>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
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
  keySystemCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#9d4edd',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6a1b9a',
  },
  keySystemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  keyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  keyStat: {
    flex: 1,
    minWidth: '45%',
  },
  keyStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  keyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  unlockedBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ffffff20',
    borderRadius: 8,
  },
  unlockedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  dateContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#b7b5b0',
    marginBottom: 4,
  },
  todayBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#b7b5b0',
  },
  progressValue: {
    fontSize: 14,
    color: '#b7b5b0',
    fontWeight: '600',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#212125',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  completedEmoji: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  puzzlesContainer: {
    padding: 20,
    gap: 16,
  },
  puzzleCard: {
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  puzzleCardCompleted: {
    opacity: 0.75,
    borderColor: '#10b981',
  },
  puzzleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  puzzleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e4e2',
    marginBottom: 4,
  },
  puzzleType: {
    fontSize: 12,
    color: '#b7b5b0',
  },
  completedCheck: {
    fontSize: 24,
    color: '#10b981',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  puzzleInfo: {
    marginBottom: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#b7b5b0',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e4e2',
  },
  keyReward: {
    color: '#f59e0b',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  startButtonCompleted: {
    backgroundColor: '#374151',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d97706',
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  bonusItem: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

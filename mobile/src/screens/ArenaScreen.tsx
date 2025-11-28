import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '../store/gameStore';
import { AIDifficulty, ArenaRank, PvEArena, JourneyProgress } from '../types';
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

const ARENA_RANKS: ArenaRank[] = [
  {
    name: 'Novice',
    difficulty: 'easy',
    winsRequired: 3,
    currentWins: 0,
    rewards: {
      perWin: { coins: 10 },
      rankUp: { coins: 50, powerUps: [] },
    },
  },
  {
    name: 'Apprentice',
    difficulty: 'medium',
    winsRequired: 5,
    currentWins: 0,
    rewards: {
      perWin: { coins: 20 },
      rankUp: { coins: 100, powerUps: [] },
    },
  },
  {
    name: 'Adept',
    difficulty: 'hard',
    winsRequired: 7,
    currentWins: 0,
    rewards: {
      perWin: { coins: 30 },
      rankUp: { coins: 200, powerUps: [] },
    },
  },
  {
    name: 'Expert',
    difficulty: 'very_hard',
    winsRequired: 10,
    currentWins: 0,
    rewards: {
      perWin: { coins: 50 },
      rankUp: { coins: 500, powerUps: [] },
    },
  },
  {
    name: 'Master',
    difficulty: 'nightmare',
    winsRequired: 15,
    currentWins: 0,
    rewards: {
      perWin: { coins: 100 },
      rankUp: { coins: 1000, powerUps: [] },
    },
  },
];

export default function ArenaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [arena, setArena] = useState<PvEArena>({
    difficulties: ARENA_RANKS,
    currentRank: 0,
    highestRankAchieved: 0,
  });
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [conditions, setConditions] = useState<{
    unlocked: boolean;
    minimumStars?: number;
    minimumLevel?: number;
  }>({ unlocked: false });

  const { startGame } = useGameStore();

  useEffect(() => {
    loadArenaProgress();
    loadJourneyProgress();
  }, []);

  const loadArenaProgress = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('arenaProgress');
      if (saved) {
        const parsed = JSON.parse(saved);
        setArena({
          ...parsed,
          difficulties: ARENA_RANKS.map((rank, index) => ({
            ...rank,
            currentWins: parsed.ranksWins?.[index] || 0,
          })),
        });
      }
    } catch (error) {
      console.error('Error loading arena progress:', error);
    }
  }, []);

  const loadJourneyProgress = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('journeyProgress');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProgress(parsed);

        const unlocked =
          parsed.pvEArenaUnlocked ||
          parsed.currentLevel >= 5 ||
          (parsed.totalStars || 0) >= 15;
        setConditions({
          unlocked,
          minimumStars: 15,
          minimumLevel: 5,
        });
      } else {
        setConditions({
          unlocked: false,
          minimumStars: 15,
          minimumLevel: 5,
        });
      }
    } catch (error) {
      console.error('Error loading journey progress:', error);
    }
  }, []);

  const handleStartArena = (difficulty: AIDifficulty) => {
    if (!conditions.unlocked) {
      Alert.alert(
        'Arena Locked',
        'Complete Journey Mode Level 5 or earn 15 stars to unlock.'
      );
      return;
    }

    startGame('arena', difficulty);
    navigation.navigate('Game' as never);
  };

  const getDifficultyColor = (difficulty: AIDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#3b82f6';
      case 'hard':
        return '#f59e0b';
      case 'very_hard':
        return '#f97316';
      case 'nightmare':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getRankEmoji = (rank: number) => {
    const emojis = ['🥉', '🥈', '🥇', '🏆', '👑'];
    return emojis[Math.min(rank, emojis.length - 1)];
  };

  const isRankUnlocked = (rankIndex: number) => {
    if (rankIndex === 0) return conditions.unlocked;

    const prevRank = arena.difficulties[rankIndex - 1];
    return prevRank.currentWins >= prevRank.winsRequired;
  };

  const getProgress = (wins: number, required: number) => {
    return Math.min((wins / required) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>⚔️ PvE Arena</Text>
          <Text style={styles.subtitle}>
            Battle AI opponents and climb the ranks! Each rank requires wins to progress.
          </Text>
        </View>

      {!conditions.unlocked && (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedTitle}>🔒 Arena Locked</Text>
          <Text style={styles.lockedText}>
            To unlock PvE Arena, you must meet one of these conditions:
          </Text>
          <View style={styles.lockedList}>
            <Text style={styles.lockedItem}>
              • Complete Journey Mode Level {conditions.minimumLevel}
            </Text>
            <Text style={styles.lockedItem}>
              • Earn {conditions.minimumStars} stars in Journey Mode
            </Text>
          </View>
          {progress && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Current Level: {progress.currentLevel} / {conditions.minimumLevel}
              </Text>
              <Text style={styles.progressText}>
                Stars Earned: {progress.totalStars || 0} / {conditions.minimumStars}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.goToJourneyButton}
            onPress={() => navigation.navigate('Journey' as never)}
          >
            <Text style={styles.goToJourneyText}>Go to Journey Mode</Text>
          </TouchableOpacity>
        </View>
      )}

      {conditions.unlocked && (
        <View style={styles.currentRankCard}>
          <Text style={styles.currentRankTitle}>
            {getRankEmoji(arena.currentRank)} Current Rank:{' '}
            {arena.difficulties[arena.currentRank]?.name || 'Novice'}
          </Text>
          <View style={styles.rankStats}>
            <View style={styles.rankStat}>
              <Text style={styles.rankStatLabel}>Current Rank</Text>
              <Text style={styles.rankStatValue}>
                {arena.difficulties[arena.currentRank]?.name || 'Novice'}
              </Text>
            </View>
            <View style={styles.rankStat}>
              <Text style={styles.rankStatLabel}>Highest Rank</Text>
              <Text style={styles.rankStatValue}>
                {arena.difficulties[arena.highestRankAchieved]?.name || 'Novice'}
              </Text>
            </View>
            <View style={styles.rankStat}>
              <Text style={styles.rankStatLabel}>Current Wins</Text>
              <Text style={styles.rankStatValue}>
                {arena.difficulties[arena.currentRank]?.currentWins || 0} /{' '}
                {arena.difficulties[arena.currentRank]?.winsRequired || 0}
              </Text>
            </View>
            <View style={styles.rankStat}>
              <Text style={styles.rankStatLabel}>Next Rank</Text>
              <Text style={styles.rankStatValue}>
                {arena.currentRank < arena.difficulties.length - 1
                  ? arena.difficulties[arena.currentRank + 1]?.name
                  : 'MAX'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.ranksContainer}>
        {arena.difficulties.map((rank, index) => {
          const isUnlocked = isRankUnlocked(index);
          const isCurrentRank = arena.currentRank === index;
          const isCompleted = rank.currentWins >= rank.winsRequired;
          const progressPercent = getProgress(rank.currentWins, rank.winsRequired);

          return (
            <View
              key={index}
              style={[
                styles.rankCard,
                isUnlocked && isCurrentRank && styles.rankCardCurrent,
                isUnlocked && isCompleted && !isCurrentRank && styles.rankCardCompleted,
                !isUnlocked && styles.rankCardLocked,
              ]}
            >
              <View style={styles.rankHeader}>
                <View style={styles.rankTitleContainer}>
                  <Text style={styles.rankEmoji}>{getRankEmoji(index)}</Text>
                  <View>
                    <Text style={styles.rankName}>{rank.name}</Text>
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(rank.difficulty) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(rank.difficulty) },
                        ]}
                      >
                        {rank.difficulty.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                {isCurrentRank && (
                  <Text style={styles.currentBadge}>CURRENT</Text>
                )}
                {isCompleted && !isCurrentRank && (
                  <Text style={styles.completedBadge}>✓</Text>
                )}
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>
                    {rank.currentWins} / {rank.winsRequired} wins
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.rewardsContainer}>
                <Text style={styles.rewardsTitle}>Rewards:</Text>
                <Text style={styles.rewardItem}>
                  Per Win: 🪙 {rank.rewards.perWin.coins} coins
                </Text>
                <Text style={styles.rewardItem}>
                  Rank Up: 🪙 {rank.rewards.rankUp.coins} coins
                </Text>
              </View>

              {isUnlocked ? (
                <TouchableOpacity
                  style={[
                    styles.fightButton,
                    isCurrentRank && styles.fightButtonCurrent,
                  ]}
                  onPress={() => handleStartArena(rank.difficulty)}
                  disabled={!conditions.unlocked}
                >
                  <Text style={styles.fightButtonText}>
                    {isCurrentRank
                      ? 'Fight Now'
                      : isCompleted
                      ? 'Replay'
                      : 'Challenge'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.lockedMessage}>
                  <Text style={styles.lockedMessageText}>
                    Complete previous rank to unlock
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>📜 Arena Rules</Text>
        <View style={styles.rulesList}>
          <Text style={styles.ruleItem}>• Win matches to progress through ranks</Text>
          <Text style={styles.ruleItem}>
            • Each rank requires a certain number of wins to advance
          </Text>
          <Text style={styles.ruleItem}>• Earn coins and rewards for each win</Text>
          <Text style={styles.ruleItem}>
            • Rank up rewards are earned once per rank
          </Text>
          <Text style={styles.ruleItem}>
            • Higher ranks offer better rewards but tougher opponents
          </Text>
          <Text style={styles.ruleItem}>
            • Your progress is saved - you can resume anytime
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...textStyles.h1,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  lockedCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f59e0b20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
  },
  lockedText: {
    fontSize: 14,
    color: '#b7b5b0',
    marginBottom: 12,
  },
  lockedList: {
    marginBottom: 16,
  },
  lockedItem: {
    fontSize: 14,
    color: '#b7b5b0',
    marginBottom: 4,
  },
  progressInfo: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#b7b5b0',
    marginBottom: 4,
  },
  goToJourneyButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  goToJourneyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentRankCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#9d4edd',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6a1b9a',
  },
  currentRankTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  rankStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rankStat: {
    flex: 1,
    minWidth: '45%',
  },
  rankStatLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  rankStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  ranksContainer: {
    padding: 20,
    gap: 16,
  },
  rankCard: {
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  rankCardCurrent: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  rankCardCompleted: {
    borderColor: '#10b981',
  },
  rankCardLocked: {
    opacity: 0.5,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rankTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e4e2',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  currentBadge: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 12,
  },
  completedBadge: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#b7b5b0',
  },
  progressValue: {
    fontSize: 12,
    color: '#b7b5b0',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#212125',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  rewardsContainer: {
    marginBottom: 12,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e4e2',
    marginBottom: 8,
  },
  rewardItem: {
    fontSize: 12,
    color: '#b7b5b0',
    marginBottom: 4,
  },
  fightButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  fightButtonCurrent: {
    backgroundColor: '#1d4ed8',
  },
  fightButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedMessage: {
    padding: 12,
    alignItems: 'center',
  },
  lockedMessageText: {
    fontSize: 12,
    color: '#6b7280',
  },
  rulesCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f5d62',
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e4e2',
    marginBottom: 12,
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    fontSize: 14,
    color: '#b7b5b0',
    lineHeight: 20,
  },
});

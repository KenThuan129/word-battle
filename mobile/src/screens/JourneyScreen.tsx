import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '../store/gameStore';
import { JOURNEY_LEVELS, getUnlockedLevels, getLevel } from '../lib/journeyLevels';
import { JourneyProgress } from '../types';
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

export default function JourneyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [progress, setProgress] = useState<JourneyProgress>({
    currentLevel: 1,
    totalStars: 0,
    levelStars: {},
    unlockedLevels: [1],
    pvEArenaUnlocked: false,
  });
  const { startGame } = useGameStore();

  // Reload progress when screen comes into focus (e.g., returning from game)
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  const loadProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem('journeyProgress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        const unlocked = getUnlockedLevels(
          Object.keys(parsed.levelStars || {}).map(Number).filter(id => parsed.levelStars[id] > 0)
        );
        setProgress({
          ...parsed,
          unlockedLevels: unlocked.length > 0 ? unlocked : [1],
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleStartLevel = (levelId: number) => {
    const level = getLevel(levelId);
    if (!level) return;

    if (!progress.unlockedLevels.includes(levelId)) {
      Alert.alert('Level Locked', 'Complete previous levels to unlock this one.');
      return;
    }

    startGame('journey', level.aiDifficulty, { journeyLevelId: level.id });
    navigation.navigate('Game' as never);
  };

  const getStarDisplay = (stars: number) => {
    return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      case 'very_hard':
        return '#dc2626';
      case 'nightmare':
        return '#991b1b';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Journey Mode</Text>
          <Text style={styles.subtitle}>
            Progress through levels and learn new vocabulary. Earn stars to unlock more levels!
          </Text>
        </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Level</Text>
          <Text style={styles.statValue}>{progress.currentLevel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Stars</Text>
          <Text style={styles.statValue}>{progress.totalStars}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Levels Unlocked</Text>
          <Text style={styles.statValue}>{progress.unlockedLevels.length}</Text>
        </View>
      </View>

      <View style={styles.levelsContainer}>
        {JOURNEY_LEVELS.map((level) => {
          const isUnlocked = progress.unlockedLevels.includes(level.id);
          const stars = progress.levelStars[level.id] || 0;

          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                !isUnlocked && styles.levelCardLocked,
              ]}
              onPress={() => handleStartLevel(level.id)}
              disabled={!isUnlocked}
            >
              <View style={styles.levelHeader}>
                <View style={styles.levelTitleContainer}>
                  <Text style={styles.levelNumber}>Level {level.id}</Text>
                  <Text style={styles.levelName}>{level.name}</Text>
                </View>
                <Text style={styles.starDisplay}>{getStarDisplay(stars)}</Text>
              </View>

              <Text style={styles.levelDescription}>{level.description}</Text>

              <View style={styles.levelTags}>
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: getDifficultyColor(level.aiDifficulty) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: getDifficultyColor(level.aiDifficulty) },
                    ]}
                  >
                    {level.aiDifficulty.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                {level.targetScore && (
                  <View style={[styles.tag, { backgroundColor: '#3b82f620' }]}>
                    <Text style={[styles.tagText, { color: '#3b82f6' }]}>
                      Score: {level.targetScore}
                    </Text>
                  </View>
                )}
                {level.turnLimit && (
                  <View style={[styles.tag, { backgroundColor: '#f59e0b20' }]}>
                    <Text style={[styles.tagText, { color: '#f59e0b' }]}>
                      {level.turnLimit} turns
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.playButton,
                  !isUnlocked && styles.playButtonDisabled,
                ]}
                onPress={() => handleStartLevel(level.id)}
                disabled={!isUnlocked}
              >
                <Text style={styles.playButtonText}>
                  {isUnlocked ? 'Play' : 'Locked'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {progress.pvEArenaUnlocked && (
        <View style={styles.unlockBanner}>
          <Text style={styles.unlockBannerTitle}>⚔️ PvE Arena Unlocked!</Text>
          <Text style={styles.unlockBannerText}>
            Congratulations! You've unlocked PvE Arena mode. Test your skills against challenging AI opponents.
          </Text>
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => navigation.navigate('Arena' as never)}
          >
            <Text style={styles.unlockButtonText}>Enter Arena</Text>
          </TouchableOpacity>
        </View>
      )}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    ...textStyles.body,
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  statValue: {
    ...textStyles.mono,
    fontSize: 24,
    fontWeight: '600',
    color: colors.accent,
  },
  levelsContainer: {
    padding: 20,
    gap: 16,
  },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelCardLocked: {
    opacity: 0.5,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  levelTitleContainer: {
    flex: 1,
  },
  levelNumber: {
    ...textStyles.mono,
    fontSize: 12,
    color: colors.ancientVerdigrisGlow,
    marginBottom: 4,
  },
  levelName: {
    ...textStyles.h3,
    fontSize: 18,
  },
  starDisplay: {
    fontSize: 18,
  },
  levelDescription: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 12,
    lineHeight: 20,
  },
  levelTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    ...textStyles.mono,
    fontSize: 11,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: colors.muted,
  },
  playButtonText: {
    ...textStyles.body,
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  unlockBanner: {
    margin: 20,
    padding: 20,
    backgroundColor: colors.accentPurple,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accentPurpleDeep,
  },
  unlockBannerTitle: {
    ...textStyles.h3,
    fontSize: 20,
    color: colors.foreground,
    marginBottom: 8,
  },
  unlockBannerText: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 16,
    lineHeight: 20,
  },
  unlockButton: {
    backgroundColor: colors.foreground,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  unlockButtonText: {
    ...textStyles.body,
    color: colors.accentPurple,
    fontSize: 16,
    fontWeight: '600',
  },
});

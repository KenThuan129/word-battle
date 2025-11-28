import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Battle</Text>
        <Text style={styles.subtitle}>
          A vocabulary-learning word-building strategy game
        </Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Journey' as never)}
        >
          <Text style={styles.cardEmoji}>🎯</Text>
          <Text style={styles.cardTitle}>Journey Mode</Text>
          <Text style={styles.cardDescription}>
            Campaign with story-driven vocabulary learning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Arena' as never)}
        >
          <Text style={styles.cardEmoji}>⚔️</Text>
          <Text style={styles.cardTitle}>PvE Arena</Text>
          <Text style={styles.cardDescription}>
            Fight AI opponents with increasing difficulty
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Daily' as never)}
        >
          <Text style={styles.cardEmoji}>📅</Text>
          <Text style={styles.cardTitle}>Daily Challenges</Text>
          <Text style={styles.cardDescription}>
            3 puzzles daily to earn keys
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('WordBank' as never)}
        >
          <Text style={styles.cardEmoji}>📚</Text>
          <Text style={styles.cardTitle}>Word Bank</Text>
          <Text style={styles.cardDescription}>
            View your collected vocabulary
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.quickPlayButton}
        onPress={() => navigation.navigate('Game' as never)}
      >
        <Text style={styles.quickPlayText}>Quick Play</Text>
      </TouchableOpacity>
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
  content: {
    padding: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    ...textStyles.h1,
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    ...textStyles.body,
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: 4,
  },
  cardDescription: {
    ...textStyles.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  quickPlayButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  quickPlayText: {
    ...textStyles.body,
    color: colors.primaryForeground,
    fontSize: 18,
    fontWeight: '600',
  },
});


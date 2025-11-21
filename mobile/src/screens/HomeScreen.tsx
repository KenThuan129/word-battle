import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  quickPlayButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  quickPlayText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


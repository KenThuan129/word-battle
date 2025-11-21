import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Letter } from '../../types';

interface PlayerHandProps {
  letters: Letter[];
  onLetterPress: (letter: Letter, index: number) => void;
  selectedIndices?: number[];
  disabled?: boolean;
  title?: string;
}

export default function PlayerHand({
  letters,
  onLetterPress,
  selectedIndices = [],
  disabled = false,
  title = 'Your Hand',
}: PlayerHandProps) {
  const isSelected = (index: number) => {
    return selectedIndices.includes(index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.hand}>
          {letters.map((letter, index) => {
            const selected = isSelected(index);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.letterTile,
                  selected && styles.selectedTile,
                  disabled && styles.disabledTile,
                ]}
                onPress={() => !disabled && onLetterPress(letter, index)}
                disabled={disabled}
              >
                <Text style={styles.letterChar}>{letter.char}</Text>
                <Text style={styles.letterPoints}>{letter.points}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const TILE_SIZE = 50;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  scrollView: {
    maxHeight: TILE_SIZE + 20,
  },
  hand: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
  },
  letterTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTile: {
    backgroundColor: '#4a90e2',
    borderColor: '#2e5a8a',
    transform: [{ scale: 1.1 }],
  },
  disabledTile: {
    opacity: 0.5,
  },
  letterChar: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  letterPoints: {
    fontSize: 10,
    color: '#666',
    marginTop: -2,
  },
  selectedLetterPoints: {
    color: '#fff',
  },
});


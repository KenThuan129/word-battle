import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Letter } from '../../types';
import { colors, textStyles } from '../../lib/theme';

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
  const { width: screenWidth } = Dimensions.get('window');
  const tileSize = useMemo(() => {
    const maxTilesPerRow = Math.min(letters.length, 7);
    const gutter = 12;
    const usableWidth = screenWidth - 40;
    const rawSize = (usableWidth - gutter * (maxTilesPerRow - 1)) / maxTilesPerRow;
    return Math.max(44, Math.min(rawSize, 64));
  }, [letters.length, screenWidth]);

  const isSelected = (index: number) => {
    return selectedIndices.includes(index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hand}>
          {letters.map((letter, index) => {
            const selected = isSelected(index);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.letterTile,
                  { width: tileSize, height: tileSize },
                  selected && styles.selectedTile,
                  disabled && styles.disabledTile,
                ]}
                onPress={() => !disabled && onLetterPress(letter, index)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[styles.letterChar, selected && styles.selectedLetterChar]}>
                  {letter.char}
                </Text>
                <Text style={[styles.letterPoints, selected && styles.selectedLetterPoints]}>
                  {letter.points}
                </Text>
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
    padding: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: {
    ...textStyles.h3,
    fontSize: 13,
    marginBottom: 10,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: TILE_SIZE + 30,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  hand: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  letterTile: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTile: {
    backgroundColor: colors.primary,
    borderColor: colors.accent,
    borderWidth: 2.5,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  disabledTile: {
    opacity: 0.4,
  },
  letterChar: {
    ...textStyles.h3,
    fontSize: 20,
    color: colors.foreground,
    fontWeight: '700',
  },
  selectedLetterChar: {
    color: colors.primaryForeground,
  },
  letterPoints: {
    ...textStyles.mono,
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: -3,
    fontWeight: '600',
  },
  selectedLetterPoints: {
    color: colors.primaryForeground,
  },
});


import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Board, Position } from '../../types';
import { colors, textStyles } from '../../lib/theme';

interface GameBoardProps {
  board: Board;
  onCellPress: (position: Position) => void;
  selectedCells?: Position[];
  disabled?: boolean;
}

export default function GameBoard({
  board,
  onCellPress,
  selectedCells = [],
  disabled = false,
}: GameBoardProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const boardWidth = board.width || board.size;
  const boardHeight = board.height || board.size;
  const maxBoardPixelSize = Math.min(screenWidth - 32, 420);

  const CELL_SIZE = useMemo(() => {
    const calculated = Math.floor(maxBoardPixelSize / boardWidth) - 4;
    return Math.max(28, Math.min(calculated, 64));
  }, [boardWidth, maxBoardPixelSize]);

  const CELL_STYLE = useMemo(
    () => ({
      width: CELL_SIZE,
      height: CELL_SIZE,
    }),
    [CELL_SIZE]
  );

  const isSelected = (row: number, col: number) => {
    return selectedCells.some(pos => pos.row === row && pos.col === col);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.board,
          { padding: Math.max(4, Math.floor(CELL_SIZE * 0.08)) },
        ]}
      >
        {board.cells.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const selected = isSelected(rowIndex, colIndex);
              const isCenter = cell.isCenter;
              const isCorrupted = cell.isCorrupted;

              return (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    CELL_STYLE,
                    selected && styles.selectedCell,
                    isCenter && styles.centerCell,
                    isCorrupted && styles.corruptedCell,
                    disabled && styles.disabledCell,
                  ]}
                  onPress={() => !disabled && !isCorrupted && onCellPress({ row: rowIndex, col: colIndex })}
                  disabled={disabled || isCorrupted}
                  activeOpacity={0.7}
                >
                  {cell.letter ? (
                    <View style={styles.letterContainer}>
                      <Text style={styles.letter}>{cell.letter.char}</Text>
                      <Text style={styles.points}>{cell.letter.points}</Text>
                    </View>
                  ) : (
                    isCenter && <View style={styles.centerDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  board: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: 4,
  },
  selectedCell: {
    backgroundColor: colors.primary,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  centerCell: {
    backgroundColor: colors.accentAmber + '20',
    borderColor: colors.accentAmber,
  },
  corruptedCell: {
    backgroundColor: colors.muted,
    borderColor: colors.destructive,
    opacity: 0.6,
  },
  disabledCell: {
    opacity: 0.5,
  },
  letterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...textStyles.h3,
    fontSize: 16,
    color: colors.foreground,
  },
  points: {
    ...textStyles.mono,
    fontSize: 9,
    color: colors.mutedForeground,
    marginTop: -2,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.destructive,
  },
});


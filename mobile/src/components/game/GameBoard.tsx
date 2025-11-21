import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Board, Position, Cell } from '../../types';

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
  const isSelected = (row: number, col: number) => {
    return selectedCells.some(pos => pos.row === row && pos.col === col);
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {board.cells.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const selected = isSelected(rowIndex, colIndex);
              const isCenter = cell.isCenter;
              
              return (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    selected && styles.selectedCell,
                    isCenter && styles.centerCell,
                    disabled && styles.disabledCell,
                  ]}
                  onPress={() => !disabled && onCellPress({ row: rowIndex, col: colIndex })}
                  disabled={disabled}
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

const CELL_SIZE = 40;
const BOARD_SIZE = 8;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  board: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: 4,
  },
  selectedCell: {
    backgroundColor: '#4a90e2',
    borderColor: '#2e5a8a',
    borderWidth: 2,
  },
  centerCell: {
    backgroundColor: '#fff8dc',
  },
  disabledCell: {
    opacity: 0.5,
  },
  letterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  points: {
    fontSize: 10,
    color: '#666',
    marginTop: -2,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
});


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import { useGameStore } from '../store/gameStore';
import { Position, Letter } from '../types';

export default function GameScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { game, currentMove, startGame, selectLetter, selectCell, submitMove, clearMove } = useGameStore();
  
  useEffect(() => {
    // Start game if none is active
    if (!game) {
      startGame('arena', 'easy');
    }
  }, [game, startGame]);

  const handleCellPress = (position: Position) => {
    if (!game || !currentMove) return;
    selectCell(position);
  };

  const handleLetterPress = (letter: Letter, index: number) => {
    if (!game) return;
    selectLetter(letter, index);
  };

  const handleSubmitMove = () => {
    if (!game || !currentMove) {
      Alert.alert('Error', 'No move to submit');
      return;
    }
    
    const result = submitMove();
    if (!result.success) {
      Alert.alert('Invalid Move', result.error || 'Please check your word placement');
    }
  };

  const handleClearMove = () => {
    clearMove();
  };

  // Show loading while game initializes
  if (!game) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Starting game...</Text>
        </View>
      </View>
    );
  }

  const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
  const aiPlayer = game.players.find(p => p.isAI);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Word Battle</Text>
        </View>

        {/* Scores */}
        <View style={styles.scores}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>You</Text>
            <Text style={styles.scoreValue}>{currentPlayer?.score || 0}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>{aiPlayer?.name || 'AI'}</Text>
            <Text style={styles.scoreValue}>{aiPlayer?.score || 0}</Text>
          </View>
        </View>

        {/* Turn Indicator */}
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            {currentPlayer?.isAI ? "AI's Turn..." : "Your Turn"}
          </Text>
        </View>

        {/* Game Board */}
        <GameBoard
          board={game.board}
          onCellPress={handleCellPress}
          selectedCells={currentMove?.positions || []}
          disabled={currentPlayer?.isAI || false}
        />

        {/* Current Word */}
        {currentMove && currentMove.word && (
          <View style={styles.currentWord}>
            <Text style={styles.currentWordLabel}>Current Word:</Text>
            <Text style={styles.currentWordText}>{currentMove.word}</Text>
            <TouchableOpacity onPress={handleClearMove} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Player Hand */}
        {currentPlayer && !currentPlayer.isAI && (
          <PlayerHand
            letters={currentPlayer.hand}
            onLetterPress={handleLetterPress}
            selectedIndices={currentMove?.selectedLetterIndices || []}
            disabled={currentPlayer.isAI}
          />
        )}

        {/* Action Buttons */}
        {currentPlayer && !currentPlayer.isAI && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleSubmitMove}
              style={[styles.submitButton, (!currentMove || currentMove.word.length === 0) && styles.disabledButton]}
              disabled={!currentMove || currentMove.word.length === 0}
            >
              <Text style={styles.submitButtonText}>Submit Move</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator for AI Turn */}
        {currentPlayer?.isAI && (
          <View style={styles.aiThinking}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.aiThinkingText}>AI is thinking...</Text>
          </View>
        )}

        {/* Game Over */}
        {game.status === 'finished' && (
          <View style={styles.gameOver}>
            <Text style={styles.gameOverTitle}>
              {game.winnerId === currentPlayer?.id ? '🎉 You Win!' : '😔 You Lost'}
            </Text>
            <Text style={styles.gameOverText}>
              Final Score: {currentPlayer?.score || 0} - {aiPlayer?.score || 0}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#4a90e2',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  turnIndicator: {
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 8,
  },
  turnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
  },
  currentWord: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  currentWordLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  currentWordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 12,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiThinking: {
    padding: 24,
    alignItems: 'center',
  },
  aiThinkingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  gameOver: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  gameOverText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  placeholderNote: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});

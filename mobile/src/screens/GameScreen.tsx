import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, textStyles } from '../lib/theme';
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import { useGameStore } from '../store/gameStore';
import { getLevel, calculateStars, getUnlockedLevels } from '../lib/journeyLevels';
import { Position, Letter, Player, JourneyProgress } from '../types';

export default function GameScreen() {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const { 
    game, 
    currentMove, 
    startGame, 
    selectLetter, 
    selectCell, 
    submitMove, 
    clearMove,
    exchangeVowel,
    makeAIMove,
    endGame,
  } = useGameStore();
  
  // Automatically trigger AI move when it's AI's turn
  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    
    const currentPlayerForAI = game.players.find(p => p.id === game.currentPlayerId);
    if (currentPlayerForAI?.isAI) {
      const levelConfig = game.mode === 'journey' && game.journeyLevelId 
        ? getLevel(game.journeyLevelId) 
        : null;
      if (levelConfig?.hasAI !== false) {
        const timer = setTimeout(() => {
          makeAIMove();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [game?.currentPlayerId, game?.status, game?.players, game?.journeyLevelId, makeAIMove]);

  // Handle game end and save progress
  useEffect(() => {
    if (game?.status === 'finished' && game.mode === 'journey' && game.journeyLevelId) {
      handleJourneyGameEnd();
    } else if (game?.status === 'finished' && game.mode === 'arena') {
      // Handle arena game end - could save arena progress here
    } else if (game?.status === 'finished' && game.mode === 'daily') {
      // Handle daily challenge end - could save daily progress here
    }
  }, [game?.status, game?.mode, game?.journeyLevelId]);

  const handleJourneyGameEnd = async () => {
    if (!game || !game.journeyLevelId) return;

    const level = getLevel(game.journeyLevelId);
    if (!level) return;

    const player = game.players.find(p => !p.isAI);
    const won = game.winnerId === player?.id;
    const playerScore = player?.score || 0;
    const lettersRemaining = player?.hand.length || 0;
    const wordCount = game.wordCount;
    const turnsUsed = game.turn;

    const stars = calculateStars(
      level,
      won,
      lettersRemaining,
      playerScore,
      wordCount,
      turnsUsed
    );

    try {
      const savedProgress = await AsyncStorage.getItem('journeyProgress');
      let progress: JourneyProgress = {
        currentLevel: 1,
        totalStars: 0,
        levelStars: {},
        unlockedLevels: [1],
        pvEArenaUnlocked: false,
      };

      if (savedProgress) {
        progress = {
          ...JSON.parse(savedProgress),
          levelStars: JSON.parse(savedProgress).levelStars || {},
        };
      }

      const currentStars = progress.levelStars[game.journeyLevelId] || 0;
      
      // Always save the level attempt (even with 0 stars), but only update stars if improved
      if (stars > currentStars) {
        progress.levelStars[game.journeyLevelId] = stars;
      } else if (currentStars === 0 && stars === 0) {
        // Mark level as attempted even if no stars earned
        progress.levelStars[game.journeyLevelId] = 0;
      }
      
      // Recalculate total stars
      progress.totalStars = Object.values(progress.levelStars).reduce(
        (sum, s) => sum + s,
        0
      );

      // Update current level if needed
      if (game.journeyLevelId >= progress.currentLevel) {
        progress.currentLevel = game.journeyLevelId + 1;
      }

      // Unlock PvE Arena if condition met
      if (level.unlocksPvEArena && stars > 0) {
        progress.pvEArenaUnlocked = true;
      }

      // Calculate unlocked levels based on completed levels (stars > 0)
      progress.unlockedLevels = getUnlockedLevels(
        Object.keys(progress.levelStars)
          .map(Number)
          .filter(levelId => progress.levelStars[levelId] > 0)
      );

      // Always save progress
      await AsyncStorage.setItem('journeyProgress', JSON.stringify(progress));

      // Show result and navigate back
      setTimeout(() => {
        Alert.alert(
          won ? '🎉 Victory!' : '😔 Defeat',
          `You earned ${stars} star${stars !== 1 ? 's' : ''}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                endGame();
                navigation.goBack();
              },
            },
          ]
        );
      }, 1000);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleCellPress = (position: Position) => {
    if (!game) return;
    selectCell(position);
  };

  const handleLetterPress = (letter: Letter, index: number) => {
    if (!game) return;
    selectLetter(letter, index);
  };

  const handleSubmitMove = async () => {
    if (!game || !currentMove) {
      Alert.alert('Error', 'No move to submit');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitMove();
      
      if (!result.success && result.error) {
        Alert.alert('Invalid Move', result.error || 'Please check your word placement');
      }
    } catch (error) {
      console.error('Error submitting move:', error);
      Alert.alert('Error', 'Failed to submit move. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearMove = () => {
    clearMove();
  };

  const handleExchangeVowel = () => {
    const result = exchangeVowel();
    if (!result.success && result.error) {
      Alert.alert('Exchange Failed', result.error);
    }
  };

  if (!game) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Starting game...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);
  const aiPlayer = game.players.find(p => p.isAI);
  const humanPlayer = game.players.find(p => !p.isAI);
  const isBossBattle = game.journeyLevelId === 5 || game.journeyLevelId === 10;
  const levelConfig = useMemo(() => {
    if (game.mode === 'journey' && game.journeyLevelId) {
      return getLevel(game.journeyLevelId);
    }
    return null;
  }, [game.mode, game.journeyLevelId]);

  const renderHpBar = (player: Player | undefined) => {
    if (!player || player.hp === undefined) {
      return null;
    }
    const maxHp = player.isAI
      ? (game.journeyLevelId === 5 ? 65 : game.journeyLevelId === 10 ? 75 : 200)
      : 100;
    const percentage = Math.max(0, Math.min(100, (player.hp / maxHp) * 100));
    const hpColor =
      percentage > 60 ? '#22c55e' : percentage > 30 ? '#facc15' : '#f87171';

    return (
      <View style={styles.hpContainer}>
        <View style={styles.hpMeta}>
          <Text style={styles.hpLabel}>HP</Text>
          <Text style={styles.hpValue}>
            {player.hp} / {maxHp}
          </Text>
        </View>
        <View style={styles.hpBar}>
          <View style={[styles.hpFill, { width: `${percentage}%`, backgroundColor: hpColor }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Word Battle</Text>
          <TouchableOpacity onPress={() => setShowPauseModal(true)} style={styles.pauseButton}>
            <Text style={styles.pauseButtonText}>⏸</Text>
          </TouchableOpacity>
        </View>

        {game.lastEvent?.type === 'checkmate' && (
          <View style={styles.checkmateBanner}>
            <Text style={styles.checkmateText}>{game.lastEvent.message}</Text>
          </View>
        )}

        <View style={styles.scores}>
          {[humanPlayer, aiPlayer].map((player, idx) => (
            <View
              key={player?.id || idx}
              style={[
                styles.scoreCard,
                player?.id === game.currentPlayerId && styles.activeTurnCard,
              ]}
            >
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreLabel}>{player?.name || (idx === 0 ? 'You' : 'Opponent')}</Text>
                <Text style={styles.scoreValue}>{player?.score || 0}</Text>
              </View>
              <Text style={styles.metaText}>Letters: {player?.hand.length ?? 0}</Text>
              {isBossBattle && renderHpBar(player)}
            </View>
          ))}
        </View>

        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            {currentPlayer?.isAI ? "AI's Turn..." : "Your Turn"}
          </Text>
        </View>

        <GameBoard
          board={game.board}
          onCellPress={handleCellPress}
          selectedCells={currentMove?.positions || []}
          disabled={currentPlayer?.isAI || false}
        />

        {currentMove && currentMove.word && (
          <View style={styles.currentWord}>
            <View>
              <Text style={styles.currentWordLabel}>Current Word</Text>
              <Text style={styles.currentWordText}>{currentMove.word}</Text>
              <Text style={styles.currentWordMeta}>
                Direction: {currentMove.direction ?? 'pending'} • Tiles: {currentMove.positions.length}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearMove} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}


        {currentPlayer && !currentPlayer.isAI && (
          <PlayerHand
            letters={currentPlayer.hand}
            onLetterPress={handleLetterPress}
            selectedIndices={currentMove?.selectedLetterIndices || []}
            disabled={currentPlayer.isAI}
          />
        )}

        {currentPlayer && !currentPlayer.isAI && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleExchangeVowel}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Exchange Consonant → Vowel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmitMove}
              style={[
                styles.submitButton,
                (!currentMove || currentMove.word.length === 0 || isSubmitting) && styles.disabledButton,
              ]}
              disabled={!currentMove || currentMove.word.length === 0 || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Move'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentPlayer?.isAI && (
          <View style={styles.aiThinking}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.aiThinkingText}>AI is thinking...</Text>
          </View>
        )}


        {isBossBattle && (
          <View style={styles.sigilCard}>
            <Text style={styles.sigilTitle}>Sigil Progress</Text>
            <Text style={styles.sigilMeta}>Words built: {game.sigilCount ?? 0}</Text>
            {game.activeSigilEffects?.length ? (
              game.activeSigilEffects.map((effect, idx) => (
                <Text key={idx} style={styles.sigilEffect}>
                  • {effect.type} ({effect.turnsRemaining} turns remaining, +{effect.damage} dmg)
                </Text>
              ))
            ) : (
              <Text style={styles.sigilEffect}>No active sigil effects.</Text>
            )}
          </View>
        )}

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

      {/* Pause Modal with Objective */}
      <Modal
        visible={showPauseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPauseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⏸ Paused</Text>
              <TouchableOpacity onPress={() => setShowPauseModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {levelConfig && (
              <View style={styles.modalObjective}>
                <Text style={styles.modalObjectiveTitle}>
                  Objective • {levelConfig.name}
                </Text>
                <Text style={styles.modalObjectiveDesc}>{levelConfig.description}</Text>
                {levelConfig.targetScore && (
                  <Text style={styles.modalObjectiveMeta}>Target Score: {levelConfig.targetScore}</Text>
                )}
                {levelConfig.turnLimit && (
                  <Text style={styles.modalObjectiveMeta}>Turn Limit: {levelConfig.turnLimit}</Text>
                )}
                {levelConfig.targetWord && (
                  <Text style={styles.modalObjectiveMeta}>Build Word: {levelConfig.targetWord}</Text>
                )}
                {levelConfig.targetWordCount && (
                  <Text style={styles.modalObjectiveMeta}>Target Words: {levelConfig.targetWordCount}</Text>
                )}
              </View>
            )}

            <View style={styles.modalStats}>
              <Text style={styles.modalStatsTitle}>Current Stats</Text>
              <View style={styles.modalStatsRow}>
                <Text style={styles.modalStatsLabel}>Turn:</Text>
                <Text style={styles.modalStatsValue}>{game.turn}</Text>
              </View>
              {humanPlayer && (
                <>
                  <View style={styles.modalStatsRow}>
                    <Text style={styles.modalStatsLabel}>Your Score:</Text>
                    <Text style={styles.modalStatsValue}>{humanPlayer.score}</Text>
                  </View>
                  <View style={styles.modalStatsRow}>
                    <Text style={styles.modalStatsLabel}>Words Built:</Text>
                    <Text style={styles.modalStatsValue}>{game.wordCount || 0}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowPauseModal(false);
                  navigation.goBack();
                }}
                style={styles.modalQuitButton}
              >
                <Text style={styles.modalQuitButtonText}>Quit Game</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPauseModal(false)}
                style={styles.modalResumeButton}
              >
                <Text style={styles.modalResumeButtonText}>Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkmateBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  checkmateText: {
    ...textStyles.body,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#166534',
  },
  backButton: {
    marginRight: 12,
  },
  pauseButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  pauseButtonText: {
    ...textStyles.body,
    fontSize: 20,
    color: colors.primary,
  },
  backText: {
    ...textStyles.body,
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    ...textStyles.h3,
    fontSize: 20,
  },
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTurnCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.muted,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    ...textStyles.body,
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  scoreValue: {
    ...textStyles.mono,
    fontSize: 24,
    fontWeight: '600',
    color: colors.accent,
  },
  metaText: {
    ...textStyles.body,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  turnIndicator: {
    padding: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  turnText: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  currentWord: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.card,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentWordLabel: {
    ...textStyles.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  currentWordText: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.foreground,
  },
  currentWordMeta: {
    ...textStyles.body,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  clearButton: {
    backgroundColor: colors.destructive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    ...textStyles.body,
    color: colors.destructiveForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  objectiveCard: {
    backgroundColor: colors.card,
    marginTop: 8,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  objectiveTitle: {
    ...textStyles.h3,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 6,
  },
  objectiveDesc: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.foreground,
    marginBottom: 6,
  },
  objectiveMeta: {
    ...textStyles.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  actions: {
    padding: 12,
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.statusJade,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  submitButtonText: {
    ...textStyles.body,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  aiThinking: {
    padding: 20,
    alignItems: 'center',
  },
  aiThinkingText: {
    ...textStyles.body,
    marginTop: 12,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  logContainer: {
    marginTop: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logTitle: {
    ...textStyles.h3,
    fontSize: 16,
    marginBottom: 8,
  },
  logPlaceholder: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  logItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logPlayer: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  logScore: {
    ...textStyles.body,
    color: colors.accent,
    fontWeight: '600',
  },
  logWord: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.foreground,
  },
  logMeta: {
    ...textStyles.body,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  sigilCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sigilTitle: {
    ...textStyles.h3,
    fontSize: 16,
    marginBottom: 6,
  },
  sigilMeta: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  sigilEffect: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.foreground,
    marginTop: 4,
  },
  gameOver: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameOverTitle: {
    ...textStyles.h2,
    fontSize: 22,
    marginBottom: 8,
  },
  gameOverText: {
    ...textStyles.body,
    fontSize: 15,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    ...textStyles.body,
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    ...textStyles.body,
    marginTop: 16,
    fontSize: 16,
    color: colors.mutedForeground,
  },
  hpContainer: {
    marginTop: 8,
  },
  hpMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hpLabel: {
    ...textStyles.body,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  hpValue: {
    ...textStyles.body,
    fontSize: 11,
    color: colors.foreground,
  },
  hpBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...textStyles.h2,
    fontSize: 24,
  },
  closeButton: {
    padding: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  closeButtonText: {
    ...textStyles.body,
    fontSize: 20,
    color: colors.mutedForeground,
  },
  modalObjective: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalObjectiveTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.primary,
    marginBottom: 8,
  },
  modalObjectiveDesc: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalObjectiveMeta: {
    ...textStyles.body,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  modalStats: {
    marginBottom: 20,
  },
  modalStatsTitle: {
    ...textStyles.h3,
    fontSize: 16,
    marginBottom: 12,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalStatsLabel: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  modalStatsValue: {
    ...textStyles.mono,
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalQuitButton: {
    flex: 1,
    backgroundColor: colors.destructive,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalQuitButtonText: {
    ...textStyles.body,
    color: colors.destructiveForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  modalResumeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalResumeButtonText: {
    ...textStyles.body,
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});


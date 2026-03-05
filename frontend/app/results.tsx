import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Share, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORY_NAMES: Record<string, string> = {
  series_tv: 'Séries TV Cultes',
  geographie: 'Géographie Mondiale',
  histoire: 'Histoire de France',
};

type XpBreakdown = {
  base: number;
  victory: number;
  perfection: number;
  giant_slayer: number;
  streak: number;
  total: number;
};

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    playerScore: string; opponentScore: string; opponentPseudo: string;
    category: string; userId: string; isBot: string;
    correctCount: string; opponentLevel: string;
  }>();

  const pScore = parseInt(params.playerScore || '0');
  const oScore = parseInt(params.opponentScore || '0');
  const correctCount = parseInt(params.correctCount || '0');
  const won = pScore > oScore;
  const draw = pScore === oScore;

  const [xpBreakdown, setXpBreakdown] = useState<XpBreakdown | null>(null);
  const [submitting, setSubmitting] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const xpSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    submitMatch();
    Haptics.notificationAsync(
      won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(xpSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const submitMatch = async () => {
    try {
      const userId = params.userId || await AsyncStorage.getItem('duelo_user_id');
      const res = await fetch(`${API_URL}/api/game/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: userId,
          category: params.category,
          player_score: pScore,
          opponent_score: oScore,
          opponent_pseudo: params.opponentPseudo,
          opponent_is_bot: params.isBot === 'true',
          correct_count: correctCount,
          opponent_level: parseInt(params.opponentLevel || '1'),
        }),
      });
      const data = await res.json();
      if (data.xp_breakdown) {
        setXpBreakdown(data.xp_breakdown);
      }
    } catch {}
    setSubmitting(false);
  };

  const shareResult = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const categoryName = CATEGORY_NAMES[params.category || ''] || params.category;
    const text = won
      ? `🏆 Victoire sur Duelo ! ${pScore}-${oScore} en ${categoryName} (${correctCount}/7). Viens me défier ! ⚡`
      : `⚡ Duel intense sur Duelo ! ${pScore}-${oScore} en ${categoryName}. Viens me battre ! 🎮`;
    try { await Share.share({ message: text }); } catch {}
  };

  const playAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace(`/matchmaking?category=${params.category}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Result Header */}
        <Animated.View style={[styles.resultHeader, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.resultEmoji}>{won ? '🏆' : draw ? '🤝' : '💪'}</Text>
          <Text style={[styles.resultTitle, won ? styles.winText : draw ? styles.drawText : styles.lossText]}>
            {won ? 'VICTOIRE !' : draw ? 'ÉGALITÉ !' : 'DÉFAITE'}
          </Text>
          <Text style={styles.correctBadge}>{correctCount}/7 bonnes réponses</Text>
        </Animated.View>

        {/* Score Card */}
        <Animated.View style={[styles.scoreCard, { opacity: fadeAnim, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.scoreCardInner}>
            <View style={styles.playerColumn}>
              <View style={[styles.avatarCircle, styles.avatarPlayer]}>
                <Text style={styles.avatarText}>T</Text>
              </View>
              <Text style={styles.playerName}>Toi</Text>
              <Text style={[styles.playerScore, won && styles.winScore]}>{pScore}</Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.categoryBadge}>{CATEGORY_NAMES[params.category || '']}</Text>
            </View>
            <View style={styles.playerColumn}>
              <View style={[styles.avatarCircle, styles.avatarOpponent]}>
                <Text style={styles.avatarText}>{(params.opponentPseudo || 'B')[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.playerName}>{params.opponentPseudo?.slice(0, 12)}</Text>
              <Text style={[styles.playerScore, !won && !draw && styles.winScore]}>{oScore}</Text>
            </View>
          </View>
        </Animated.View>

        {/* XP Breakdown */}
        <Animated.View style={[styles.xpCard, { opacity: fadeAnim, transform: [{ translateY: xpSlide }] }]}>
          {submitting ? (
            <ActivityIndicator color="#8A2BE2" />
          ) : xpBreakdown ? (
            <>
              <Text style={styles.xpTitle}>XP GAGNÉ</Text>
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>Base (score × 2)</Text>
                <Text style={styles.xpValue}>+{xpBreakdown.base}</Text>
              </View>
              {xpBreakdown.victory > 0 && (
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>🏆 Bonus Victoire</Text>
                  <Text style={[styles.xpValue, styles.xpGold]}>+{xpBreakdown.victory}</Text>
                </View>
              )}
              {xpBreakdown.perfection > 0 && (
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>⭐ Perfection (7/7)</Text>
                  <Text style={[styles.xpValue, styles.xpCyan]}>+{xpBreakdown.perfection}</Text>
                </View>
              )}
              {xpBreakdown.giant_slayer > 0 && (
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>⚔️ Giant Slayer</Text>
                  <Text style={[styles.xpValue, styles.xpPurple]}>+{xpBreakdown.giant_slayer}</Text>
                </View>
              )}
              {xpBreakdown.streak > 0 && (
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>🔥 Bonus Streak</Text>
                  <Text style={[styles.xpValue, styles.xpOrange]}>+{xpBreakdown.streak}</Text>
                </View>
              )}
              <View style={styles.xpDivider} />
              <View style={styles.xpRow}>
                <Text style={styles.xpTotalLabel}>TOTAL</Text>
                <Text style={styles.xpTotalValue}>+{xpBreakdown.total} XP</Text>
              </View>
            </>
          ) : null}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity testID="share-result-btn" style={styles.shareButton} onPress={shareResult} activeOpacity={0.8}>
            <Text style={styles.shareText}>📤 DÉFIER UN AMI</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="play-again-btn" style={styles.playAgainButton} onPress={playAgain} activeOpacity={0.8}>
            <Text style={styles.playAgainText}>⚡ REVANCHE</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="go-home-btn" style={styles.homeButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.homeText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  resultTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  winText: { color: '#00FF9D' },
  drawText: { color: '#FFD700' },
  lossText: { color: '#FF3B30' },
  correctBadge: { color: '#A3A3A3', fontSize: 14, fontWeight: '600', marginTop: 6 },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16,
  },
  scoreCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerColumn: { alignItems: 'center', flex: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  avatarPlayer: { backgroundColor: '#8A2BE2' },
  avatarOpponent: { backgroundColor: '#FF3B30' },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  playerName: { color: '#A3A3A3', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  playerScore: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  winScore: { color: '#00FF9D' },
  vsContainer: { alignItems: 'center', paddingHorizontal: 10 },
  vsText: { fontSize: 14, fontWeight: '900', color: '#525252' },
  categoryBadge: { fontSize: 9, color: '#525252', fontWeight: '600', textAlign: 'center', marginTop: 2 },
  // XP Card
  xpCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16,
  },
  xpTitle: { fontSize: 11, fontWeight: '800', color: '#525252', letterSpacing: 3, marginBottom: 12 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  xpLabel: { color: '#A3A3A3', fontSize: 14, fontWeight: '500' },
  xpValue: { color: '#00FF9D', fontSize: 14, fontWeight: '700' },
  xpGold: { color: '#FFD700' },
  xpCyan: { color: '#00FFFF' },
  xpPurple: { color: '#8A2BE2' },
  xpOrange: { color: '#FF6B35' },
  xpDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  xpTotalLabel: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  xpTotalValue: { color: '#00FFFF', fontSize: 18, fontWeight: '900' },
  // Actions
  actions: { gap: 10 },
  shareButton: {
    borderWidth: 1, borderColor: '#00FFFF', borderRadius: 14, padding: 14,
    backgroundColor: 'rgba(0,255,255,0.05)', alignItems: 'center',
  },
  shareText: { color: '#00FFFF', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  playAgainButton: {
    backgroundColor: '#8A2BE2', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  playAgainText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  homeButton: { padding: 12, alignItems: 'center' },
  homeText: { color: '#525252', fontSize: 14, fontWeight: '600' },
});

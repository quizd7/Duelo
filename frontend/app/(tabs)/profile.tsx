import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  Animated, Easing, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORY_ICONS: Record<string, string> = {
  series_tv: '📺', geographie: '🌍', histoire: '🏛️',
};

const XP_LEVELS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 450, 5: 700, 6: 1000, 7: 1400, 8: 1900, 9: 2500, 10: 3200,
  15: 6000, 20: 10000, 30: 20000, 50: 50000, 75: 100000, 100: 200000,
};

function getXpForNextLevel(currentLevel: number, totalXp: number): { current: number; needed: number; progress: number } {
  const sortedLevels = Object.entries(XP_LEVELS).map(([lvl, xp]) => ({ lvl: parseInt(lvl), xp })).sort((a, b) => a.lvl - b.lvl);
  let currentLevelXp = 0;
  let nextLevelXp = 100;
  for (let i = 0; i < sortedLevels.length; i++) {
    if (sortedLevels[i].lvl === currentLevel) {
      currentLevelXp = sortedLevels[i].xp;
      nextLevelXp = sortedLevels[i + 1]?.xp || currentLevelXp + 1000;
      break;
    }
  }
  const xpInLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return { current: xpInLevel, needed: xpNeeded, progress: Math.min(xpInLevel / xpNeeded, 1) };
}

type ProfileData = {
  user: {
    id: string; pseudo: string; avatar_seed: string; is_guest: boolean;
    total_xp: number; xp_series_tv: number; xp_geographie: number; xp_histoire: number;
    seasonal_total_xp: number;
    level: number; title: string; matches_played: number; matches_won: number;
    best_streak: number; current_streak: number; streak_badge: string;
    win_rate: number; mmr: number;
  };
  match_history: Array<{
    id: string; category: string; player_score: number; opponent_score: number;
    opponent: string; won: boolean; xp_earned: number;
    xp_breakdown: { base: number; victory: number; perfection: number; giant_slayer: number; streak: number; total: number } | null;
    correct_count: number; created_at: string;
  }>;
};

const BADGE_MAP: Record<string, string> = { fire: '🔥', bolt: '⚡', glow: '✨' };

function GlowUsername({ pseudo, isGlow }: { pseudo: string; isGlow: boolean }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGlow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    }
  }, [isGlow]);

  if (!isGlow) {
    return <Text style={styles.pseudoText}>{pseudo}</Text>;
  }

  const textShadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 16] });

  return (
    <Animated.Text style={[styles.pseudoText, styles.glowPseudo, { textShadowRadius }]}>
      {pseudo}
    </Animated.Text>
  );
}

function StreakBadge({ streak, badge }: { streak: number; badge: string }) {
  if (streak < 3) return null;
  const emoji = BADGE_MAP[badge] || '🔥';
  const label = streak >= 10 ? 'LÉGENDAIRE' : streak >= 5 ? 'EN FEU' : 'EN SÉRIE';
  const bgColor = streak >= 10 ? 'rgba(0,255,255,0.12)' : streak >= 5 ? 'rgba(255,165,0,0.12)' : 'rgba(255,100,0,0.12)';
  const borderColor = streak >= 10 ? 'rgba(0,255,255,0.3)' : streak >= 5 ? 'rgba(255,165,0,0.3)' : 'rgba(255,100,0,0.3)';
  const textColor = streak >= 10 ? '#00FFFF' : streak >= 5 ? '#FFA500' : '#FF6B35';

  return (
    <View style={[styles.streakContainer, { backgroundColor: bgColor, borderColor }]}>
      <Text style={styles.streakEmoji}>{emoji}</Text>
      <View>
        <Text style={[styles.streakLabel, { color: textColor }]}>{label}</Text>
        <Text style={styles.streakCount}>{streak} victoires d'affilée</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userId = await AsyncStorage.getItem('duelo_user_id');
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/profile/${userId}`);
      const data = await res.json();
      setProfile(data);
    } catch {}
    setLoading(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['duelo_user_id', 'duelo_pseudo', 'duelo_avatar_seed']);
    router.replace('/');
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#8A2BE2" /></View>;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Connecte-toi pour voir ton profil</Text>
          <TouchableOpacity testID="go-login-btn" style={styles.loginBtn} onPress={() => router.replace('/')}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { user, match_history } = profile;
  const isGlow = user.streak_badge === 'glow';
  const xpProgress = getXpForNextLevel(user.level, user.total_xp);
  const maxCatXp = Math.max(user.xp_series_tv, user.xp_geographie, user.xp_histoire, 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarLarge, isGlow && styles.avatarGlow]}>
            <Text style={styles.avatarLargeText}>{user.pseudo[0]?.toUpperCase()}</Text>
          </View>
          <GlowUsername pseudo={user.pseudo} isGlow={isGlow} />
          <View style={styles.titleBadge}>
            <Text style={styles.titleText}>{user.title}</Text>
          </View>
          {user.current_streak >= 3 && (
            <View style={styles.headerBadgeRow}>
              <Text style={styles.headerBadgeEmoji}>{BADGE_MAP[user.streak_badge] || ''}</Text>
            </View>
          )}
        </View>

        {/* Level & XP Progress */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelLabel}>NIVEAU {user.level}</Text>
            <Text style={styles.levelXp}>{user.total_xp.toLocaleString()} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress.progress * 100}%` }]} />
          </View>
          <Text style={styles.xpProgressText}>
            {xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()} XP vers le niveau suivant
          </Text>
        </View>

        {/* Win Streak Banner */}
        <StreakBadge streak={user.current_streak} badge={user.streak_badge} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.matches_played}</Text>
            <Text style={styles.statLabel}>Matchs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#00FF9D' }]}>{user.matches_won}</Text>
            <Text style={styles.statLabel}>Victoires</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.win_rate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>{user.best_streak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        {/* MMR Card */}
        <View style={styles.mmrCard}>
          <View style={styles.mmrLeft}>
            <Text style={styles.mmrIcon}>🎯</Text>
            <View>
              <Text style={styles.mmrLabel}>MMR (Classement caché)</Text>
              <Text style={styles.mmrValue}>{user.mmr}</Text>
            </View>
          </View>
          <View style={styles.mmrRight}>
            <Text style={styles.seasonalLabel}>XP Saison</Text>
            <Text style={styles.seasonalValue}>{(user.seasonal_total_xp || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Category XP */}
        <Text style={styles.sectionTitle}>XP PAR CATÉGORIE</Text>
        <View style={styles.categoryXpContainer}>
          {[
            { key: 'series_tv', label: 'Séries TV', xp: user.xp_series_tv, color: '#E040FB' },
            { key: 'geographie', label: 'Géographie', xp: user.xp_geographie, color: '#00FFFF' },
            { key: 'histoire', label: 'Histoire', xp: user.xp_histoire, color: '#FFD700' },
          ].map((cat) => (
            <View key={cat.key} style={styles.catXpRow}>
              <Text style={styles.catXpIcon}>{CATEGORY_ICONS[cat.key]}</Text>
              <View style={styles.catXpInfo}>
                <Text style={styles.catXpLabel}>{cat.label}</Text>
                <View style={styles.catXpBar}>
                  <View style={[styles.catXpFill, { width: `${Math.min((cat.xp / maxCatXp) * 100, 100)}%`, backgroundColor: cat.color }]} />
                </View>
              </View>
              <Text style={[styles.catXpValue, { color: cat.color }]}>{cat.xp.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Match History */}
        <Text style={styles.sectionTitle}>HISTORIQUE</Text>
        {match_history.length === 0 ? (
          <Text style={styles.noHistory}>Aucun match pour le moment</Text>
        ) : (
          match_history.map((m) => (
            <View key={m.id} style={[styles.matchCard, m.won && styles.matchCardWon]}>
              <View style={styles.matchLeft}>
                <Text style={styles.matchCategory}>{CATEGORY_ICONS[m.category] || '❓'}</Text>
                <View>
                  <Text style={styles.matchOpponent}>vs {m.opponent}</Text>
                  <Text style={styles.matchDate}>{new Date(m.created_at).toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>
              <View style={styles.matchRight}>
                <Text style={[styles.matchScore, m.won ? styles.scoreWin : styles.scoreLoss]}>
                  {m.player_score} - {m.opponent_score}
                </Text>
                <View style={styles.matchXpRow}>
                  <Text style={[styles.matchResult, m.won ? styles.resultWin : styles.resultLoss]}>
                    {m.won ? 'VICTOIRE' : 'DÉFAITE'}
                  </Text>
                  {m.xp_earned > 0 && (
                    <Text style={styles.matchXp}>+{m.xp_earned} XP</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#A3A3A3', fontSize: 16, marginBottom: 16 },
  loginBtn: { backgroundColor: '#8A2BE2', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  loginBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Profile Header
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatarLarge: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: '#8A2BE2',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  avatarGlow: {
    shadowColor: '#00FFFF', shadowOpacity: 0.8, shadowRadius: 20,
    borderWidth: 2, borderColor: 'rgba(0,255,255,0.5)',
  },
  avatarLargeText: { color: '#FFF', fontSize: 38, fontWeight: '900' },
  pseudoText: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  glowPseudo: {
    color: '#00FFFF',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
  },
  titleBadge: {
    marginTop: 8, backgroundColor: 'rgba(138,43,226,0.2)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(138,43,226,0.3)',
  },
  titleText: { color: '#8A2BE2', fontSize: 13, fontWeight: '700' },
  headerBadgeRow: { marginTop: 6 },
  headerBadgeEmoji: { fontSize: 20 },

  // Level Card
  levelCard: {
    backgroundColor: 'rgba(138,43,226,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(138,43,226,0.15)', marginBottom: 16,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  levelLabel: { color: '#8A2BE2', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  levelXp: { color: '#00FFFF', fontSize: 14, fontWeight: '700' },
  xpBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: 8, backgroundColor: '#8A2BE2', borderRadius: 4 },
  xpProgressText: { color: '#525252', fontSize: 11, marginTop: 8, fontWeight: '500' },

  // Streak Banner
  streakContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14,
    borderWidth: 1, marginBottom: 16, gap: 12,
  },
  streakEmoji: { fontSize: 28 },
  streakLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  streakCount: { color: '#A3A3A3', fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 10, color: '#525252', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },

  // MMR Card
  mmrCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 24,
  },
  mmrLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mmrIcon: { fontSize: 24 },
  mmrLabel: { color: '#525252', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  mmrValue: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 2 },
  mmrRight: { alignItems: 'flex-end' },
  seasonalLabel: { color: '#525252', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  seasonalValue: { color: '#00FFFF', fontSize: 18, fontWeight: '800', marginTop: 2 },

  // Category XP
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#525252', letterSpacing: 3, marginBottom: 12, marginTop: 8 },
  categoryXpContainer: { gap: 12, marginBottom: 24 },
  catXpRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  catXpIcon: { fontSize: 24, marginRight: 12 },
  catXpInfo: { flex: 1 },
  catXpLabel: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  catXpBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  catXpFill: { height: 4, borderRadius: 2 },
  catXpValue: { fontSize: 16, fontWeight: '800', marginLeft: 12 },

  // Match History
  noHistory: { color: '#525252', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  matchCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  matchCardWon: { borderColor: 'rgba(0,255,157,0.15)', backgroundColor: 'rgba(0,255,157,0.04)' },
  matchLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchCategory: { fontSize: 20 },
  matchOpponent: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  matchDate: { color: '#525252', fontSize: 11, marginTop: 2 },
  matchRight: { alignItems: 'flex-end' },
  matchScore: { fontSize: 16, fontWeight: '800' },
  scoreWin: { color: '#00FF9D' },
  scoreLoss: { color: '#FF3B30' },
  matchXpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  matchResult: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  resultWin: { color: '#00FF9D' },
  resultLoss: { color: '#FF3B30' },
  matchXp: { color: '#00FFFF', fontSize: 10, fontWeight: '700' },

  // Logout
  logoutBtn: {
    marginTop: 24, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  logoutText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
});

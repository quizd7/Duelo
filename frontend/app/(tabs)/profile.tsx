import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORY_META: Record<string, { icon: string; name: string; color: string; bg: string }> = {
  series_tv: { icon: '📺', name: 'Séries TV', color: '#E040FB', bg: '#2D1B4E' },
  geographie: { icon: '🌍', name: 'Géographie', color: '#00FFFF', bg: '#0D2B2B' },
  histoire: { icon: '🏛️', name: 'Histoire', color: '#FFD700', bg: '#2B2510' },
  cinema: { icon: '🎬', name: 'Cinéma', color: '#FF6B6B', bg: '#2B1515' },
  sport: { icon: '⚽', name: 'Sport', color: '#00FF9D', bg: '#0D2B1A' },
  musique: { icon: '🎵', name: 'Musique', color: '#FF8C00', bg: '#2B1E0D' },
  sciences: { icon: '🔬', name: 'Sciences', color: '#7B68EE', bg: '#1A1533' },
  gastronomie: { icon: '🍽️', name: 'Gastronomie', color: '#FF69B4', bg: '#2B152B' },
};

const BADGE_MAP: Record<string, string> = { fire: '🔥', bolt: '⚡', glow: '✨' };

type CategoryData = {
  xp: number; level: number; title: string;
  xp_progress: { current: number; needed: number; progress: number };
  unlocked_titles: { level: number; title: string }[];
};

type ProfileData = {
  user: {
    id: string; pseudo: string; avatar_seed: string; is_guest: boolean;
    total_xp: number; selected_title: string | null;
    country: string | null; country_flag: string;
    categories: Record<string, CategoryData>;
    matches_played: number; matches_won: number;
    best_streak: number; current_streak: number; streak_badge: string;
    win_rate: number; mmr: number;
    followers_count: number; following_count: number;
  };
  all_unlocked_titles: { level: number; title: string; category: string }[];
  match_history: Array<{
    id: string; category: string; player_score: number; opponent_score: number;
    opponent: string; won: boolean; xp_earned: number;
    xp_breakdown: any; correct_count: number; created_at: string;
  }>;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const userId = await AsyncStorage.getItem('duelo_user_id');
    if (!userId) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/profile/${userId}`);
      const data = await res.json();
      setProfile(data);
    } catch {}
    setLoading(false);
  };

  const handleSelectTitle = async (title: string) => {
    if (!profile) return;
    setSavingTitle(true);
    try {
      const res = await fetch(`${API_URL}/api/user/select-title`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.user.id, title }),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setProfile(prev => prev ? { ...prev, user: { ...prev.user, selected_title: title } } : null);
      }
    } catch {}
    setSavingTitle(false);
    setShowTitleModal(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['duelo_user_id', 'duelo_pseudo', 'duelo_avatar_seed']);
    router.replace('/');
  };

  if (loading) {
    return <View style={s.loadingContainer}><ActivityIndicator size="large" color="#8A2BE2" /></View>;
  }
  if (!profile) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyContainer}>
          <Text style={s.emptyText}>Connecte-toi pour voir ton profil</Text>
          <TouchableOpacity data-testid="go-login-btn" style={s.loginBtn} onPress={() => router.replace('/')}>
            <Text style={s.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { user, all_unlocked_titles, match_history } = profile;
  const displayTitle = user.selected_title || all_unlocked_titles[0]?.title || 'Novice';

  // Sort categories by level descending
  const sortedCategories = Object.entries(user.categories)
    .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <View style={s.heroCard}>
          {/* Background gradient overlay */}
          <View style={s.heroBg} />

          {/* Avatar */}
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user.pseudo[0]?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Name & Title */}
          <Text style={s.pseudo} data-testid="profile-pseudo">{user.pseudo}</Text>
          <TouchableOpacity
            data-testid="title-badge"
            style={s.titleBadge}
            onPress={() => setShowTitleModal(true)}
          >
            <Text style={s.titleText}>{displayTitle}</Text>
            <Text style={s.titleEditIcon}>{' \u270E'}</Text>
          </TouchableOpacity>

          {/* Location */}
          {user.country ? (
            <View style={s.locationRow}>
              <Text style={s.locationFlag}>{user.country_flag}</Text>
              <Text style={s.locationText}>{user.country}</Text>
            </View>
          ) : null}

          {/* Streak badge inline */}
          {user.current_streak >= 3 && (
            <View style={s.streakInline}>
              <Text style={s.streakEmoji}>{BADGE_MAP[user.streak_badge] || '🔥'}</Text>
              <Text style={s.streakNum}>{user.current_streak} victoires</Text>
            </View>
          )}

          {/* ── Stats Row ── */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue} data-testid="stat-games">{user.matches_played}</Text>
              <Text style={s.statLabel}>PARTIES</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue} data-testid="stat-followers">{user.followers_count}</Text>
              <Text style={s.statLabel}>ABONNÉS</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue} data-testid="stat-following">{user.following_count}</Text>
              <Text style={s.statLabel}>ABONNEMENTS</Text>
            </View>
          </View>
        </View>

        {/* ── My Topics Grid ── */}
        <Text style={s.sectionTitle}>MES THÈMES</Text>
        <View style={s.topicsGrid}>
          {sortedCategories.map(([catKey, catData]) => {
            const meta = CATEGORY_META[catKey] || { icon: '?', name: catKey, color: '#8A2BE2', bg: '#1A1A2E' };
            return (
              <TouchableOpacity
                key={catKey}
                data-testid={`topic-${catKey}`}
                style={[s.topicCard, { backgroundColor: meta.bg }]}
                onPress={() => router.push(`/category-detail?id=${catKey}`)}
                activeOpacity={0.8}
              >
                <View style={[s.topicIconBox, { backgroundColor: meta.color + '25' }]}>
                  <Text style={s.topicIcon}>{meta.icon}</Text>
                </View>
                <Text style={[s.topicName, { color: meta.color }]}>{meta.name}</Text>
                <Text style={s.topicLevel}>NiV. {catData.level}</Text>
                {/* XP progress mini bar */}
                <View style={s.topicBarBg}>
                  <View style={[s.topicBarFill, { width: `${catData.xp_progress.progress * 100}%`, backgroundColor: meta.color }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Quick Stats ── */}
        <Text style={s.sectionTitle}>STATISTIQUES</Text>
        <View style={s.quickStats}>
          <View style={s.qStatBox}>
            <Text style={[s.qStatVal, { color: '#00FF9D' }]}>{user.matches_won}</Text>
            <Text style={s.qStatLbl}>Victoires</Text>
          </View>
          <View style={s.qStatBox}>
            <Text style={s.qStatVal}>{user.win_rate}%</Text>
            <Text style={s.qStatLbl}>Win Rate</Text>
          </View>
          <View style={s.qStatBox}>
            <Text style={[s.qStatVal, { color: '#FFD700' }]}>{user.best_streak}</Text>
            <Text style={s.qStatLbl}>Best Streak</Text>
          </View>
          <View style={s.qStatBox}>
            <Text style={[s.qStatVal, { color: '#00FFFF' }]}>{user.total_xp.toLocaleString()}</Text>
            <Text style={s.qStatLbl}>XP Total</Text>
          </View>
        </View>

        {/* ── Titles ── */}
        <Text style={s.sectionTitle}>MES TITRES</Text>
        <View style={s.titlesWrap}>
          {all_unlocked_titles.map((t, i) => {
            const meta = CATEGORY_META[t.category] || { icon: '?', name: '', color: '#8A2BE2', bg: '#1A1A2E' };
            const isSelected = user.selected_title === t.title;
            return (
              <TouchableOpacity
                key={`${t.category}-${t.level}`}
                style={[s.titleChip, isSelected && { borderColor: meta.color, backgroundColor: meta.color + '15' }]}
                onPress={() => handleSelectTitle(t.title)}
              >
                <Text style={s.titleChipIcon}>{meta.icon}</Text>
                <Text style={[s.titleChipText, isSelected && { color: meta.color }]}>{t.title}</Text>
                {isSelected && <Text style={[s.titleChipCheck, { color: meta.color }]}>{'✓'}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Match History ── */}
        <Text style={s.sectionTitle}>HISTORIQUE</Text>
        {match_history.length === 0 ? (
          <Text style={s.noHistory}>Aucun match pour le moment</Text>
        ) : (
          match_history.map((m) => (
            <View key={m.id} style={[s.matchCard, m.won && s.matchCardWon]}>
              <View style={s.matchLeft}>
                <Text style={s.matchCatIcon}>{CATEGORY_META[m.category]?.icon || '?'}</Text>
                <View>
                  <Text style={s.matchOpp}>vs {m.opponent}</Text>
                  <Text style={s.matchDate}>{new Date(m.created_at).toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>
              <View style={s.matchRight}>
                <Text style={[s.matchScore, m.won ? s.scoreWin : s.scoreLoss]}>
                  {m.player_score} - {m.opponent_score}
                </Text>
                <View style={s.matchXpRow}>
                  <Text style={[s.matchResult, m.won ? s.resultWin : s.resultLoss]}>
                    {m.won ? 'VICTOIRE' : 'DÉFAITE'}
                  </Text>
                  {m.xp_earned > 0 && <Text style={s.matchXp}>+{m.xp_earned} XP</Text>}
                </View>
              </View>
            </View>
          ))
        )}

        {/* Logout */}
        <TouchableOpacity data-testid="logout-btn" style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Title Selection Modal */}
      <Modal visible={showTitleModal} transparent animationType="fade" onRequestClose={() => setShowTitleModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Choisir un titre</Text>
            <Text style={s.modalHint}>Ce titre sera affiché sous ton pseudo en duel</Text>
            <ScrollView style={s.modalScroll}>
              {all_unlocked_titles.map((t) => {
                const meta = CATEGORY_META[t.category] || { icon: '?', name: '', color: '#8A2BE2', bg: '' };
                const isSelected = user.selected_title === t.title;
                return (
                  <TouchableOpacity
                    key={`${t.category}-${t.level}`}
                    style={[s.modalItem, isSelected && { borderColor: meta.color, backgroundColor: meta.color + '10' }]}
                    onPress={() => handleSelectTitle(t.title)}
                    disabled={savingTitle}
                  >
                    <Text style={s.modalItemIcon}>{meta.icon}</Text>
                    <View style={s.modalItemInfo}>
                      <Text style={[s.modalItemTitle, isSelected && { color: meta.color }]}>{t.title}</Text>
                      <Text style={s.modalItemSub}>{meta.name} - Niv. {t.level}</Text>
                    </View>
                    {isSelected && <Text style={[s.modalItemCheck, { color: meta.color }]}>&#10003;</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={s.modalClose} onPress={() => setShowTitleModal(false)}>
              <Text style={s.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_SIZE = (width - 72) / 4;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#A3A3A3', fontSize: 16, marginBottom: 16 },
  loginBtn: { backgroundColor: '#8A2BE2', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  loginBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  scroll: { paddingBottom: 40 },

  /* ── Hero Header ── */
  heroCard: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 24, overflow: 'hidden',
    backgroundColor: '#0D0D1A', borderWidth: 1, borderColor: 'rgba(138,43,226,0.2)',
    paddingBottom: 24, alignItems: 'center',
  },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
    backgroundColor: '#1A0A2E',
  },
  avatarRing: {
    marginTop: 60, width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#8A2BE2',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000',
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#8A2BE2' },

  pseudo: { fontSize: 26, fontWeight: '900', color: '#FFF', marginTop: 12 },
  titleBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 6,
    backgroundColor: 'rgba(138,43,226,0.15)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(138,43,226,0.3)',
  },
  titleText: { color: '#B57EDC', fontSize: 13, fontWeight: '700' },
  titleEditIcon: { color: '#525252', fontSize: 12 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  locationFlag: { fontSize: 16 },
  locationText: { color: '#A3A3A3', fontSize: 13, fontWeight: '600' },

  streakInline: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: 'rgba(255,100,0,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
  },
  streakEmoji: { fontSize: 16 },
  streakNum: { color: '#FF6B35', fontSize: 12, fontWeight: '700' },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    marginTop: 20, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#525252', letterSpacing: 1.5, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },

  /* Section Title */
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: '#525252', letterSpacing: 3,
    marginBottom: 14, marginTop: 24, paddingHorizontal: 20,
  },

  /* ── Topics Grid ── */
  topicsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 20,
  },
  topicCard: {
    width: CARD_SIZE, borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  topicIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  topicIcon: { fontSize: 22 },
  topicName: { fontSize: 10, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
  topicLevel: { fontSize: 9, fontWeight: '700', color: '#A3A3A3', letterSpacing: 0.5, marginBottom: 6 },
  topicBarBg: { width: '80%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  topicBarFill: { height: 4, borderRadius: 2 },

  /* Quick Stats */
  quickStats: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  qStatBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  qStatVal: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  qStatLbl: { fontSize: 9, color: '#525252', marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },

  /* Titles */
  titlesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  titleChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 6,
  },
  titleChipIcon: { fontSize: 14 },
  titleChipText: { color: '#A3A3A3', fontSize: 13, fontWeight: '600' },
  titleChipCheck: { fontSize: 14, fontWeight: '800' },

  /* Match History */
  noHistory: { color: '#525252', fontSize: 14, textAlign: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  matchCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14,
    marginBottom: 8, marginHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  matchCardWon: { borderColor: 'rgba(0,255,157,0.15)', backgroundColor: 'rgba(0,255,157,0.04)' },
  matchLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchCatIcon: { fontSize: 20 },
  matchOpp: { color: '#FFF', fontSize: 14, fontWeight: '600' },
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

  /* Logout */
  logoutBtn: {
    marginTop: 24, marginHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  logoutText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', paddingHorizontal: 24 },
  modalContent: {
    backgroundColor: '#1A1A1A', borderRadius: 20, padding: 24, maxHeight: '70%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  modalHint: { fontSize: 13, color: '#525252', marginBottom: 20 },
  modalScroll: { maxHeight: 300 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modalItemIcon: { fontSize: 22, marginRight: 12 },
  modalItemInfo: { flex: 1 },
  modalItemTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalItemSub: { color: '#525252', fontSize: 11, marginTop: 2 },
  modalItemCheck: { fontSize: 18, fontWeight: '800' },
  modalClose: {
    marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalCloseText: { color: '#A3A3A3', fontSize: 14, fontWeight: '600' },
});

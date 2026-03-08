import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import DueloHeader from '../../components/DueloHeader';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type SuperCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
  clusters: { name: string; icon: string; theme_count: number }[];
  total_themes: number;
};

// Placeholder items for upcoming super categories
const UPCOMING_CATS = [
  { id: 'SOUND', label: 'Sound', icon: '🎵', color: '#FF6B35' },
  { id: 'ARENA', label: 'Arena', icon: '⚽', color: '#00FF9D' },
  { id: 'LEGENDS', label: 'Legends', icon: '🏛️', color: '#FFD700' },
  { id: 'LAB', label: 'Lab', icon: '🔬', color: '#00FFFF' },
  { id: 'TASTE', label: 'Taste', icon: '🍽️', color: '#FF69B4' },
  { id: 'GLOBE', label: 'Globe', icon: '🌍', color: '#4ECDC4' },
  { id: 'PIXEL', label: 'Pixel', icon: '🎮', color: '#FF3B5C' },
  { id: 'STYLE', label: 'Style', icon: '✨', color: '#E040FB' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [superCategories, setSuperCategories] = useState<SuperCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pseudo, setPseudo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const storedPseudo = await AsyncStorage.getItem('duelo_pseudo');
    if (storedPseudo) setPseudo(storedPseudo);

    try {
      const res = await fetch(`${API_URL}/api/explore/super-categories`);
      const data = await res.json();
      setSuperCategories(data);
    } catch {}
    setLoading(false);
  };

  const handlePress = (cat: SuperCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/super-category?id=${cat.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  // Merge loaded + upcoming (show upcoming as locked)
  const loadedIds = new Set(superCategories.map(sc => sc.id));
  const upcomingFiltered = UPCOMING_CATS.filter(c => !loadedIds.has(c.id));

  return (
    <SafeAreaView style={styles.container}>
      <DueloHeader />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Salut, {pseudo || 'Joueur'} 👋</Text>
        <Text style={styles.sectionTitle}>SUPER CATÉGORIES</Text>

        {/* Active Super Categories */}
        {superCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.superCard}
            onPress={() => handlePress(cat)}
            activeOpacity={0.7}
          >
            <View style={[styles.superCardInner, { borderColor: cat.color + '30' }]}>
              <View style={[styles.superCardGlow, { backgroundColor: cat.color + '08' }]} />
              <View style={styles.superCardTop}>
                <View style={[styles.superIconBox, { backgroundColor: cat.color + '20' }]}>
                  <Text style={styles.superIcon}>{cat.icon}</Text>
                </View>
                <View style={styles.superCardInfo}>
                  <Text style={[styles.superLabel, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
                  <Text style={styles.superMeta}>{cat.total_themes} thèmes</Text>
                </View>
                <Text style={styles.superChevron}>›</Text>
              </View>

              {/* Clusters preview */}
              <View style={styles.clustersPreview}>
                {cat.clusters.map((cluster) => (
                  <View key={cluster.name} style={styles.clusterPill}>
                    <Text style={styles.clusterPillIcon}>{cluster.icon}</Text>
                    <Text style={styles.clusterPillText}>{cluster.name}</Text>
                    <Text style={styles.clusterPillCount}>{cluster.theme_count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Upcoming categories */}
        {upcomingFiltered.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>BIENTÔT DISPONIBLE</Text>
            <View style={styles.upcomingGrid}>
              {upcomingFiltered.map((cat) => (
                <View key={cat.id} style={styles.upcomingCard}>
                  <View style={[styles.upcomingInner, { borderColor: cat.color + '15' }]}>
                    <View style={[styles.upcomingIconBox, { backgroundColor: cat.color + '10' }]}>
                      <Text style={styles.upcomingIcon}>{cat.icon}</Text>
                    </View>
                    <Text style={[styles.upcomingLabel, { color: cat.color + '60' }]}>
                      {cat.label}
                    </Text>
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>🔒</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 30 },

  greeting: {
    fontSize: 22, fontWeight: '800', color: '#FFF',
    marginTop: 20, marginBottom: 24, paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: '#525252', letterSpacing: 3,
    marginBottom: 16, paddingHorizontal: 16,
  },

  // Super Category Card
  superCard: { marginHorizontal: 16, marginBottom: 16 },
  superCardInner: {
    borderRadius: 20, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, overflow: 'hidden',
  },
  superCardGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
  },
  superCardTop: {
    flexDirection: 'row', alignItems: 'center',
  },
  superIconBox: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  superIcon: { fontSize: 30 },
  superCardInfo: { flex: 1, marginLeft: 14 },
  superLabel: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  superMeta: { color: '#666', fontSize: 13, fontWeight: '600', marginTop: 2 },
  superChevron: { color: '#444', fontSize: 28, fontWeight: '300' },

  // Clusters preview
  clustersPreview: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8,
  },
  clusterPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    gap: 6,
  },
  clusterPillIcon: { fontSize: 14 },
  clusterPillText: { color: '#AAA', fontSize: 12, fontWeight: '600' },
  clusterPillCount: { color: '#555', fontSize: 11, fontWeight: '700' },

  // Upcoming
  upcomingGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16,
  },
  upcomingCard: { width: '25%', padding: 4 },
  upcomingInner: {
    borderRadius: 14, padding: 10, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  upcomingIconBox: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  upcomingIcon: { fontSize: 20 },
  upcomingLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  lockBadge: { marginTop: 4 },
  lockText: { fontSize: 10 },
});

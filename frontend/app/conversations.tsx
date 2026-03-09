import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CosmicBackground from '../components/CosmicBackground';
import { GLASS } from '../theme/glassTheme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type Conversation = {
  partner_id: string;
  partner_pseudo: string;
  partner_avatar_seed: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_sender: boolean;
};

function getAvatar(seed: string) {
  const emojis = ['🐯','🦊','🐸','🦄','🐺','🦅','🐲','🐼','🦁','🐙','🐬','🦋'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return emojis[Math.abs(hash) % emojis.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(diff / 86400000);
  return `${d}j`;
}

export default function ConversationsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const uid = await AsyncStorage.getItem('duelo_user_id');
      if (!uid) { setLoading(false); return; }
      const res = await fetch(`${API_URL}/api/chat/conversations/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Load conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const openChat = (conv: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat?partnerId=${conv.partner_id}&partnerPseudo=${encodeURIComponent(conv.partner_pseudo)}`);
  };

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <TouchableOpacity
        data-testid={`conversation-${item.partner_id}`}
        style={styles.convCard}
        onPress={() => openChat(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, item.unread_count > 0 && styles.avatarUnread]}>
          <Text style={styles.avatarEmoji}>{getAvatar(item.partner_avatar_seed || item.partner_id)}</Text>
        </View>
        <View style={styles.convInfo}>
          <View style={styles.convTopRow}>
            <Text style={[styles.convPseudo, item.unread_count > 0 && styles.convPseudoUnread]} numberOfLines={1}>
              {item.partner_pseudo}
            </Text>
            <Text style={styles.convTime}>{timeAgo(item.last_message_time)}</Text>
          </View>
          <Text style={[styles.convPreview, item.unread_count > 0 && styles.convPreviewUnread]} numberOfLines={1}>
            {item.is_sender ? 'Toi: ' : ''}{item.last_message}
          </Text>
        </View>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity data-testid="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#8A2BE2" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptyText}>
              Tes conversations apparaîtront ici.{'\n'}Défie quelqu'un pour commencer !
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.partner_id}
            renderItem={renderConversation}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
            }
          />
        )}
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.borderCyan,
    backgroundColor: GLASS.bgDark,
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any,
      default: {},
    }),
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 28, color: '#FFF', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

  // Conversation card
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarUnread: {
    borderColor: '#00FFFF',
    backgroundColor: 'rgba(0,255,255,0.08)',
  },
  avatarEmoji: { fontSize: 22 },
  convInfo: { flex: 1, marginLeft: 12 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convPseudo: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)', flex: 1, marginRight: 8 },
  convPseudoUnread: { color: '#FFF', fontWeight: '800' },
  convTime: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  convPreview: { fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 18 },
  convPreviewUnread: { color: 'rgba(255,255,255,0.6)' },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // Empty state
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
});

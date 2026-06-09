import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api, SavedStyleItem } from '@/utils/api';

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useScan();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [removing, setRemoving] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['saved-styles', userId],
    queryFn: () => api.getSavedStyles(userId!),
    enabled: !!userId,
  });

  const handleRemove = async (item: SavedStyleItem) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRemoving(item.id);
    try {
      await api.removeSavedStyle(userId, item.id);
      queryClient.invalidateQueries({ queryKey: ['saved-styles', userId] });
    } finally {
      setRemoving(null);
    }
  };

  const styles_list = data?.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Saved Styles</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.countText, { color: colors.primaryForeground }]}>
            {styles_list.length}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : styles_list.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="bookmark" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved styles yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Complete a scan and save the styles you love
          </Text>
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/scan')}
          >
            <Feather name="camera" size={16} color={colors.primaryForeground} />
            <Text style={[styles.scanBtnText, { color: colors.primaryForeground }]}>Start a Scan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={styles_list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Category label */}
              <View style={styles.cardTop}>
                <View style={[styles.catTag, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons
                    name={item.hairstyle.category === 'beard' ? 'face-man' : 'content-cut'}
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={[styles.catTagText, { color: colors.primary }]}>
                    {item.hairstyle.category.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(item)}
                  disabled={removing === item.id}
                  style={styles.removeBtn}
                >
                  {removing === item.id ? (
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                  ) : (
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.styleName, { color: colors.foreground }]}>
                {item.hairstyle.name}
              </Text>
              <Text style={[styles.styleDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.hairstyle.description}
              </Text>

              {/* Attributes */}
              <View style={styles.attrRow}>
                {[
                  { label: 'LENGTH', value: item.hairstyle.length },
                  { label: 'FADE', value: item.hairstyle.fade.replace('_', ' ') },
                  { label: 'TEXTURE', value: item.hairstyle.texture },
                ].map((a) => (
                  <View key={a.label} style={[styles.attr, { borderColor: colors.border }]}>
                    <Text style={[styles.attrLabel, { color: colors.mutedForeground }]}>{a.label}</Text>
                    <Text style={[styles.attrValue, { color: colors.foreground }]} numberOfLines={1}>
                      {a.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Tags */}
              <View style={styles.tags}>
                {item.hairstyle.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countText: { fontSize: 13, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  scanBtnText: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  catTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catTagText: { fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  removeBtn: { padding: 4 },
  styleName: { fontSize: 22, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  styleDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
  attrRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  attr: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  attrLabel: { fontSize: 9, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 3 },
  attrValue: { fontSize: 12, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});

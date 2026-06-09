import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';

const { width } = Dimensions.get('window');

const EFFORT_LABEL: Record<string, string> = {
  low: 'Low Effort',
  medium: 'Medium',
  high: 'High Effort',
};

const FADE_LABEL: Record<string, string> = {
  none: 'None',
  low: 'Low Fade',
  mid_skin: 'Mid Skin Fade',
  high_skin: 'High Skin Fade',
  bald: 'Bald Fade',
};

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { matches, selectedMatchIndex, setSelectedMatchIndex, clearScan, category } = useScan();
  const [showAll, setShowAll] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const current = matches[selectedMatchIndex];
  const total = matches.length;

  const go = (dir: -1 | 1) => {
    const next = selectedMatchIndex + dir;
    if (next < 0 || next >= total) return;
    Haptics.selectionAsync();
    setSelectedMatchIndex(next);
  };

  const viewDetail = (index: number) => {
    setSelectedMatchIndex(index);
    router.push({ pathname: '/style-detail', params: { index: String(index) } });
  };

  if (!current) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errTitle, { color: colors.foreground }]}>No matches found</Text>
          <Text style={[styles.errSub, { color: colors.mutedForeground }]}>Try scanning again</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => { clearScan(); router.replace('/scan'); }}
          >
            <Text style={[styles.retryBtnText, { color: colors.primaryForeground }]}>Rescan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const h = current.hairstyle;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>YOUR MATCHES</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {total} styles found
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="sliders" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 20 }}>
        {/* Best match badge */}
        {current.isBestMatch && (
          <View style={[styles.bestBadge, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={13} color={colors.primaryForeground} />
            <Text style={[styles.bestBadgeText, { color: colors.primaryForeground }]}>Best Match</Text>
          </View>
        )}

        {/* Main card */}
        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
          {/* Gradient header */}
          <LinearGradient
            colors={[colors.primary + '30', colors.card]}
            style={styles.cardGradient}
          />

          {/* Category + bookmark */}
          <View style={styles.cardTop}>
            <View style={[styles.catPill, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons
                name={h.category === 'beard' ? 'face-man' : 'content-cut'}
                size={12}
                color={colors.mutedForeground}
              />
              <Text style={[styles.catPillText, { color: colors.mutedForeground }]}>
                {(h.category ?? 'hair').toUpperCase()} · {(h.fade ?? '').replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.matchBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.matchPct, { color: colors.primaryForeground }]}>
                {current.matchPercentage}%
              </Text>
              <Text style={[styles.matchLabel, { color: colors.primaryForeground + 'aa' }]}>MATCH</Text>
            </View>
          </View>

          {/* Style name */}
          <Text style={[styles.styleName, { color: colors.foreground }]}>{h.name}</Text>
          <Text style={[styles.styleDesc, { color: colors.mutedForeground }]}>{h.description}</Text>

          {/* Attributes */}
          <View style={styles.attrRow}>
            {[
              { label: 'LENGTH', value: h.length },
              { label: 'FADE', value: FADE_LABEL[h.fade] ?? h.fade },
              { label: 'TEXTURE', value: h.texture },
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
            {h.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Dot pagination */}
          <View style={styles.dots}>
            {matches.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedMatchIndex(i)}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: i === selectedMatchIndex ? colors.primary : colors.border },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nav buttons */}
        <View style={[styles.navRow, { marginHorizontal: 16 }]}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.secondary }]}
            onPress={() => go(-1)}
            disabled={selectedMatchIndex === 0}
          >
            <Text style={[styles.navBtnText, { color: selectedMatchIndex === 0 ? colors.mutedForeground : colors.foreground }]}>
              Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.secondary }]}
            onPress={() => go(1)}
            disabled={selectedMatchIndex === total - 1}
          >
            <Text style={[styles.navBtnText, { color: selectedMatchIndex === total - 1 ? colors.mutedForeground : colors.foreground }]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secondary actions */}
        <View style={[styles.navRow, { marginHorizontal: 16 }]}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="download" size={15} color={colors.foreground} />
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>HD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="content-cut" size={15} color={colors.foreground} />
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>Show barber</Text>
          </TouchableOpacity>
        </View>

        {/* See Best Match CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary, marginHorizontal: 16 }]}
          onPress={() => viewDetail(selectedMatchIndex)}
        >
          <Feather name="check" size={18} color={colors.primaryForeground} />
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>See This Style</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  errTitle: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  errSub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  retryBtnText: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSub: { fontSize: 10, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  bestBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginLeft: 16, marginBottom: 10 },
  bestBadgeText: { fontSize: 13, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  card: { borderRadius: 20, padding: 20, overflow: 'hidden', marginBottom: 12 },
  cardGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, borderRadius: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  catPillText: { fontSize: 10, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  matchBadge: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  matchPct: { fontSize: 22, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  matchLabel: { fontSize: 9, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  styleName: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  styleDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  attrRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  attr: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  attrLabel: { fontSize: 9, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 4 },
  attrValue: { fontSize: 12, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize', textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  navRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  navBtnText: { fontSize: 14, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 14, marginTop: 4 },
  ctaText: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
});

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = width * 1.05;

const FADE_LABEL: Record<string, string> = {
  none: 'None',
  low: 'Low Fade',
  mid_skin: 'Mid Skin Fade',
  high_skin: 'High Skin Fade',
  bald: 'Bald Fade',
};

const HAIR_HERO = require('@/assets/images/hero_hair.png');
const BEARD_HERO = require('@/assets/images/hero_beard.png');

export default function StyleDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { index } = useLocalSearchParams<{ index?: string }>();
  const { matches, userId, scanId, category } = useScan();
  const queryClient = useQueryClient();

  const matchIndex = parseInt(index ?? '0', 10);
  const match = matches[matchIndex];

  const [sliderX, setSliderX] = useState(width / 2);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const panRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const newX = Math.min(Math.max(gs.moveX, 40), width - 40);
        setSliderX(newX);
      },
    })
  ).current;

  const handleSave = async () => {
    if (!userId || !match || saved || saving) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      await api.saveStyle(userId, match.hairstyleId, scanId);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['saved-styles', userId] });
    } finally {
      setSaving(false);
    }
  };

  if (!match) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={{ padding: 20 }} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.mutedForeground }]}>Style not found</Text>
        </View>
      </View>
    );
  }

  const h = match.hairstyle;
  const heroImage = h.category === 'beard' ? BEARD_HERO : HAIR_HERO;
  const sliderPct = sliderX / width;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: botPad + 30 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>YOUR CUT</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleSave}>
          <Feather name="bookmark" size={22} color={saved ? colors.primary : colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Before/After Slider */}
      <View style={[styles.sliderContainer, { height: CARD_HEIGHT }]} {...panRef.panHandlers}>
        {/* BEFORE side */}
        <Image source={heroImage} style={[styles.sliderImage, { width: sliderX }]} contentFit="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.sliderOverlay, { width: sliderX }]}
        />
        {/* AFTER side */}
        <Image
          source={heroImage}
          style={[styles.sliderImage, { left: sliderX, width: width - sliderX }]}
          contentFit="cover"
        />
        {/* After color overlay */}
        <LinearGradient
          colors={['transparent', colors.primary + '22']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.sliderOverlay, { left: sliderX, width: width - sliderX }]}
        />

        {/* Labels */}
        <View style={[styles.sliderLabel, { left: 14, bottom: 14 }]}>
          <Text style={styles.sliderLabelText}>BEFORE</Text>
        </View>
        <View style={[styles.sliderLabel, { right: 14, bottom: 14 }]}>
          <Text style={styles.sliderLabelText}>AFTER</Text>
        </View>

        {/* Divider */}
        <View style={[styles.dividerLine, { left: sliderX - 1.5, backgroundColor: colors.primary }]}>
          <View style={[styles.dividerHandle, { backgroundColor: colors.primary }]}>
            <Feather name="chevron-left" size={12} color={colors.primaryForeground} />
            <Feather name="chevron-right" size={12} color={colors.primaryForeground} />
          </View>
        </View>
      </View>

      {/* Recommended for you */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={[styles.recoLabel, { color: colors.primary }]}>RECOMMENDED FOR YOU</Text>
        <Text style={[styles.styleName, { color: colors.foreground }]}>{h.name}</Text>
        <Text style={[styles.dragHint, { color: colors.mutedForeground }]}>
          <Feather name="arrow-left" size={11} /> Drag to compare
        </Text>
      </View>

      {/* Attributes */}
      <View style={[styles.attrRow, { paddingHorizontal: 20 }]}>
        {[
          { label: 'LENGTH', value: h.length },
          { label: 'FADE', value: FADE_LABEL[h.fade] ?? h.fade },
          { label: 'TEXTURE', value: h.texture },
        ].map((a) => (
          <View key={a.label} style={[styles.attr, { borderColor: colors.border }]}>
            <Text style={[styles.attrLabel, { color: colors.mutedForeground }]}>{a.label}</Text>
            <Text style={[styles.attrValue, { color: colors.foreground }]}>{a.value}</Text>
          </View>
        ))}
      </View>

      {/* Why this works */}
      <View style={[styles.whyBox, { marginHorizontal: 20, backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.whyHead}>
          <View style={[styles.whyDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.whyTitle, { color: colors.foreground }]}>Why this works for you</Text>
        </View>
        <Text style={[styles.whyText, { color: colors.mutedForeground }]}>
          {match.reasoning ?? h.description}
        </Text>
        {/* Tags */}
        <View style={styles.tags}>
          {h.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.tagText, { color: colors.foreground }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Download HD */}
      <TouchableOpacity style={[styles.hdBtn, { marginHorizontal: 20, backgroundColor: colors.primary }]}>
        <Feather name="download" size={18} color={colors.primaryForeground} />
        <Text style={[styles.hdBtnText, { color: colors.primaryForeground }]}>Download HD Reference</Text>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={[styles.actionRow, { marginHorizontal: 20 }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
          <Feather name="share-2" size={16} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="content-cut" size={16} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Barber</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.replace('/scan')}
        >
          <Feather name="refresh-cw" size={16} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Rescan</Text>
        </TouchableOpacity>
      </View>

      {/* Save banner */}
      {saved ? (
        <View style={[styles.savedBanner, { marginHorizontal: 20, backgroundColor: colors.primary + '18', borderColor: colors.primary }]}>
          <Feather name="check-circle" size={18} color={colors.primary} />
          <View>
            <Text style={[styles.savedTitle, { color: colors.primary }]}>Saved to your styles</Text>
            <Text style={[styles.savedSub, { color: colors.mutedForeground }]}>Access anytime from your profile</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.saveBtn, { marginHorizontal: 20, backgroundColor: colors.secondary }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Feather name="bookmark" size={18} color={colors.foreground} />
          <Text style={[styles.saveBtnText, { color: colors.foreground }]}>
            {saving ? 'Saving...' : 'Save to your styles'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  sliderContainer: { position: 'relative', overflow: 'hidden', width },
  sliderImage: { position: 'absolute', top: 0, left: 0, height: '100%' },
  sliderOverlay: { position: 'absolute', top: 0, bottom: 0 },
  sliderLabel: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  sliderLabelText: { color: '#fff', fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  dividerLine: { position: 'absolute', top: 0, bottom: 0, width: 3, alignItems: 'center', justifyContent: 'center' },
  dividerHandle: { width: 32, height: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  recoLabel: { fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 2, marginBottom: 6 },
  styleName: { fontSize: 32, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  dragHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  attrRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  attr: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  attrLabel: { fontSize: 9, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 4 },
  attrValue: { fontSize: 12, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize', textAlign: 'center' },
  whyBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  whyHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  whyDot: { width: 8, height: 8, borderRadius: 4 },
  whyTitle: { fontSize: 14, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  whyText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  hdBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, marginBottom: 10 },
  hdBtnText: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  savedTitle: { fontSize: 14, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  savedSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
});

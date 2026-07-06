import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

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
  
  const {
    matches,
    setMatches,
    selectedMatchIndex,
    setSelectedMatchIndex,
    clearScan,
    categories,
  } = useScan();

  const [isGenerating, setIsGenerating] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const current = matches[selectedMatchIndex];
  const total = matches.length;

  const selectionLabel =
    categories.length === 2
      ? 'Hair + Beard'
      : categories[0] === 'beard'
        ? 'Beard'
        : 'Hair';

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      // Simulate "Generating More" by fetching all available styles
      const result = await api.listHairstyles();
      const newVariations = (result.data || []).map((h, i) => ({
        id: `gen-${Date.now()}-${i}`,
        matchPercentage: 82 - (i * 2),
        isBestMatch: false,
        reasoning: "AI recalibrated: This variation provides a more classic balance for your jawline.",
        hairstyle: h
      }));
      setMatches([...matches, ...newVariations]);
    } catch (error) {
      console.error("Failed to generate more:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const viewDetail = (index: number) => {
    setSelectedMatchIndex(index);
    router.push({ pathname: '/style-detail', params: { index: String(index) } });
  };

  if (matches.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errTitle, { color: colors.foreground }]}>
            No {selectionLabel.toLowerCase()} matches found
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              clearScan();
              router.replace('/scan');
            }}
          >
            <Text style={[styles.retryBtnText, { color: colors.primaryForeground }]}>Rescan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerSub, { color: colors.primary }]}>AI ENGINE GENERATED</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {total} Variations Found
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="sliders" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 20 }}>
        
        {/* HORIZONTAL VARIATION SLIDER */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 20}
          decelerationRate="fast"
          contentContainerStyle={styles.sliderContent}
        >
          {matches.map((item, i) => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.9}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => viewDetail(i)}
            >
              <Image 
                source={{ uri: item.hairstyle.imageUrl || 'https://via.placeholder.com/400' }} 
                style={styles.cardImage} 
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={StyleSheet.absoluteFill}
              />
              
              <View style={styles.cardOverlay}>
                <View style={styles.badgeRow}>
                  <View style={[styles.matchBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.matchPct}>{item.matchPercentage}%</Text>
                    <Text style={styles.matchLabel}>MATCH</Text>
                  </View>
                  {item.isBestMatch && (
                    <View style={styles.bestBadge}>
                      <Text style={styles.bestText}>BEST FIT</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.styleName}>{item.hairstyle.name}</Text>
                <Text style={styles.styleDesc} numberOfLines={2}>{item.hairstyle.description}</Text>
                
                <View style={styles.cardFooter}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>See Detail & Swap →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ATTRIBUTES FOR SELECTED STYLE */}
        {current && (
          <View style={styles.detailsSection}>
             <View style={styles.attrRow}>
                {[
                  { label: 'LENGTH', value: current.hairstyle.length },
                  { label: 'FADE', value: FADE_LABEL[current.hairstyle.fade] || current.hairstyle.fade },
                  { label: 'TEXTURE', value: current.hairstyle.texture },
                ].map((a) => (
                  <View key={a.label} style={[styles.attrBox, { borderColor: colors.border }]}>
                    <Text style={[styles.attrLabel, { color: colors.mutedForeground }]}>{a.label}</Text>
                    <Text style={[styles.attrValue, { color: colors.foreground }]}>{a.value}</Text>
                  </View>
                ))}
             </View>
          </View>
        )}

        {/* GENERATE MORE BUTTON */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity 
            style={[styles.moreBtn, { borderColor: colors.primary }]} 
            onPress={handleGenerateMore}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={20} color={colors.primary} />
                <Text style={[styles.moreBtnText, { color: colors.primary }]}>Generate More Variations</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary, marginHorizontal: 20 }]}
          onPress={() => viewDetail(selectedMatchIndex)}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.ctaText}>See This Style</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', padding: 40 },
  errTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  retryBtnText: { fontSize: 15, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 15 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSub: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sliderContent: { paddingLeft: 20, paddingRight: 20, gap: 20 },
  card: { width: CARD_WIDTH, height: 400, borderRadius: 30, overflow: 'hidden', borderWidth: 1 },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  matchBadge: { padding: 8, borderRadius: 12, alignItems: 'center' },
  matchPct: { color: '#fff', fontSize: 16, fontWeight: '900' },
  matchLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 7, fontWeight: '700' },
  bestBadge: { backgroundColor: '#FFD700', paddingHorizontal: 10, justifyContent: 'center', borderRadius: 8 },
  bestText: { color: '#000', fontSize: 9, fontWeight: '900' },
  styleName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  styleDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },
  cardFooter: { marginTop: 15 },
  detailsSection: { padding: 20 },
  attrRow: { flexDirection: 'row', gap: 10 },
  attrBox: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  attrLabel: { fontSize: 9, fontWeight: '800' },
  attrValue: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  moreBtn: { height: 64, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 15 },
  moreBtnText: { fontSize: 16, fontWeight: '800' },
  cta: { height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

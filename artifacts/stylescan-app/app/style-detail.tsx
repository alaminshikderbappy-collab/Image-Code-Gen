import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');

export default function StyleDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { index } = useLocalSearchParams<{ index: string }>();
  const { matches, userId, scanId, frontImageUri } = useScan();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const matchItem = matches[Number(index) || 0];
  if (!matchItem) return null;

  const h = matchItem.hairstyle;
  const styleAngles = [
    { label: 'FRONT VIEW', uri: h.hdImageUrl || h.imageUrl },
    { label: 'LEFT PROFILE', uri: h.imageUrl },
    { label: 'RIGHT PROFILE', uri: h.hdImageUrl },
    { label: 'BACK VIEW', uri: h.imageUrl },
  ];

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await api.saveStyle(userId, h.id, scanId);
      setIsSaved(true);
      if (Platform.OS !== 'web') Alert.alert("Success", "Look saved!");
    } catch { } finally { setIsSaving(false); }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* 4-ANGLE SLIDER */}
      <View style={styles.imageContainer}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))} scrollEventThrottle={16}>
          {styleAngles.map((angle, i) => (
            <View key={i} style={{ width }}>
              <Image source={{ uri: angle.uri || 'https://via.placeholder.com/600' }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.angleBadge}><Text style={styles.angleBadgeText}>{angle.label}</Text></View>
            </View>
          ))}
        </ScrollView>
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.dotRow}>
          {styleAngles.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === activeSlide ? colors.primary : 'rgba(255,255,255,0.4)', width: i === activeSlide ? 18 : 6 }]} />
          ))}
        </View>
        <View style={[styles.topNav, { top: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.blurBtn}><Feather name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={isSaving || isSaved} style={[styles.blurBtn, { backgroundColor: isSaved ? colors.primary : 'rgba(255,255,255,0.2)' }]}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name={isSaved ? "check" : "bookmark"} size={22} color="#fff" />}
          </TouchableOpacity>
        </View>
        <View style={styles.matchFloat}><Text style={styles.matchLabel}>AI MATCH</Text><Text style={styles.matchValue}>{matchItem.matchPercentage}%</Text></View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.foreground }]}>{h.name}</Text>
          <Text style={[styles.effortText, { color: colors.mutedForeground }]}>{h.category.toUpperCase()} • {h.effortLevel.toUpperCase()} EFFORT</Text>

          {/* Expert Stylist Section */}
          <View style={[styles.aiCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="tie" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.primary }]}>The Stylist's Take</Text>
            </View>
            <Text style={[styles.reasonText, { color: colors.foreground }]}>
              To make you look more {h.category === 'beard' ? 'groomed' : 'presentable'}, 
              this style balances your feature ratios while sharpening your profile.
            </Text>
          </View>

          {/* Style Swap Preview */}
          <View style={styles.swapSection}>
            <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 15 }]}>Style Swap Preview</Text>
            <View style={styles.swapRow}>
               <View style={styles.swapHalf}>
                  <Image source={{ uri: frontImageUri || 'https://via.placeholder.com/150' }} style={styles.swapImg} />
                  <Text style={[styles.swapLabel, { color: colors.mutedForeground }]}>BEFORE</Text>
               </View>
               <Feather name="repeat" size={20} color={colors.primary} />
               <View style={styles.swapHalf}>
                  <Image source={{ uri: h.imageUrl || 'https://via.placeholder.com/150' }} style={styles.swapImg} />
                  <Text style={[styles.swapLabel, { color: colors.mutedForeground }]}>AI LOOK</Text>
               </View>
            </View>
          </View>

          <View style={styles.grid}>
            <DetailBox label="Length" value={h.length} icon="scissors" color={colors} />
            <DetailBox label="Fade" value={h.fade} icon="layers" color={colors} />
            <DetailBox label="Texture" value={h.texture} icon="wind" color={colors} />
          </View>

          <TouchableOpacity style={[styles.barberBtn, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="content-cut" size={22} color="#fff" />
            <Text style={styles.barberBtnText}>Show Barber Instructions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailBox({ label, value, icon, color }: any) {
  return (
    <View style={[styles.box, { backgroundColor: color.card, borderColor: color.border }]}>
      <Feather name={icon} size={14} color={color.primary} style={{ marginBottom: 6 }} />
      <Text style={[styles.boxLabel, { color: color.mutedForeground }]}>{label}</Text>
      <Text style={[styles.boxValue, { color: color.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  imageContainer: { width: '100%', height: 420, position: 'relative', backgroundColor: '#000' },
  heroImage: { width: width, height: 420 },
  angleBadge: { position: 'absolute', bottom: 35, left: 20, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  angleBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  dotRow: { position: 'absolute', bottom: 35, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  topNav: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  blurBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  matchFloat: { position: 'absolute', bottom: 25, right: 20, backgroundColor: '#fff', padding: 12, borderRadius: 18, alignItems: 'center' },
  matchLabel: { fontSize: 8, fontWeight: '800', color: '#888' },
  matchValue: { fontSize: 22, fontWeight: '900', color: '#000' },
  body: { padding: 24 },
  title: { fontSize: 34, fontWeight: '900' },
  aiCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  reasonText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  swapSection: { marginVertical: 20 },
  swapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swapHalf: { width: '44%', alignItems: 'center' },
  swapImg: { width: '100%', height: 160, borderRadius: 24, backgroundColor: '#1a1a1a' },
  swapLabel: { fontSize: 10, fontWeight: '900', marginTop: 10 },
  grid: { flexDirection: 'row', gap: 12, marginTop: 20 },
  box: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  boxLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  boxValue: { fontSize: 13, fontWeight: '700' },
  effortText: { fontSize: 13, fontWeight: '600', marginBottom: 15 },
  barberBtn: { height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 30 },
  barberBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

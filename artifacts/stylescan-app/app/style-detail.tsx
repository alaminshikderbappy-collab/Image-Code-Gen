import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
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

  if (!matchItem) {
    return (
      <View style={[styles.errorRoot, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Style not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const h = matchItem.hairstyle;

  // 4 variations of the style for the slider
  const styleViews = [
    { label: 'FRONT', uri: h.hdImageUrl || h.imageUrl },
    { label: 'LEFT', uri: h.imageUrl },
    { label: 'RIGHT', uri: h.hdImageUrl },
    { label: 'BACK', uri: h.imageUrl },
  ];

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await api.saveStyle(userId, h.id, scanId);
      setIsSaved(true);
      if (Platform.OS !== 'web') {
        Alert.alert("Success", "Style saved to your profile!");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* 4-ANGLE IMAGE SLIDER */}
      <View style={styles.imageContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            setActiveSlide(Math.round(x / width));
          }}
          scrollEventThrottle={16}
        >
          {styleViews.map((view, i) => (
            <View key={i} style={{ width }}>
              <Image
                source={{ uri: view.uri || 'https://via.placeholder.com/600' }}
                style={styles.heroImage}
                contentFit="cover"
              />
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>{view.label} VIEW</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        
        {/* Slide Indicators */}
        <View style={styles.indicatorContainer}>
          {styleViews.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.indicatorDot, 
                { backgroundColor: i === activeSlide ? colors.primary : 'rgba(255,255,255,0.4)' }
              ]} 
            />
          ))}
        </View>

        {/* Top Navigation */}
        <View style={[styles.topNav, { top: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.blurBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || isSaved}
            style={[styles.blurBtn, { backgroundColor: isSaved ? colors.primary : 'rgba(255,255,255,0.2)' }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name={isSaved ? "check" : "bookmark"} size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Floating Match Badge */}
        <View style={styles.floatingBadge}>
          <Text style={styles.badgeLabel}>MATCH SCORE</Text>
          <Text style={styles.badgeValue}>{matchItem.matchPercentage}%</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>{h.name}</Text>
          
          <View style={styles.infoRow}>
            <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.typeText, { color: colors.mutedForeground }]}>
                {h.category.toUpperCase()}
              </Text>
            </View>
            <View style={styles.dotSeparator} />
            <Text style={[styles.effortText, { color: colors.mutedForeground }]}>
              {h.effortLevel} Effort
            </Text>
          </View>

          {/* AI Reasoning Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Analysis</Text>
            </View>
            <Text style={[styles.reasoningText, { color: colors.mutedForeground }]}>
              {matchItem.reasoning || "Based on your unique face shape, this style provides the best facial symmetry and profile balance."}
            </Text>
          </View>

          {/* STYLE SWAP PREVIEW SECTION */}
          <View style={styles.swapSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="face-recognition" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Style Swap Preview</Text>
            </View>
            <View style={styles.swapContainer}>
               {/* Your Face */}
               <View style={styles.swapCard}>
                  <Image 
                    source={{ uri: frontImageUri || 'https://via.placeholder.com/150' }} 
                    style={styles.swapImage} 
                  />
                  <Text style={[styles.swapLabel, { color: colors.mutedForeground }]}>YOUR FACE</Text>
               </View>
               
               <Feather name="repeat" size={22} color={colors.primary} />

               {/* New Look */}
               <View style={styles.swapCard}>
                  <Image 
                    source={{ uri: h.imageUrl || 'https://via.placeholder.com/150' }} 
                    style={styles.swapImage} 
                  />
                  <Text style={[styles.swapLabel, { color: colors.mutedForeground }]}>NEW LOOK</Text>
               </View>
            </View>
          </View>

          {/* Attributes Grid */}
          <View style={styles.grid}>
            <DetailBox label="Length" value={h.length} icon="scissors" color={colors} />
            <DetailBox label="Fade" value={h.fade.replace('_', ' ')} icon="layers" color={colors} />
            <DetailBox label="Texture" value={h.texture} icon="wind" color={colors} />
          </View>

          <Text style={[styles.desc, { color: colors.foreground }]}>{h.description}</Text>

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="content-cut" size={20} color="#fff" />
              <Text style={styles.mainBtnText}>Show to Barber</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]}>
              <Feather name="share-2" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailBox({ label, value, icon, color }: any) {
  return (
    <View style={[styles.detailItem, { backgroundColor: color.card, borderColor: color.border }]}>
      <Feather name={icon} size={16} color={color.primary} style={{ marginBottom: 4 }} />
      <Text style={[styles.detailLabel, { color: color.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: color.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: 400, position: 'relative', backgroundColor: '#000' },
  heroImage: { width: width, height: 400 },
  viewBadge: { position: 'absolute', bottom: 30, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  indicatorContainer: { position: 'absolute', bottom: 30, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3 },
  topNav: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  blurBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  floatingBadge: { position: 'absolute', bottom: 24, right: 20, backgroundColor: '#fff', padding: 12, borderRadius: 16, alignItems: 'center', elevation: 5 },
  badgeLabel: { fontSize: 8, fontWeight: '800', color: '#666' },
  badgeValue: { fontSize: 22, fontWeight: '900', color: '#000' },
  content: { padding: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#888', marginHorizontal: 12 },
  effortText: { fontSize: 13, fontWeight: '500' },
  section: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  reasoningText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  swapSection: { marginBottom: 32 },
  swapContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  swapCard: { width: '44%', alignItems: 'center' },
  swapImage: { width: '100%', height: 160, borderRadius: 20, backgroundColor: '#1a1a1a' },
  swapLabel: { fontSize: 10, fontWeight: '800', marginTop: 10 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  detailItem: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  detailLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  desc: { fontSize: 15, lineHeight: 24, marginBottom: 36 },
  footerActions: { flexDirection: 'row', gap: 12 },
  mainBtn: { flex: 1, height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { width: 60, height: 60, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

export default function StyleDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { index } = useLocalSearchParams<{ index: string }>();
  
  const { matches, userId, scanId } = useScan();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await api.saveStyle(userId, h.id, scanId);
      setIsSaved(true);
      Alert.alert("Success", "Style saved to your profile!");
    } catch (error) {
      Alert.alert("Error", "Could not save style. Try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: h.hdImageUrl || h.imageUrl || 'https://via.placeholder.com/600' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Top Navigation */}
        <View style={[styles.topNav, { top: insets.top + 10 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.blurBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
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
          
          <View style={styles.row}>
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
              {matchItem.reasoning || "Based on your face shape and hair texture, this style provides the best balance for your features."}
            </Text>
          </View>

          {/* Details Grid */}
          <View style={styles.grid}>
            <DetailItem label="Length" value={h.length} icon="scissors" color={colors} />
            <DetailItem label="Fade" value={h.fade.replace('_', ' ')} icon="layers" color={colors} />
            <DetailItem label="Texture" value={h.texture} icon="wind" color={colors} />
          </View>

          <Text style={[styles.desc, { color: colors.foreground }]}>{h.description}</Text>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="content-cut" size={20} color={colors.primaryForeground} />
              <Text style={[styles.mainBtnText, { color: colors.primaryForeground }]}>Show to Barber</Text>
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

function DetailItem({ label, value, icon, color }: any) {
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
  imageContainer: { width: '100%', height: 400, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  topNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  blurBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeLabel: { fontSize: 9, fontWeight: '700', color: '#666', letterSpacing: 1 },
  badgeValue: { fontSize: 20, fontWeight: '800', color: '#000' },
  content: { padding: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#888', marginHorizontal: 12 },
  effortText: { fontSize: 13, fontWeight: '500' },
  section: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  reasoningText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  detailItem: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  detailLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  desc: { fontSize: 15, lineHeight: 24, marginBottom: 32 },
  footerActions: { flexDirection: 'row', gap: 12 },
  mainBtn: { flex: 1, height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mainBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: { width: 60, height: 60, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

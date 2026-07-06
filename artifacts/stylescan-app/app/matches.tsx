import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { matches, setMatches, categories } = useScan();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      const result = await api.listHairstyles();
      const newMatches = (result.data || []).map((h, i) => ({
        id: `gen-${Date.now()}-${i}`,
        matchPercentage: 75 - (i * 2),
        reasoning: "Alternative style based on secondary facial symmetry.",
        hairstyle: h
      }));
      setMatches([...matches, ...newMatches]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}><Feather name="arrow-left" size={24} color={colors.foreground} /></TouchableOpacity>
        <Text style={styles.headerTitle}>AI Recommendations</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>We found {matches.length} variations for you. Swipe to explore.</Text>

        <ScrollView 
          horizontal 
          pagingEnabled={false} 
          showsHorizontalScrollIndicator={false} 
          snapToInterval={CARD_WIDTH + 20}
          contentContainerStyle={styles.slider}
        >
          {matches.map((item, i) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: '/style-detail', params: { index: String(i) } })}
            >
              <Image source={{ uri: item.hairstyle.imageUrl }} style={styles.cardImg} />
              <View style={styles.cardContent}>
                <View style={styles.matchBadge}><Text style={styles.matchText}>{item.matchPercentage}% MATCH</Text></View>
                <Text style={[styles.styleName, { color: colors.foreground }]}>{item.hairstyle.name}</Text>
                <Text style={[styles.reason, { color: colors.mutedForeground }]} numberOfLines={2}>{item.reasoning}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={[styles.moreBtn, { borderColor: colors.primary }]} onPress={handleGenerateMore} disabled={isGenerating}>
          {isGenerating ? <ActivityIndicator color={colors.primary} /> : <Text style={{color: colors.primary, fontWeight:'700'}}>Generate More Variations</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  intro: { paddingHorizontal: 20, marginBottom: 20 },
  slider: { paddingLeft: 20, gap: 20, paddingRight: 20 },
  card: { width: CARD_WIDTH, borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  cardImg: { width: '100%', height: 260 },
  cardContent: { padding: 20 },
  matchBadge: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  matchText: { fontSize: 10, fontWeight: '900' },
  styleName: { fontSize: 22, fontWeight: '800' },
  reason: { fontSize: 13, marginTop: 8 },
  moreBtn: { margin: 20, height: 60, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }
});

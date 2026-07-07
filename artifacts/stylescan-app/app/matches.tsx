import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

export default function MatchesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { matches, setMatches, setSelectedMatchIndex } = useScan();
  const [loading, setLoading] = useState(false);

  const generateMore = async () => {
    setLoading(true);
    try {
      const res = await api.listHairstyles();
      const news = (res.data || []).map((h: any, i: number) => ({ id: `g-${i}-${Date.now()}`, matchPercentage: 80 - i, reasoning: "Secondary style logic.", hairstyle: h }));
      setMatches([...matches, ...news]);
    } catch { } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.tag, { color: colors.primary }]}>AI ENGINE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{matches.length} Variations Created</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + 16} contentContainerStyle={styles.slider}>
          {matches.map((item, i) => (
            <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { setSelectedMatchIndex(i); router.push({ pathname: '/style-detail', params: { index: String(i) } }); }}>
              <Image source={{ uri: item.hairstyle.imageUrl }} style={styles.cardImg} />
              <View style={styles.cardBody}>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>{item.matchPercentage}% MATCH</Text></View>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.hairstyle.name}</Text>
                <Text style={{ color: colors.mutedForeground }} numberOfLines={2}>{item.reasoning}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.more, { borderColor: colors.primary }]} onPress={generateMore} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <><MaterialCommunityIcons name="auto-fix" size={20} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 10 }}>Generate More Variations</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 30, alignItems: 'center' },
  tag: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 5 },
  title: { fontSize: 22, fontWeight: '900' },
  slider: { paddingHorizontal: 20, gap: 16 },
  card: { width: CARD_WIDTH, borderRadius: 28, overflow: 'hidden', borderWidth: 1, marginBottom: 20 },
  cardImg: { width: '100%', height: 260 },
  cardBody: { padding: 20 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 5 },
  more: { margin: 25, height: 64, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
});

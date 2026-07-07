import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');

export default function MatchesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { matches, setMatches } = useScan();
  const [loading, setLoading] = useState(false);

  const generateMore = async () => {
    setLoading(true);
    try {
      const res = await api.listHairstyles();
      const news = (res.data || []).map((h, i) => ({ id: `g-${i}`, matchPercentage: 80 - i, reasoning: "Secondary match.", hairstyle: h }));
      setMatches([...matches, ...news]);
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}><Text style={styles.title}>AI Variations</Text></View>
      <ScrollView>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} snapToInterval={width * 0.8} contentContainerStyle={styles.slider}>
          {matches.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push({ pathname: '/style-detail', params: { index: String(i) } })}>
              <Image source={{ uri: item.hairstyle.imageUrl }} style={styles.cardImg} />
              <View style={styles.cardBody}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{item.matchPercentage}% Match</Text>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.hairstyle.name}</Text>
                <Text style={{ color: colors.mutedForeground }} numberOfLines={2}>{item.reasoning}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.more} onPress={generateMore} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: '700' }}>Generate More Variations</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 25, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  slider: { paddingHorizontal: 20, gap: 15 },
  card: { width: width * 0.8, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  cardImg: { width: '100%', height: 250 },
  cardBody: { padding: 20 },
  name: { fontSize: 20, fontWeight: '800', marginVertical: 5 },
  more: { margin: 20, height: 60, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }
});

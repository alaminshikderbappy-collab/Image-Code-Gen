import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';

const { width } = Dimensions.get('window');

export default function StyleDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { index } = useLocalSearchParams<{ index: string }>();
  const { matches, frontImageUri } = useScan();
  const [active, setActive] = useState(0);

  const match = matches[Number(index)];
  if (!match) return null;
  const h = match.hairstyle;

  const views = [h.hdImageUrl, h.imageUrl, h.hdImageUrl, h.imageUrl];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView horizontal pagingEnabled onScroll={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / width))} style={{ height: 400 }}>
        {views.map((uri, i) => <Image key={i} source={{ uri }} style={{ width, height: 400 }} />)}
      </ScrollView>
      
      <View style={styles.nav}><TouchableOpacity onPress={() => router.back()} style={styles.blur}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity></View>

      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{h.name}</Text>
        
        <View style={styles.swap}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Style Swap Comparison</Text>
          <View style={styles.swapRow}>
             <View style={styles.swapHalf}><Image source={{ uri: frontImageUri }} style={styles.swapImg} /><Text style={styles.lbl}>BEFORE</Text></View>
             <Feather name="repeat" size={24} color={colors.primary} />
             <View style={styles.swapHalf}><Image source={{ uri: h.imageUrl }} style={styles.swapImg} /><Text style={styles.lbl}>AI LOOK</Text></View>
          </View>
        </View>

        <View style={[styles.aiBox, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>AI Stylist Rule</Text>
          <Text style={{ color: colors.mutedForeground, marginTop: 5 }}>{match.reasoning}</Text>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Show Barber Instructions</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { position: 'absolute', top: 40, left: 20 },
  blur: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 20 },
  swap: { marginBottom: 30 },
  swapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swapHalf: { width: '42%', alignItems: 'center' },
  swapImg: { width: '100%', height: 140, borderRadius: 15 },
  lbl: { fontSize: 10, marginTop: 5, fontWeight: 'bold' },
  aiBox: { padding: 20, borderRadius: 20, marginBottom: 30 },
  btn: { height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }
});

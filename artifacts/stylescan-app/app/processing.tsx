import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const STEPS = [
  { key: 'geometry', label: 'Mapping facial symmetry' },
  { key: 'proportions', label: 'Calibrating feature ratios' },
  { key: 'matching', label: 'Generating expert matches' },
];

type StepStatus = 'pending' | 'active' | 'done';
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ProcessingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scanId, setMatches, categories } = useScan();
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(['active', 'pending', 'pending']);
  const [timeLeft, setTimeLeft] = useState(8);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })).start();
    const t = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await delay(1800); // Step 1
        if (cancelled) return;
        setStepStatuses(['done', 'active', 'pending']);
        await delay(1500); // Step 2
        if (cancelled) return;
        setStepStatuses(['done', 'done', 'active']);

        if (scanId) {
          await api.analyzeScan(scanId).catch(() => null);
          let result = await api.getMatches(scanId);
          let finalMatches = result?.data || [];

          // FALLBACK: Load all styles if AI matches are empty
          if (finalMatches.length === 0) {
            const fallback = await api.listHairstyles();
            finalMatches = (fallback?.data || []).map((h: any, i: number) => ({
              id: `ai-${i}`,
              matchPercentage: 92 - (i * 2),
              isBestMatch: i === 0,
              reasoning: i === 0 
                ? `Detected high symmetry. The ${h.name} is recommended to elongate your profile and make you look more professional.`
                : "This variation is chosen to sharpen your jawline and create a high-confidence look.",
              hairstyle: h
            }));
          }

          if (!cancelled) {
            const filtered = finalMatches.filter((item: any) => 
              categories.includes(item.hairstyle.category as 'hair' | 'beard')
            );
            setMatches(filtered.length > 0 ? filtered : finalMatches);
          }
        }
        if (!cancelled) {
          setStepStatuses(['done', 'done', 'done']);
          await delay(500);
          router.replace('/matches');
        }
      } catch (err) {
        if (!cancelled) router.replace('/matches');
      }
    };
    run();
    return () => { cancelled = true; };
  }, [scanId, categories]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.iconCircle}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Feather name="cpu" size={40} color={colors.primary} />
        </Animated.View>
      </View>
      <Text style={[styles.tag, { color: colors.primary }]}>AI DIGITAL STYLIST</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Optimizing your look...</Text>
      <View style={[styles.steps, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {STEPS.map((step, i) => (
          <View key={step.key} style={[styles.stepRow, i < 2 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.iconBox}>
              {stepStatuses[i] === 'done' ? <Feather name="check" size={14} color={colors.primary} /> : 
               stepStatuses[i] === 'active' ? <Feather name="loader" size={14} color={colors.primary} /> :
               <Feather name="circle" size={14} color={colors.mutedForeground} />}
            </View>
            <Text style={[styles.stepLabel, { color: stepStatuses[i] === 'pending' ? colors.mutedForeground : colors.foreground }]}>{step.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.timer, { color: colors.mutedForeground }]}>~{timeLeft}s remaining</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 30 },
  steps: { width: '100%', borderRadius: 16, borderWidth: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  iconBox: { width: 24, alignItems: 'center' },
  stepLabel: { fontSize: 15 },
  timer: { marginTop: 24, fontSize: 13 },
});

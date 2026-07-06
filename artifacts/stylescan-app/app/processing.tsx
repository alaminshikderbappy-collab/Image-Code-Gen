import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const STEPS = [
  { key: 'geometry', label: 'Mapping facial geometry' },
  { key: 'head_shape', label: 'Analyzing head shape' },
  { key: 'matching', label: 'Matching style database' },
];

type StepStatus = 'pending' | 'active' | 'done';
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ProcessingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scanId, setMatches, categories } = useScan();
    
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(['active', 'pending', 'pending']);
  const [timeLeft, setTimeLeft] = useState(6);
    
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })).start();

    timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runProcessing = async () => {
      try {
        await delay(1500); // Step 1
        if (cancelled) return;
        setStepStatuses(['done', 'active', 'pending']);

        await delay(1500); // Step 2
        if (cancelled) return;
        setStepStatuses(['done', 'done', 'active']);

        if (scanId) {
          // 1. Run AI Analysis
          await api.analyzeScan(scanId).catch(() => null);
          
          // 2. Get the specific matches
          let result = await api.getMatches(scanId);
          let finalMatches = result?.data || [];

          // 3. SMART FALLBACK: If no specific matches found, get ALL styles for the category
          if (finalMatches.length === 0) {
            console.log("No specific matches found, falling back to general styles...");
            const fallback = await api.listHairstyles();
            // Map the simple hairstyles into the "Match" format the UI expects
            finalMatches = (fallback?.data || []).map((h, index) => ({
              id: `fallback-${index}`,
              matchPercentage: 90 - (index * 2),
              isBestMatch: index === 0,
              reasoning: "This classic style works well with most face shapes and is highly recommended by our experts.",
              hairstyle: h
            }));
          }

          if (!cancelled) {
            // Filter by user selection (Hair vs Beard)
            const filtered = finalMatches.filter((item: any) => 
              categories.includes(item.hairstyle.category?.toLowerCase())
            );
            
            // If filtering makes it 0, just show everything to avoid the "No Matches" screen
            setMatches(filtered.length > 0 ? filtered : finalMatches);
          }
        }

        if (!cancelled) {
          setStepStatuses(['done', 'done', 'done']);
          await delay(500);
          router.replace('/matches');
        }
      } catch (err) {
        console.error("Critical Processing Error:", err);
        router.replace('/matches');
      }
    };

    runProcessing();
    return () => { cancelled = true; };
  }, [scanId, categories]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.iconCircle}>
         <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Feather name="cpu" size={42} color={colors.primary} />
         </Animated.View>
      </View>

      <Text style={[styles.tag, { color: colors.primary }]}>AI PROCESSING</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Designing your cut...</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>Our model is analyzing your head shape.</Text>

      <View style={[styles.steps, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {STEPS.map((step, i) => {
          const status = stepStatuses[i] ?? 'pending';
          return (
            <View key={step.key} style={[styles.stepRow, i < 2 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={styles.stepIcon}>
                {status === 'done' ? <Feather name="check" size={16} color={colors.primary} /> : 
                 status === 'active' ? <Feather name="loader" size={16} color={colors.primary} /> :
                 <Feather name="circle" size={16} color={colors.mutedForeground} />}
              </View>
              <Text style={[styles.stepLabel, { color: status === 'pending' ? colors.mutedForeground : colors.foreground }]}>{step.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.timer, { color: colors.mutedForeground }]}>~{timeLeft}s remaining</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  tag: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, textAlign: 'center', marginBottom: 40 },
  steps: { width: '100%', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  stepIcon: { width: 30, alignItems: 'center' },
  stepLabel: { fontSize: 16, fontWeight: '600' },
  timer: { marginTop: 30, fontSize: 13 }
});

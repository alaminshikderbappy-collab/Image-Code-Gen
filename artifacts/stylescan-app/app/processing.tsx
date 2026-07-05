import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  
  // scanId, setMatches, and categories should come from your ScanContext
  const { scanId, setMatches, categories } = useScan(); 
    
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(['active', 'pending', 'pending']);
  const [timeLeft, setTimeLeft] = useState(6);
    
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulse2Anim = useRef(new Animated.Value(0.85)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    // Start background animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse2Anim, { toValue: 0.92, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse2Anim, { toValue: 0.85, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();

    // Visual timer countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runProcessing = async () => {
      try {
        // Step 1: Mapping
        await delay(1200);
        if (cancelled) return;
        setStepStatuses(['done', 'active', 'pending']);

        // Step 2: Analyzing
        await delay(1000);
        if (cancelled) return;
        setStepStatuses(['done', 'done', 'active']);

        // Step 3: API matching logic
        if (scanId) {
          try {
            await api.analyzeScan(scanId);
            const result = await api.getMatches(scanId);
              
            if (!cancelled && result?.data) {
              // Ensure we have a default if categories are empty
              const selectedCategories = (categories && categories.length > 0) 
                ? categories 
                : ['hair', 'beard'];

              const filteredMatches = result.data.filter((item: any) =>
                selectedCategories.includes(item.hairstyle.category)
              );
              setMatches(filteredMatches);
            }
          } catch (error) {
            console.error('API Error during processing:', error);
          }
        } else {
          await delay(1500); // Fallback delay for testing
        }

        if (!cancelled) {
          setStepStatuses(['done', 'done', 'done']);
          await delay(400);
          if (timerRef.current) clearInterval(timerRef.current);
            
          // Redirect to the results page
          router.replace('/matches');
        }
      } catch (err) {
        if (!cancelled) router.replace('/matches');
      }
    };

    runProcessing();

    return () => {
      cancelled = true;
    };
  }, [scanId, categories]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={styles.pulseContainer}>
        <Animated.View
          style={[styles.pulseRing2, { borderColor: colors.primary + '18', transform: [{ scale: pulse2Anim }] }]}
        />
        <Animated.View
          style={[styles.pulseRing1, { borderColor: colors.primary + '30', transform: [{ scale: pulseAnim }] }]}
        />
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Feather name="cpu" size={36} color={colors.primary} />
          </Animated.View>
        </View>
      </View>

      <Text style={[styles.tag, { color: colors.primary }]}>AI PROCESSING</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Reading your face,{'\n'}designing your cut.
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Our model is analyzing 47 data points{'\n'}across your scan.
      </Text>

      <View style={[styles.steps, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {STEPS.map((step, i) => {
          const status = stepStatuses[i] ?? 'pending';
          return (
            <View
              key={step.key}
              style={[
                styles.stepRow,
                i < STEPS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.stepIcon, { backgroundColor: status === 'active' ? colors.primary + '20' : 'transparent' }]}>
                {status === 'done' ? (
                  <Feather name="check" size={14} color={colors.primary} />
                ) : status === 'active' ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Feather name="loader" size={14} color={colors.primary} />
                  </Animated.View>
                ) : (
                  <Feather name="circle" size={14} color={colors.mutedForeground} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: status === 'pending' ? colors.mutedForeground : colors.foreground,
                    fontWeight: status === 'active' ? '600' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
              {status === 'active' && (
                <Text style={[styles.stepDots, { color: colors.mutedForeground }]}>...</Text>
              )}
            </View>
          );
        })}
      </View>

      <Text style={[styles.timer, { color: colors.mutedForeground }]}>
        ~{timeLeft}s remaining
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  pulseContainer: { alignItems: 'center', justifyContent: 'center', width: 180, height: 180, marginBottom: 32 },
  pulseRing2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1 },
  pulseRing1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5, marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 34, marginBottom: 10 },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 36 },
  steps: { width: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  stepIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { flex: 1, fontSize: 15 },
  stepDots: { fontSize: 15, letterSpacing: 1 },
  timer: { marginTop: 24, fontSize: 13 },
});

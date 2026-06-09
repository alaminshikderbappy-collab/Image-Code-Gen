import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width, height } = Dimensions.get('window');

const DIAL_SIZE = width * 0.72;
const TICK_COUNT = 40;

const ANGLE_LABELS = ['FRONT', 'SIDE', 'BACK', 'SIDE', 'FRONT'];

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId, categories, setScanId, setFrontImageUri } = useScan();

  const [step, setStep] = useState<1 | 2>(1);
  const [isCreatingScan, setIsCreatingScan] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCapturing360, setIsCapturing360] = useState(false);
  const [localScanId, setLocalScanId] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleCapture = async () => {
    if (isCreatingScan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let result: ImagePicker.ImagePickerResult;
      if (Platform.OS === 'web') {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
          cameraType: ImagePicker.CameraType.front,
        });
      }

      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      setCapturedUri(uri);
      setFrontImageUri(uri);
      setIsCreatingScan(true);

      const scan = await api.createScan(userId);
      setLocalScanId(scan.id);
      setScanId(scan.id);

      await api.updateFrontImage(scan.id, 'https://via.placeholder.com/400x533/1a1a1a/ffffff?text=StyleScan');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(2);
    } catch {
    } finally {
      setIsCreatingScan(false);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  const start360Capture = () => {
    if (isCapturing360) return;
    setIsCapturing360(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 1.25;
      setProgress(Math.min(p, 100));
      Animated.timing(progressAnim, {
        toValue: Math.min(p, 100) / 100,
        duration: 80,
        useNativeDriver: false,
      }).start();
      if (p >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/processing');
        }, 400);
      }
    }, 100);
  };

  const progressPct = Math.round(progress);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.stepPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stepPillText, { color: colors.foreground }]}>
            STEP {step} OF 2{step === 2 ? ' · 360° SCAN' : ''}
          </Text>
        </View>
        {step === 1 && (
          <TouchableOpacity style={styles.backBtn}>
            <Feather name="zap" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {step === 1 ? (
        /* ─── STEP 1: SELFIE ─── */
        <View style={styles.flex}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Slowly take a selfie
          </Text>
          <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
            Front facing, well lit.
          </Text>

          {/* Oval frame */}
          <View style={styles.ovalContainer}>
            <Animated.View
              style={[styles.oval, { borderColor: colors.primary, transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={[styles.ovalLabel, { color: colors.mutedForeground }]}>CAMERA PREVIEW</Text>
            {/* Corners */}
            {[
              { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((s, i) => (
              <View key={i} style={[styles.corner, { borderColor: colors.primary }, s]} />
            ))}
          </View>

          {/* Aligned pill */}
          <View style={[styles.alignedPill, { backgroundColor: colors.secondary }]}>
            <View style={[styles.greenDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.alignedText, { color: colors.foreground }]}>
              Face aligned. Hold still.
            </Text>
          </View>

          {/* Tip */}
          <View style={[styles.tip, { borderColor: colors.border, marginHorizontal: 24 }]}>
            <Feather name="sun" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: colors.foreground }]}>Find good lighting</Text>
              <Text style={[styles.tipSub, { color: colors.mutedForeground }]}>
                Face a window or stand under soft, even light for the most accurate scan.
              </Text>
            </View>
          </View>

          {/* Bottom actions */}
          <View style={[styles.bottomBar, { paddingBottom: botPad + 20 }]}>
            <TouchableOpacity style={styles.sideBtn} onPress={handleRetake}>
              <Text style={[styles.sideBtnText, { color: colors.foreground }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: colors.primary }]}
              onPress={handleCapture}
              disabled={isCreatingScan}
            >
              {isCreatingScan ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Feather name="camera" size={28} color={colors.primaryForeground} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn}>
              <Text style={[styles.sideBtnText, { color: colors.foreground }]}>Tips</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.tapCapture, { color: colors.mutedForeground }]}>TAP TO CAPTURE</Text>
        </View>
      ) : (
        /* ─── STEP 2: 360° SCAN ─── */
        <View style={styles.flex}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Slowly rotate your head
          </Text>
          <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
            Left to right. Keep your chin level.
          </Text>

          {/* Circular dial */}
          <View style={styles.dialContainer}>
            <View style={[styles.dial, { borderColor: colors.border }]}>
              {Array.from({ length: TICK_COUNT }).map((_, i) => {
                const angle = (i / TICK_COUNT) * 360;
                const rad = (angle * Math.PI) / 180;
                const r = DIAL_SIZE / 2 - 14;
                const x = r * Math.sin(rad);
                const y = -r * Math.cos(rad);
                return (
                  <View
                    key={i}
                    style={[
                      styles.tick,
                      {
                        backgroundColor: i / TICK_COUNT < progress / 100 ? colors.primary : colors.border,
                        transform: [{ translateX: x }, { translateY: y }, { rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}

              {/* Center label */}
              <View style={styles.dialCenter}>
                {isCapturing360 ? (
                  <>
                    <Text style={[styles.dialPct, { color: colors.primary }]}>{progressPct}%</Text>
                    <Text style={[styles.dialSub, { color: colors.mutedForeground }]}>scanning</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.rotatePill, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.rotatePillText, { color: colors.primaryForeground }]}>ROTATE</Text>
                    </View>
                    <Feather name="refresh-cw" size={22} color={colors.mutedForeground} style={{ marginTop: 8 }} />
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progContainer, { marginHorizontal: 24 }]}>
            <View style={styles.progLabels}>
              {ANGLE_LABELS.map((l, i) => (
                <Text key={i} style={[styles.progLabel, { color: colors.mutedForeground }]}>{l}</Text>
              ))}
            </View>
            <View style={[styles.progTrack, { backgroundColor: colors.secondary }]}>
              <Animated.View
                style={[
                  styles.progFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>
            <View style={styles.progMeta}>
              <Text style={[styles.progMetaText, { color: colors.mutedForeground }]}>CAPTURING ANGLES</Text>
              <Text style={[styles.progPct, { color: colors.foreground }]}>{progressPct}%</Text>
            </View>
          </View>

          {/* Start button */}
          {!isCapturing360 && (
            <View style={{ paddingHorizontal: 24, marginTop: 20, paddingBottom: botPad + 20 }}>
              <TouchableOpacity
                style={[styles.startRotateBtn, { backgroundColor: colors.primary }]}
                onPress={start360Capture}
              >
                <Feather name="refresh-cw" size={18} color={colors.primaryForeground} />
                <Text style={[styles.startRotateBtnText, { color: colors.primaryForeground }]}>
                  Start Rotating
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  stepPillText: { fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  stepTitle: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  stepSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4 },
  ovalContainer: { alignSelf: 'center', marginTop: 20, width: width * 0.7, height: width * 0.85, alignItems: 'center', justifyContent: 'center' },
  oval: { width: '100%', height: '100%', borderRadius: width * 0.35, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  ovalLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', letterSpacing: 1, textAlign: 'center' },
  corner: { position: 'absolute', width: 22, height: 22 },
  alignedPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, marginTop: 16 },
  greenDot: { width: 8, height: 8, borderRadius: 4 },
  alignedText: { fontSize: 14, fontFamily: 'Inter_500Medium', fontWeight: '500' as const },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 16 },
  tipTitle: { fontSize: 14, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  tipSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 40, marginTop: 'auto', paddingTop: 20 },
  sideBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  sideBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', fontWeight: '500' as const },
  captureBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  tapCapture: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', letterSpacing: 1.5, paddingBottom: 12 },
  dialContainer: { alignItems: 'center', marginTop: 24 },
  dial: { width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_SIZE / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tick: { position: 'absolute', width: 2, height: 8, borderRadius: 1 },
  dialCenter: { alignItems: 'center', justifyContent: 'center' },
  dialPct: { fontSize: 36, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  dialSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  rotatePill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  rotatePillText: { fontSize: 12, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  progContainer: { marginTop: 24 },
  progLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', fontWeight: '600' as const, letterSpacing: 0.5 },
  progTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 2 },
  progMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progMetaText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700' as const, letterSpacing: 0.8 },
  progPct: { fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  startRotateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  startRotateBtnText: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
});

import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerMenu } from '@/components/DrawerMenu';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';

const { height } = Dimensions.get('window');

const HERO_1 = require('@/assets/images/hero_hair.png');
const HERO_2 = require('@/assets/images/hero_beard.png');
const HERO_3 = require('@/assets/images/hero_look.png');

const SLIDES = [
  {
    image: HERO_1,
    line1: 'Perfect haircut,',
    line2: 'matched to your face.',
  },
  {
    image: HERO_2,
    line1: 'Beard that fits',
    line2: 'your jawline perfectly.',
  },
  {
    image: HERO_3,
    line1: 'Complete style,',
    line2: 'hair, beard & beyond.',
  },
];

const STEPS = [
  { num: '1', icon: 'camera' as const, title: 'Take a selfie', desc: 'Front facing, well lit.' },
  { num: '2', icon: 'rotate-cw' as const, title: '360° head scan', desc: 'Slowly rotate. We map every angle.' },
  { num: '3', icon: 'star' as const, title: 'Get your matches', desc: '5 cuts ranked by AI.' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, toggleCategory } = useScan();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [activeSlide, setActiveSlide] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // One animated opacity per slide for crossfade
  const opacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  // Text fade for the changing word
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;

        // Fade out current image, fade in next
        Animated.parallel([
          Animated.timing(opacities[prev], {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacities[next], {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start();

        // Flash the text
        Animated.sequence([
          Animated.timing(textOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start();

        return next;
      });
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── HERO ── */}
        <View style={[styles.hero, { height: height * 0.64 }]}>
          {/* Stacked images for crossfade */}
          {SLIDES.map((slide, i) => (
            <Animated.View
              key={i}
              style={[StyleSheet.absoluteFill, { opacity: opacities[i] }]}
            >
              <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Animated.View>
          ))}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', colors.background]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* ── Top nav bar ── */}
          <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
            <TouchableOpacity style={styles.navBtn} onPress={() => setDrawerOpen(true)}>
              <Ionicons name="menu" size={24} color={colors.foreground} />
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="content-cut" size={14} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.appName, { color: colors.foreground }]}>StyleScan</Text>
            </View>

            <TouchableOpacity style={styles.navBtn}>
              <Ionicons name="sparkles-outline" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* ── Badges ── */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(30,30,30,0.82)', borderColor: colors.border }]}>
              <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.badgeText, { color: colors.foreground }]}>AI POWERED</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(30,30,30,0.82)', borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>96% match</Text>
            </View>
          </View>

          {/* ── Hero copy ── */}
          <View style={styles.heroCopy}>
            <Text style={[styles.tagline, { color: colors.primary }]}>STEP INTO YOUR LOOK</Text>

            <Animated.View style={{ opacity: textOpacity }}>
              <Text style={[styles.heroLine1, { color: colors.foreground }]}>
                {SLIDES[activeSlide].line1}
              </Text>
              <Text style={[styles.heroLine2, { color: colors.primary }]}>
                {SLIDES[activeSlide].line2}
              </Text>
            </Animated.View>

            <Text style={[styles.heroSub, { color: 'rgba(255,255,255,0.60)' }]}>
              Point your camera — AI matches the style{'\n'}that actually fits your face.
            </Text>

            {/* Dot indicators */}
            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    const prev = activeSlide;
                    Animated.parallel([
                      Animated.timing(opacities[prev], { toValue: 0, duration: 500, useNativeDriver: true }),
                      Animated.timing(opacities[i], { toValue: 1, duration: 500, useNativeDriver: true }),
                    ]).start();
                    setActiveSlide(i);
                  }}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === activeSlide ? colors.primary : 'rgba(255,255,255,0.35)',
                        width: i === activeSlide ? 22 : 8,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── How it works ── */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How it works</Text>
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>3 steps</Text>
          </View>
          {STEPS.map((step, i) => (
            <View key={i} style={[styles.stepRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumText, { color: colors.primaryForeground }]}>{step.num}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>
          ))}
        </View>

        {/* ── Trust badges ── */}
        <View style={[styles.trustRow, { paddingHorizontal: 20 }]}>
          {[
            { icon: 'lock' as const, label: 'Photos stay\non your device' },
            { icon: 'zap' as const, label: 'Results in\n30 seconds' },
            { icon: 'user-x' as const, label: 'No account\nrequired' },
          ].map((item) => (
            <View key={item.label} style={[styles.trustCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={item.icon} size={18} color={colors.primary} />
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Category multi-select ── */}
        <View style={[styles.catSection, { paddingHorizontal: 20 }]}>
          <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>WHAT ARE YOU STYLING TODAY?</Text>
          <View style={styles.catRow}>
            {(['hair', 'beard'] as const).map((cat) => {
              const active = categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    toggleCategory(cat);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: active ? colors.primaryForeground : colors.mutedForeground,
                      backgroundColor: active ? colors.primaryForeground + '30' : 'transparent' }
                  ]}>
                    {active && <Feather name="check" size={10} color={active ? colors.primaryForeground : colors.mutedForeground} />}
                  </View>
                  <MaterialCommunityIcons
                    name={cat === 'hair' ? 'content-cut' : 'face-man'}
                    size={18}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text style={[
                    styles.catBtnText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}>
                    {cat === 'hair' ? 'Hair' : 'Beard'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {categories.length === 2 && (
            <View style={[styles.bothBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
              <Feather name="check-circle" size={13} color={colors.primary} />
              <Text style={[styles.bothBadgeText, { color: colors.primary }]}>
                Great — we'll match both your hair & beard style
              </Text>
            </View>
          )}
        </View>

        {/* ── Start Scan CTA ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={20} color={colors.primaryForeground} />
            <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
              Start Scan →
            </Text>
          </TouchableOpacity>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Free to use · Your photos never leave your device
          </Text>
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          BUILT FOR MEN · POWERED BY AI
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: { position: 'relative', overflow: 'hidden' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  navBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 17, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 12,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 3.5 },
  badgeText: { fontSize: 12, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  heroCopy: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  heroLine1: {
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
  },
  heroLine2: {
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 14,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 4, borderRadius: 2 },

  // Category
  catSection: { marginTop: 20 },
  catLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  catRow: { flexDirection: 'row', gap: 10 },
  catBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBtnText: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  bothBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  bothBadgeText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },

  // CTA
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  startBtnText: { fontSize: 17, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  meta: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8 },

  // How it works
  section: { marginTop: 30 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  sectionMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  stepNum: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  stepDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // Trust badges
  trustRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  trustCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  trustLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 15,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1.5,
    marginTop: 28,
  },
});

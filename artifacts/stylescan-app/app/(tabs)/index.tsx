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
  { num: '1', icon: 'camera' as const, title: 'Upload photos', desc: 'Front facing, well lit.' },
  { num: '2', icon: 'layers' as const, title: '4-Angle head scan', desc: 'We map your face, sides, and back.' },
  { num: '3', icon: 'star' as const, title: 'Get your matches', desc: 'Top styles ranked by AI.' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, toggleCategory } = useScan();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [activeSlide, setActiveSlide] = useState(0);

  const opacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        Animated.parallel([
          Animated.timing(opacities[prev], { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.timing(opacities[next], { toValue: 1, duration: 700, useNativeDriver: true }),
        ]).start();

        Animated.sequence([
          Animated.timing(textOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start();
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/scan');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        
        {/* HERO SECTION */}
        <View style={[styles.hero, { height: height * 0.65 }]}>
          {SLIDES.map((slide, i) => (
            <Animated.View key={i} style={[StyleSheet.absoluteFill, { opacity: opacities[i] }]}>
              <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Animated.View>
          ))}
          
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', colors.background]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Nav Header */}
          <View style={[styles.navBar, { paddingTop: topPad + 10 }]}>
             <View style={styles.navCenter}>
                <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="content-cut" size={14} color="#fff" />
                </View>
                <Text style={[styles.appName, { color: colors.foreground }]}>StyleScan AI</Text>
             </View>
             <TouchableOpacity style={styles.navBtn}>
                <Ionicons name="sparkles-outline" size={22} color={colors.foreground} />
             </TouchableOpacity>
          </View>

          {/* Hero Content */}
          <View style={styles.heroCopy}>
            <Text style={[styles.tagline, { color: colors.primary }]}>DESIGNED FOR YOU</Text>
            <Animated.View style={{ opacity: textOpacity }}>
              <Text style={[styles.heroLine1, { color: colors.foreground }]}>{SLIDES[activeSlide].line1}</Text>
              <Text style={[styles.heroLine2, { color: colors.primary }]}>{SLIDES[activeSlide].line2}</Text>
            </Animated.View>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Our AI analyzes your unique geometry to suggest hairstyles and beard shapes that truly fit.
            </Text>
          </View>
        </View>

        {/* CATEGORY SELECTOR */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>WHAT ARE WE STYLING?</Text>
          <View style={styles.catRow}>
            {(['hair', 'beard'] as const).map((cat) => {
              const active = categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, { 
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border 
                  }]}
                  onPress={() => {
                    toggleCategory(cat);
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                  }}
                >
                  <MaterialCommunityIcons
                    name={cat === 'hair' ? 'content-cut' : 'face-man'}
                    size={20}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text style={[styles.catBtnText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                    {cat === 'hair' ? 'Hair' : 'Beard'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* STEPS SECTION */}
        <View style={[styles.section, { paddingHorizontal: 20, marginTop: 40 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How it works</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={[styles.stepRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.stepNumText, { color: colors.foreground }]}>{step.num}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CALL TO ACTION */}
        <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={handleStart}>
            <Feather name="camera" size={20} color={colors.primaryForeground} />
            <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>Start 4-Angle Scan</Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            No account required · Private & Secure
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { position: 'relative', overflow: 'hidden' },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between', zIndex: 10 },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 18, fontWeight: '800' },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 10 },
  tagline: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  heroLine1: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  heroLine2: { fontSize: 34, fontWeight: '800', lineHeight: 40, marginBottom: 12 },
  heroSub: { fontSize: 14, lineHeight: 22 },
  section: { marginTop: 24 },
  catLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  catRow: { flexDirection: 'row', gap: 12 },
  catBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16, borderWidth: 1 },
  catBtnText: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, gap: 16 },
  stepNum: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 14, fontWeight: '800' },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stepDesc: { fontSize: 13 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20, borderRadius: 18 },
  startBtnText: { fontSize: 18, fontWeight: '800' },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: 12, opacity: 0.7 }
});

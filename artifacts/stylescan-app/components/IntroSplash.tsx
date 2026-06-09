import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ND = Platform.OS !== 'web';

const { width, height } = Dimensions.get('window');

type Props = { onFinish: () => void };

export function IntroSplash({ onFinish }: Props) {
  // Master opacity for entire screen fade in/out
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Scissors rotation and scale
  const scissorsRotate = useRef(new Animated.Value(0)).current;
  const scissorsScale = useRef(new Animated.Value(0.3)).current;

  // Gold ring pulse
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Outer glow pulse
  const glowScale = useRef(new Animated.Value(0.4)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Text elements
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(18)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  // Snip animation: second blade rotates to open/close scissors
  const snipAngle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const snipLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(snipAngle, { toValue: 1, duration: 380, useNativeDriver: ND }),
        Animated.timing(snipAngle, { toValue: 0, duration: 320, useNativeDriver: ND }),
        Animated.delay(300),
      ]),
      { iterations: 4 }
    );

    Animated.sequence([
      // 1. Glow ring bursts in
      Animated.parallel([
        Animated.spring(ringScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: ND }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 300, useNativeDriver: ND }),
        Animated.spring(glowScale, { toValue: 1, tension: 50, friction: 9, useNativeDriver: ND }),
        Animated.timing(glowOpacity, { toValue: 0.35, duration: 400, useNativeDriver: ND }),
      ]),

      // 2. Scissors drop in and spin
      Animated.parallel([
        Animated.spring(scissorsScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: ND }),
        Animated.timing(scissorsRotate, { toValue: 1, duration: 600, useNativeDriver: ND }),
      ]),

      // 3. Snip-snip animation runs
      snipLoop,

      // 4. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: ND }),
        Animated.spring(titleY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: ND }),
      ]),

      // 5. Subtitle
      Animated.timing(subOpacity, { toValue: 1, duration: 280, useNativeDriver: ND }),

      // 6. Tagline
      Animated.timing(tagOpacity, { toValue: 1, duration: 250, useNativeDriver: ND }),

      // 7. Hold
      Animated.delay(600),

      // 8. Fade out entire screen
      Animated.timing(screenOpacity, { toValue: 0, duration: 450, useNativeDriver: ND }),
    ]).start(() => onFinish());
  }, []);

  const scissorsRotateStyle = {
    transform: [
      {
        rotate: scissorsRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['-90deg', '0deg'],
        }),
      },
      { scale: scissorsScale },
    ],
  };

  const snipStyle = {
    transform: [
      {
        rotate: snipAngle.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '28deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Gold ring */}
      <Animated.View
        style={[
          styles.ring,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />

      {/* Scissors icon with snip animation */}
      <Animated.View style={[styles.iconWrap, scissorsRotateStyle]}>
        {/* Static blade */}
        <MaterialCommunityIcons name="content-cut" size={72} color="#F5B800" />
        {/* Animated snip overlay simulated via second layer */}
        <Animated.View style={[styles.snipBlade, snipStyle]}>
          <View style={styles.snipLine} />
        </Animated.View>
      </Animated.View>

      {/* Barber pole accent lines */}
      <View style={styles.poleWrap}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.poleLine,
              { backgroundColor: i === 1 ? '#F5B800' : 'rgba(245,184,0,0.35)' },
            ]}
          />
        ))}
      </View>

      {/* Text */}
      <Animated.Text
        style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
      >
        StyleScan
      </Animated.Text>

      <Animated.Text style={[styles.sub, { opacity: subOpacity }]}>
        AI HAIR STUDIO
      </Animated.Text>

      <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>
        Find your perfect style
      </Animated.Text>
    </Animated.View>
  );
}

const RING = 140;
const GLOW = 240;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    backgroundColor: '#F5B800',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: '#F5B800',
    backgroundColor: 'transparent',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  snipBlade: {
    position: 'absolute',
    bottom: 16,
    right: 10,
    transformOrigin: 'top center',
  },
  snipLine: {
    width: 3,
    height: 28,
    backgroundColor: '#0A0A0A',
    borderRadius: 2,
  },
  poleWrap: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 24,
    marginBottom: 28,
  },
  poleLine: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  sub: {
    fontSize: 12,
    color: '#F5B800',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 3.5,
    marginTop: 6,
  },
  tag: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});

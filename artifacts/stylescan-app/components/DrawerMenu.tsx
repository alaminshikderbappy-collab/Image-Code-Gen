import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

type Props = { visible: boolean; onClose: () => void };

const NAV_ITEMS = [
  { icon: 'home' as const, iconLib: 'feather', label: 'Home', route: '/' },
  { icon: 'camera' as const, iconLib: 'feather', label: 'New Scan', route: '/scan' },
  { icon: 'clock' as const, iconLib: 'feather', label: 'Scan History', route: '/saved' },
];

const BOTTOM_ITEMS = [
  { icon: 'star' as const, iconLib: 'feather', label: 'Rate the app' },
  { icon: 'share-2' as const, iconLib: 'feather', label: 'Share with a friend' },
  { icon: 'help-circle' as const, iconLib: 'feather', label: 'Help & support' },
  { icon: 'settings' as const, iconLib: 'feather', label: 'Settings' },
];

export function DrawerMenu({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const ND = Platform.OS !== 'web';
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: ND,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: ND,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: ND,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: ND,
        }),
      ]).start();
    }
  }, [visible]);

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as never), 260);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.card,
            paddingTop: topPad,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.drawerBrand}>
            <View style={[styles.drawerLogo, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="content-cut" size={16} color={colors.primaryForeground} />
            </View>
            <View>
              <Text style={[styles.drawerBrandName, { color: colors.foreground }]}>StyleScan</Text>
              <Text style={[styles.drawerBrandSub, { color: colors.mutedForeground }]}>AI HAIR STUDIO</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={onClose}
          >
            <Feather name="x" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Sign in row */}
        <TouchableOpacity
          style={[styles.signInRow, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
          activeOpacity={0.8}
        >
          <View style={[styles.signInIcon, { backgroundColor: colors.primary + '25' }]}>
            <Feather name="log-in" size={18} color={colors.primary} />
          </View>
          <View style={styles.signInText}>
            <Text style={[styles.signInTitle, { color: colors.primary }]}>Sign in</Text>
            <Text style={[styles.signInSub, { color: colors.mutedForeground }]}>Save scans across devices</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Nav items */}
        <View style={[styles.navSection, { borderBottomColor: colors.border }]}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => navigate(item.route)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={20} color={colors.mutedForeground} />
              <Text style={[styles.navLabel, { color: colors.foreground }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom items */}
        <View style={styles.navSection}>
          {BOTTOM_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={20} color={colors.mutedForeground} />
              <Text style={[styles.navLabel, { color: colors.foreground }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.drawerFooterText, { color: colors.mutedForeground }]}>
            V1.0 · MADE FOR MEN
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  drawerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBrandName: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  drawerBrandSub: { fontSize: 10, fontFamily: 'Inter_400Regular', letterSpacing: 1.2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
    gap: 12,
  },
  signInIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: { flex: 1 },
  signInTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  signInSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  navSection: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  navLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },

  drawerFooter: { marginTop: 'auto', paddingHorizontal: 20, paddingTop: 16 },
  drawerFooterText: { fontSize: 11, fontFamily: 'Inter_400Regular', letterSpacing: 1.5 },
});

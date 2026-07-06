import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, Dimensions, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');
const STEPS = [
  { key: 'front', label: 'Front View' },
  { key: 'left', label: 'Left Side' },
  { key: 'right', label: 'Right Side' },
  { key: 'back', label: 'Back View' },
];

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const { userId, setScanId, setFrontImageUri } = useScan();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [stepIndex, setStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Auto-capture logic: Starts if user holds still (simulated by 3s timer on screen entry)
  useEffect(() => {
    if (permission?.granted && capturedImages.length === 0 && !countdown) {
      setCountdown(3);
    }
  }, [permission]);

  useEffect(() => {
    if (countdown === 0) {
      takePicture();
      setCountdown(null);
    }
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const toggleCamera = () => setFacing(prev => prev === 'front' ? 'back' : 'front');

  const handleImageAdded = (uri: string) => {
    const newImages = [...capturedImages, uri];
    setCapturedImages(newImages);
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finishScan(newImages);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled) handleImageAdded(result.assets[0].uri);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) handleImageAdded(photo.uri);
    } catch {
      Alert.alert("Camera Error", "Try using Gallery upload.");
    }
  };

  const finishScan = async (imagesToUse: string[]) => {
    setIsProcessing(true);
    try {
      const scan = await api.createScan(userId);
      setScanId(scan.id);
      setFrontImageUri(imagesToUse[0]);
      await api.updateFrontImage(scan.id, imagesToUse[0]);
      router.replace('/processing');
    } catch {
      router.replace('/processing'); // Fallback for demo
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', padding: 30 }]}>
        <Feather name="camera" size={50} color={colors.primary} style={{alignSelf:'center', marginBottom: 20}} />
        <Text style={{ color: colors.foreground, textAlign: 'center', fontSize: 18, fontWeight: '700' }}>Camera Access Needed</Text>
        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: colors.primary, marginTop: 30 }]} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing}>
        <View style={[styles.overlay, { paddingTop: insets.top + 15 }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><Feather name="x" size={24} color="#fff" /></TouchableOpacity>
            <View style={styles.progressRow}>
               {STEPS.map((_, i) => <View key={i} style={[styles.pDot, { backgroundColor: i <= stepIndex ? colors.primary : 'rgba(255,255,255,0.2)' }]} />)}
            </View>
            <TouchableOpacity onPress={toggleCamera} style={styles.iconBtn}><Ionicons name="camera-reverse" size={24} color="#fff" /></TouchableOpacity>
          </View>

          {/* Center Guide */}
          <View style={styles.center}>
             {countdown !== null && <Text style={styles.timerText}>{countdown}</Text>}
             <View style={[styles.oval, { borderColor: countdown ? '#fff' : colors.primary }]} />
             <Text style={styles.stepLabel}>{STEPS[stepIndex].label}</Text>
             {capturedImages.length > 0 && (
               <TouchableOpacity style={styles.skipBtn} onPress={() => finishScan(capturedImages)}>
                  <Text style={{color: colors.primary, fontWeight: '700'}}>Analyze 1 Photo Only →</Text>
               </TouchableOpacity>
             )}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
             <View style={styles.thumbScroll}>
                {capturedImages.map((uri, i) => <Image key={i} source={{ uri }} style={styles.mini} />)}
             </View>
             
             <View style={styles.controls}>
                <TouchableOpacity onPress={pickFromGallery} style={styles.iconBtn}><Feather name="image" size={24} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.shutter} onPress={takePicture} disabled={isProcessing}>
                   <View style={styles.shutterInner} />
                </TouchableOpacity>
                <View style={{width: 44}} />
             </View>
          </View>

        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  progressRow: { flexDirection: 'row', gap: 6 },
  pDot: { width: 25, height: 4, borderRadius: 2 },
  center: { alignItems: 'center' },
  timerText: { color: '#fff', fontSize: 64, fontWeight: '800', position: 'absolute', top: -100 },
  oval: { width: width * 0.7, height: width * 0.9, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed' },
  stepLabel: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 20 },
  skipBtn: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  footer: { alignItems: 'center' },
  thumbScroll: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  mini: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#fff' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  mainBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});

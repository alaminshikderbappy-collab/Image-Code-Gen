import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform
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

  const [stepIndex, setStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-request permission on mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View style={{flex:1, backgroundColor:'#000'}} />;
  
  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', padding: 40 }]}>
        <Feather name="camera-off" size={64} color={colors.primary} style={{ alignSelf: 'center' }} />
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 24 }}>
          Camera Access Required
        </Text>
        <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 12, marginBottom: 32 }}>
          We need your camera to perform the 360° head scan. Please allow access in your browser settings.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
          onPress={requestPermission}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 16 }}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        const newImages = [...capturedImages, photo.uri];
        setCapturedImages(newImages);
        if (stepIndex < STEPS.length - 1) {
          setStepIndex(stepIndex + 1);
        } else {
          handleFinish(newImages);
        }
      }
    } catch (err) {
      Alert.alert("Camera Error", "Try refreshing the page.");
    }
  };

  const handleFinish = async (allImages: string[]) => {
    setIsProcessing(true);
    try {
      const scan = await api.createScan(userId);
      setScanId(scan.id);
      setFrontImageUri(allImages[0]);
      await api.updateFrontImage(scan.id, allImages[0]);
      router.replace('/processing');
    } catch (error) {
      router.replace('/processing'); // Fallback for demo
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front">
        <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              {STEPS.map((_, i) => (
                <View key={i} style={[styles.progressDot, { backgroundColor: i <= stepIndex ? colors.primary : 'rgba(255,255,255,0.2)' }]} />
              ))}
            </View>
          </View>

          <View style={styles.guideFrame}>
             <View style={[styles.oval, { borderColor: colors.primary }]} />
             <Text style={styles.guideText}>{STEPS[stepIndex].label}</Text>
             <Text style={styles.subGuide}>Align your face within the frame</Text>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 30 }]}>
            <View style={styles.thumbnailRow}>
               {capturedImages.map((uri, i) => (
                 <Image key={i} source={{ uri }} style={styles.miniThumb} />
               ))}
            </View>
            <TouchableOpacity style={styles.captureCircle} onPress={takePicture} disabled={isProcessing}>
               {isProcessing ? <ActivityIndicator color={colors.primary} /> : <View style={[styles.captureInner, {backgroundColor: '#fff'}]} />}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  progressDot: { width: 30, height: 4, borderRadius: 2 },
  guideFrame: { alignItems: 'center' },
  oval: { width: width * 0.65, height: width * 0.85, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed' },
  guideText: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 20 },
  subGuide: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },
  bottomBar: { alignItems: 'center' },
  thumbnailRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  miniThumb: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#fff' },
  captureCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', padding: 4, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: '100%', height: '100%', borderRadius: 30 }
});

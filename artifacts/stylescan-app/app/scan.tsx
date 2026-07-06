import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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
  Platform,
  ScrollView
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

  const [useCamera, setUseCamera] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-request camera permission
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        handleImageAdded(photo.uri);
      }
    } catch (err) {
      Alert.alert("Camera Error", "Please try the 'Upload from Gallery' option.");
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleImageAdded(result.assets[0].uri);
    }
  };

  const handleImageAdded = (uri: string) => {
    const newImages = [...capturedImages, uri];
    setCapturedImages(newImages);
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finishScan(newImages);
    }
  };

  const finishScan = async (allImages: string[]) => {
    setIsProcessing(true);
    try {
      const scan = await api.createScan(userId);
      setScanId(scan.id);
      setFrontImageUri(allImages[0]);
      await api.updateFrontImage(scan.id, allImages[0]);
      router.replace('/processing');
    } catch (error) {
      router.replace('/processing'); // Fallback for demo flow
    } finally {
      setIsProcessing(false);
    }
  };

  // If no permission or camera fails, show Gallery Upload UI
  if (!useCamera || (permission && !permission.granted)) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.foreground} /></TouchableOpacity>
           <Text style={[styles.headerTitle, { color: colors.foreground }]}>Gallery Upload</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: colors.mutedForeground, marginBottom: 20 }}>
            Camera is disabled. Please upload your 4 photos manually.
          </Text>
          <View style={styles.galleryGrid}>
             {STEPS.map((step, i) => (
               <TouchableOpacity 
                 key={step.key} 
                 style={[styles.gallerySlot, { backgroundColor: colors.card, borderColor: capturedImages[i] ? colors.primary : colors.border }]}
                 onPress={pickFromGallery}
                 disabled={i > capturedImages.length}
               >
                 {capturedImages[i] ? (
                   <Image source={{ uri: capturedImages[i] }} style={StyleSheet.absoluteFill} />
                 ) : (
                   <View style={{ alignItems: 'center' }}>
                      <Feather name="plus" size={24} color={colors.mutedForeground} />
                      <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{step.label}</Text>
                   </View>
                 )}
               </TouchableOpacity>
             ))}
          </View>
          <TouchableOpacity 
            style={[styles.toggleBtn, { marginTop: 40 }]} 
            onPress={() => setUseCamera(true)}
          >
            <Text style={{ color: colors.primary }}>Try Camera Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front">
        <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.blurBtn}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.progress}>
               {STEPS.map((_, i) => (
                 <View key={i} style={[styles.dot, { backgroundColor: i <= stepIndex ? colors.primary : 'rgba(255,255,255,0.2)' }]} />
               ))}
            </View>
            <TouchableOpacity onPress={() => setUseCamera(false)} style={styles.blurBtn}>
              <Feather name="image" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.center}>
             <View style={[styles.oval, { borderColor: colors.primary }]} />
             <Text style={styles.guideTitle}>{STEPS[stepIndex].label}</Text>
             <Text style={styles.guideSub}>Keep your head steady</Text>
          </View>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
             <View style={styles.thumbs}>
                {capturedImages.map((uri, i) => <Image key={i} source={{ uri }} style={styles.miniThumb} />)}
             </View>
             <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
             </TouchableOpacity>
             <TouchableOpacity onPress={pickFromGallery}>
                <Text style={{ color: '#fff', textDecorationLine: 'underline', marginTop: 15 }}>Upload from Gallery</Text>
             </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  blurBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 6 },
  dot: { width: 25, height: 4, borderRadius: 2 },
  center: { alignItems: 'center' },
  oval: { width: width * 0.65, height: width * 0.85, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed' },
  guideTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 24 },
  guideSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  bottom: { alignItems: 'center' },
  thumbs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  miniThumb: { width: 35, height: 35, borderRadius: 6, borderWidth: 1, borderColor: '#fff' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', padding: 5, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: '100%', height: '100%', borderRadius: 35, backgroundColor: '#fff' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  gallerySlot: { width: '47%', height: 150, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  toggleBtn: { alignSelf: 'center', padding: 10 }
});

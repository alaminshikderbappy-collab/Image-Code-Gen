import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, Dimensions, ScrollView
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
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo) handleImageAdded(photo.uri);
  };

  const finishScan = async (allImages: string[]) => {
    setIsProcessing(true);
    try {
      const scan = await api.createScan(userId);
      setScanId(scan.id);
      setFrontImageUri(allImages[0]);
      await api.updateFrontImage(scan.id, allImages[0]);
      router.replace('/processing');
    } catch {
      router.replace('/processing');
    }
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', padding: 20 }]}>
        <Text style={{ color: colors.foreground, textAlign: 'center', fontSize: 18, marginBottom: 20 }}>Camera Access Needed</Text>
        <TouchableOpacity style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 10 }} onPress={requestPermission}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={pickFromGallery}>
          <Text style={{ color: colors.primary, textAlign: 'center' }}>Or Upload from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front">
        <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={28} color="#fff" /></TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{STEPS[stepIndex].label}</Text>
            <TouchableOpacity onPress={pickFromGallery}><Feather name="image" size={28} color="#fff" /></TouchableOpacity>
          </View>
          <View style={styles.center}><View style={[styles.oval, { borderColor: colors.primary }]} /></View>
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={isProcessing}>
               {isProcessing ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
            </TouchableOpacity>
            <Text style={{ color: '#fff', marginTop: 10 }}>Step {stepIndex + 1} of 4</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  center: { alignItems: 'center' },
  oval: { width: width * 0.7, height: width * 0.9, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed' },
  bottom: { alignItems: 'center' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }
});

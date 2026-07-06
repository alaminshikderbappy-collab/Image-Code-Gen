import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, Dimensions, Alert, Modal, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/utils/api';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const { userId, setScanId, setFrontImageUri } = useScan();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) setCapturedImages(prev => [...prev, photo.uri]);
    } catch {
      Alert.alert("Camera Error", "Try using Gallery upload.");
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled) setCapturedImages(prev => [...prev, result.assets[0].uri]);
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (capturedImages.length === 0) return;
    setIsProcessing(true);
    try {
      const scan = await api.createScan(userId);
      setScanId(scan.id);
      setFrontImageUri(capturedImages[0]);
      await api.updateFrontImage(scan.id, capturedImages[0]);
      router.replace('/processing');
    } catch {
      router.replace('/processing');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', padding: 30 }]}>
        <Text style={{ color: colors.foreground, textAlign: 'center', fontSize: 18, marginBottom: 20 }}>Camera Access Required</Text>
        <TouchableOpacity style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 12 }} onPress={requestPermission}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing}>
        <View style={[styles.overlay, { paddingTop: insets.top + 15 }]}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
            <Text style={styles.countText}>{capturedImages.length} Captures</Text>
            <TouchableOpacity onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')} style={styles.iconBtn}><Ionicons name="camera-reverse" size={24} color="#fff" /></TouchableOpacity>
          </View>

          <View style={styles.center}><View style={[styles.oval, { borderColor: colors.primary }]} /></View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbContainer}>
                {capturedImages.map((uri, i) => (
                  <View key={i} style={styles.thumbWrapper}>
                    <TouchableOpacity onPress={() => setPreviewImage(uri)}>
                      <Image source={{ uri }} style={styles.thumb} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeImage(i)}>
                      <Feather name="x" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
             </ScrollView>
             
             <View style={styles.controls}>
                <TouchableOpacity onPress={pickFromGallery} style={styles.iconBtn}><Feather name="image" size={24} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.shutter} onPress={takePicture}><View style={styles.shutterInner} /></TouchableOpacity>
                {capturedImages.length > 0 ? (
                  <TouchableOpacity style={[styles.analyzeBtn, {backgroundColor: colors.primary}]} onPress={startAnalysis}>
                    <Text style={styles.analyzeText}>Analyze ({capturedImages.length})</Text>
                  </TouchableOpacity>
                ) : <View style={{width: 80}} />}
             </View>
          </View>
        </View>
      </CameraView>

      <Modal visible={!!previewImage} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <Image source={{uri: previewImage || ''}} style={styles.fullPreview} resizeMode="contain" />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPreviewImage(null)}>
            <Text style={styles.closeText}>Close Preview</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  countText: { color: '#fff', fontWeight: 'bold' },
  center: { alignItems: 'center' },
  oval: { width: width * 0.7, height: width * 0.85, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed' },
  footer: { alignItems: 'center', width: '100%' },
  thumbContainer: { paddingHorizontal: 20, gap: 12, height: 80, marginBottom: 15 },
  thumbWrapper: { position: 'relative', width: 60, height: 75 },
  thumb: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1, borderColor: '#fff' },
  deleteBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF3B30', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 30, width: '100%', justifyContent: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  analyzeBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  analyzeText: { color: '#fff', fontWeight: '800' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullPreview: { width: width * 0.9, height: height * 0.7 },
  closeBtn: { marginTop: 20, padding: 15 },
  closeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

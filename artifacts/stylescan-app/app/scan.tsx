import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, Dimensions, Modal, ScrollView } from 'react-native';
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
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo) setCapturedImages(prev => [...prev, photo.uri]);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setCapturedImages(prev => [...prev, result.assets[0].uri]);
  };

  const startAnalysis = async () => {
    setIsProcessing(true);
    try {
      const scan = await api.createScan(userId);
      setScanId(scan.id);
      setFrontImageUri(capturedImages[0]);
      await api.updateFrontImage(scan.id, capturedImages[0]);
      router.replace('/processing');
    } catch { router.replace('/processing'); }
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>Camera access needed</Text>
        <TouchableOpacity style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 10 }} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing}>
        <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.btn}><Feather name="x" size={24} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')} style={styles.btn}><Ionicons name="camera-reverse" size={24} color="#fff" /></TouchableOpacity>
          </View>
          <View style={styles.center}><View style={[styles.oval, { borderColor: colors.primary }]} /></View>
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
                {capturedImages.map((uri, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <TouchableOpacity onPress={() => setPreviewImage(uri)}><Image source={{ uri }} style={styles.img} /></TouchableOpacity>
                    <TouchableOpacity style={styles.del} onPress={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}><Feather name="x" size={10} color="#fff" /></TouchableOpacity>
                  </View>
                ))}
             </ScrollView>
             <View style={styles.controls}>
                <TouchableOpacity onPress={pickFromGallery} style={styles.btn}><Feather name="image" size={24} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.shutter} onPress={takePicture}><View style={styles.shutterInner} /></TouchableOpacity>
                {capturedImages.length > 0 ? <TouchableOpacity style={[styles.go, {backgroundColor: colors.primary}]} onPress={startAnalysis}><Text style={{color:'#fff', fontWeight:'800'}}>GO ({capturedImages.length})</Text></TouchableOpacity> : <View style={{width:60}}/>}
             </View>
          </View>
        </View>
      </CameraView>
      <Modal visible={!!previewImage} transparent={true}><View style={styles.modal}><Image source={{uri: previewImage || ''}} style={styles.full} resizeMode="contain" /><TouchableOpacity onPress={() => setPreviewImage(null)}><Text style={{color:'#fff', fontSize: 18, marginTop:20}}>Close</Text></TouchableOpacity></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center' },
  oval: { width: width * 0.7, height: width * 0.9, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed' },
  footer: { alignItems: 'center' },
  thumbs: { paddingHorizontal: 20, gap: 10, height: 70, marginBottom: 20 },
  thumbWrap: { position: 'relative', width: 50, height: 60 },
  img: { width: '100%', height: '100%', borderRadius: 8 },
  del: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 40, marginBottom: 10 },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  go: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  full: { width: width * 0.9, height: height * 0.7 }
});

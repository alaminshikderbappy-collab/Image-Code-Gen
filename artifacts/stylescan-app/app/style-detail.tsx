export default function StyleDetailScreen() {
  const { frontImageUri, scanId } = useScan();
  const [previews, setPreviews] = useState({ front: null, left: null, right: null });
  const [loading, setLoading] = useState(false);

  // Trigger real AI generation for the user's face
  const generateLook = async () => {
    setLoading(true);
    const front = await api.generateVirtualTryOn(scanId, h.id, 'front');
    const left = await api.generateVirtualTryOn(scanId, h.id, 'left');
    const right = await api.generateVirtualTryOn(scanId, h.id, 'right');
    setPreviews({ front: front.url, left: left.url, right: right.url });
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      {/* MULTI-ANGLE PREVIEW SLIDER */}
      <ScrollView horizontal pagingEnabled style={styles.previewSlider}>
        <View style={styles.compareContainer}>
           {/* BEFORE/AFTER TOGGLE COMPONENT */}
           <CompareSlider 
             before={frontImageUri} 
             after={previews.front || h.imageUrl} 
             label="FRONT VIEW" 
           />
        </View>
        <View style={styles.compareContainer}>
           <CompareSlider 
             before={leftImageUri} 
             after={previews.left || h.imageUrl} 
             label="LEFT PROFILE" 
           />
        </View>
      </ScrollView>

      {/* CONSULTATION DETAILS */}
      <View style={styles.details}>
        <Text style={styles.whyLabel}>WHY THIS SUITS YOU</Text>
        <Text style={styles.reasoning}>{matchItem.reasoning}</Text>
        
        <View style={styles.prescribedBarberNotes}>
           <Text style={styles.noteTitle}>Barber Prescription:</Text>
           <Text style={styles.noteBody}>
             "Ask for a drop fade starting at the temple to sharpen the {analysis.faceShape} structure."
           </Text>
        </View>
      </View>
    </View>
  );
}

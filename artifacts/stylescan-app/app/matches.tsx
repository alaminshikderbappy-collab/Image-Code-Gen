export default function MatchesScreen() {
  const { analysis, matches } = useScan();

  return (
    <ScrollView>
      {/* 1. CURRENT LOOK ANALYSIS (New Section) */}
      <View style={styles.analysisHeader}>
        <Text style={styles.sectionLabel}>YOUR STYLIST PROFILE</Text>
        <View style={styles.analysisGrid}>
          <AnalysisTag label="Face" value={analysis.faceShape} />
          <AnalysisTag label="Hairline" value={analysis.hairline} />
          <AnalysisTag label="Texture" value={analysis.texture} />
        </View>
        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>Stylist's Note:</Text>
          <Text style={styles.insightText}>
            Your {analysis.faceShape} shape is a major strength. We've created 4 variations 
            that add height to the crown to balance your proportions.
          </Text>
        </View>
      </View>

      {/* 2. PERSONALIZED RECOMMENDATIONS */}
      <Text style={styles.sectionLabel}>CREATED FOR YOUR FACE</Text>
      <ScrollView horizontal pagingEnabled>
        {matches.map(m => <RecommendationCard item={m} />)}
      </ScrollView>
    </ScrollView>
  );
}

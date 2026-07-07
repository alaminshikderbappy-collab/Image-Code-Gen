// Add this new section into your ScrollView content:

<View style={[styles.section, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
  <View style={styles.sectionHeader}>
    <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>The Stylist's Take</Text>
  </View>
  <Text style={[styles.reasoningText, { color: colors.foreground, lineHeight: 22 }]}>
    "To make you look more {h.category === 'beard' ? 'sharp and masculine' : 'smart and presentable'}, 
    this {h.name} uses specific {h.fade} techniques. This creates a shadow effect on the sides, 
    effectively slimming your face while drawing attention to your eyes."
  </Text>
</View>

<View style={[styles.tipCard, { backgroundColor: colors.card }]}>
   <Text style={[styles.tipTitle, { color: colors.primary }]}>💡 Expert Tip</Text>
   <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>
     Use a matte product to maintain the texture without looking greasy. This ensures you look professional all day.
   </Text>
</View>

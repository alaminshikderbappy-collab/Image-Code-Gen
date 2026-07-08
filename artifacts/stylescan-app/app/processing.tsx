const STEPS = [
  { key: 'detect', label: 'Detecting facial structure' },
  { key: 'extract', label: 'Extracting hair density & texture' },
  { key: 'reconstruct', label: 'Building 3D head model' },
];

// Inside runProcessing:
const { analysis, setAnalysis } = useScan(); // Added to Context

if (scanId) {
  // Real Analysis call
  const { data } = await api.analyzePerson(scanId, capturedImages);
  setAnalysis(data.analysis); // Stores Face Shape, Hairline, etc.
  
  // Get recommendations based on that analysis
  const matches = await api.getMatches(scanId);
  setMatches(matches.data);
}

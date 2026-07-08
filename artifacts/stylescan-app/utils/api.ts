export type FaceAnalysis = {
  faceShape: 'Oval' | 'Square' | 'Round' | 'Diamond' | 'Heart' | 'Oblong';
  hairline: 'Low' | 'Mid' | 'High' | 'Receding';
  density: 'Thin' | 'Medium' | 'Thick';
  texture: 'Straight' | 'Wavy' | 'Curly' | 'Coarse';
  skinTone: string;
  strengths: string[];
  recommendations: string[];
};

export const api = {
  // 1. Analyze the actual person's features
  analyzePerson: (scanId: string, imageUris: string[]) => 
    apiFetch<{ analysis: FaceAnalysis }>(`/scans/${scanId}/analyze-features`, {
      method: "POST",
      body: JSON.stringify({ images: imageUris }),
    }),

  // 2. Generate the hairstyle ON the user's actual face (I2I)
  generateVirtualTryOn: (scanId: string, hairstyleId: string, angle: 'front' | 'left' | 'right') =>
    apiFetch<{ generatedImageUrl: string }>(`/scans/${scanId}/generate`, {
      method: "POST",
      body: JSON.stringify({ hairstyleId, angle }),
    }),
    
  // ... rest of basic endpoints
};

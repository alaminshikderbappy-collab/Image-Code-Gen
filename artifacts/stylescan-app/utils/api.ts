export type HairstyleItem = {
  id: string;
  name: string;
  description: string;
  length: string;
  fade: string;
  texture: string;
  effortLevel: string;
  category: string;
  imageUrl: string | null;
  hdImageUrl: string | null;
  suitableFaceShapes: string[];
  suitableJawTypes: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
};

export type StyleMatchItem = {
  id: string;
  scanSessionId: string;
  hairstyleId: string;
  matchPercentage: number;
  rank: number;
  isBestMatch: boolean;
  reasoning: string | null;
  hairstyle: HairstyleItem;
  createdAt: string;
};

export type ScanSession = {
  id: string;
  userId: string | null;
  status: string;
  frontImageUrl: string | null;
  scan360DataUrl: string | null;
  captureProgress: number | null;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedStyleItem = {
  id: string;
  userId: string;
  hairstyleId: string;
  scanSessionId: string | null;
  savedAt: string;
  hairstyle: HairstyleItem;
};

const getBaseUrl = (): string => {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiBase) return apiBase.replace(/\/$/, "");

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;

  return "http://localhost:80";
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}/api${path}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? `API error ${res.status}`);
  }

  return data as T;
}

export const api = {
  createUser: () =>
    apiFetch<UserProfile>("/users", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  createScan: (userId?: string | null) =>
    apiFetch<ScanSession>("/scans", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  updateFrontImage: (scanId: string, frontImageUrl: string) =>
    apiFetch<ScanSession>(`/scans/${scanId}/front-image`, {
      method: "PUT",
      body: JSON.stringify({ frontImageUrl }),
    }),

  update360Progress: (scanId: string, captureProgress: number) =>
    apiFetch<ScanSession>(`/scans/${scanId}/360-progress`, {
      method: "PUT",
      body: JSON.stringify({ captureProgress }),
    }),

  analyzeScan: (scanId: string) =>
    apiFetch<{
      scanId: string;
      status: string;
      steps: unknown[];
      matchCount: number | null;
    }>(`/scans/${scanId}/analyze`, {
      method: "POST",
    }),

  getMatches: (scanId: string) =>
    apiFetch<{ data: StyleMatchItem[]; total: number; scanId: string }>(
      `/scans/${scanId}/matches`,
    ),

  listHairstyles: (category?: string) => {
    const q = category ? `?category=${category}` : "";
    return apiFetch<{ data: HairstyleItem[]; total: number }>(
      `/hairstyles${q}`,
    );
  },

  getSavedStyles: (userId: string) =>
    apiFetch<{ data: SavedStyleItem[]; total: number }>(
      `/users/${userId}/saved-styles`,
    ),

  saveStyle: (
    userId: string,
    hairstyleId: string,
    scanSessionId?: string | null,
  ) =>
    apiFetch<SavedStyleItem>(`/users/${userId}/saved-styles`, {
      method: "POST",
      body: JSON.stringify({ hairstyleId, scanSessionId }),
    }),

  removeSavedStyle: (userId: string, savedStyleId: string) =>
    apiFetch<void>(`/users/${userId}/saved-styles/${savedStyleId}`, {
      method: "DELETE",
    }),
};

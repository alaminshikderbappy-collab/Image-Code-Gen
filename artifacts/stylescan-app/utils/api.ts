const getBaseUrl = (): string => {
  return "https://image-code-genapi.onrender.com";
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}/api${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return undefined as unknown as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "API Error");
  return data as T;
}

export const api = {
  createUser: () => apiFetch<any>("/users", { method: "POST", body: JSON.stringify({}) }),
  createScan: (userId: any) => apiFetch<any>("/scans", { method: "POST", body: JSON.stringify({ userId }) }),
  updateFrontImage: (scanId: string, frontImageUrl: string) => apiFetch<any>(`/scans/${scanId}/front-image`, { method: "PUT", body: JSON.stringify({ frontImageUrl }) }),
  analyzeScan: (scanId: string) => apiFetch<any>(`/scans/${scanId}/analyze`, { method: "POST" }),
  getMatches: (scanId: string) => apiFetch<any>(`/scans/${scanId}/matches`),
  listHairstyles: () => apiFetch<any>(`/hairstyles`),
  saveStyle: (userId: string, hairstyleId: string, scanSessionId: any) => apiFetch<any>(`/users/${userId}/saved-styles`, { method: "POST", body: JSON.stringify({ hairstyleId, scanSessionId }) }),
};

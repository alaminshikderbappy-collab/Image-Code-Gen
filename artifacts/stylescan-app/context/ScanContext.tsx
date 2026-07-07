import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, StyleMatchItem } from '@/utils/api';

type Category = 'hair' | 'beard';

type ScanContextType = {
  userId: string | null;
  isLoadingUser: boolean;
  categories: Category[];
  scanId: string | null;
  frontImageUri: string | null;
  matches: StyleMatchItem[];
  selectedMatchIndex: number;
  toggleCategory: (cat: Category) => void;
  setScanId: (id: string | null) => void;
  setFrontImageUri: (uri: string | null) => void;
  setMatches: (matches: StyleMatchItem[]) => void;
  setSelectedMatchIndex: (i: number) => void;
  clearScan: () => void;
};

const ScanContext = createContext<ScanContextType | null>(null);
const USER_KEY = 'stylescan_user_id';

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [categories, setCategories] = useState<Category[]>(['hair']);
  const [scanId, setScanId] = useState<string | null>(null);
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [matches, setMatches] = useState<StyleMatchItem[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        let uid = await AsyncStorage.getItem(USER_KEY);
        if (!uid) {
          const user = await api.createUser();
          uid = user.id;
          await AsyncStorage.setItem(USER_KEY, uid);
        }
        setUserId(uid);
      } catch (err) {
        console.error("User init failed:", err);
      } finally {
        setIsLoadingUser(false);
      }
    })();
  }, []);

  const toggleCategory = useCallback((cat: Category) => {
    setCategories((prev) => {
      if (prev.includes(cat)) {
        const next = prev.filter((c) => c !== cat);
        return next.length === 0 ? [cat] : next;
      }
      return [...prev, cat];
    });
  }, []);

  const clearScan = useCallback(() => {
    setScanId(null);
    setFrontImageUri(null);
    setMatches([]);
    setSelectedMatchIndex(0);
  }, []);

  return (
    <ScanContext.Provider
      value={{
        userId,
        isLoadingUser,
        categories,
        scanId,
        frontImageUri,
        matches,
        selectedMatchIndex,
        toggleCategory,
        setScanId,
        setFrontImageUri,
        setMatches,
        setSelectedMatchIndex,
        clearScan,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan(): ScanContextType {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within ScanProvider');
  return ctx;
}

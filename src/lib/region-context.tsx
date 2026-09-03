import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_REGION,
  detectRegion,
  REGION_STORAGE_KEY,
  REGIONS,
  type RegionCode,
  type RegionConfig,
} from '@/config/regions';

type RegionContextValue = {
  region: RegionConfig;
  setRegionCode: (code: RegionCode) => Promise<void>;
};

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<RegionCode>(DEFAULT_REGION);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(REGION_STORAGE_KEY);
      if (stored && stored in REGIONS) {
        setCode(stored as RegionCode);
        return;
      }
      const detected = detectRegion();
      setCode(detected);
      await AsyncStorage.setItem(REGION_STORAGE_KEY, detected);
    })();
  }, []);

  const value = useMemo<RegionContextValue>(
    () => ({
      region: REGIONS[code],
      setRegionCode: async (next) => {
        setCode(next);
        await AsyncStorage.setItem(REGION_STORAGE_KEY, next);
      },
    }),
    [code]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion debe usarse dentro de RegionProvider');
  return ctx;
}

import { createContext, useContext } from 'react';

export interface MapContextValue {
  casePath: string | null;
  setCasePath: (path: string | null) => void;
}

export const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    return { casePath: null, setCasePath: () => {} };
  }
  return ctx;
}

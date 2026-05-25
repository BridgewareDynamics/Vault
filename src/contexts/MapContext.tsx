import { createContext, useContext, ReactNode } from 'react';

interface MapContextValue {
  casePath: string | null;
  setCasePath: (path: string | null) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapContextProvider({
  children,
  casePath,
  setCasePath,
}: {
  children: ReactNode;
  casePath: string | null;
  setCasePath: (path: string | null) => void;
}) {
  return (
    <MapContext.Provider value={{ casePath, setCasePath }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    return { casePath: null, setCasePath: () => {} };
  }
  return ctx;
}

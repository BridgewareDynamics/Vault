import { ReactNode } from 'react';
import { MapContext } from './MapContext';

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

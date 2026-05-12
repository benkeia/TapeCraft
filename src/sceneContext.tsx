import React, { createContext, useContext, useState } from "react";
import * as THREE from "three";

type SceneContextValue = {
  scene: THREE.Group | null;
  setScene: (s: THREE.Group | null) => void;
};

const SceneContext = createContext<SceneContextValue | undefined>(undefined);

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  return (
    <SceneContext.Provider value={{ scene, setScene }}>
      {children}
    </SceneContext.Provider>
  );
};

export const useScene = () => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
};

export default SceneContext;

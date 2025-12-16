
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface FullscreenContextType {
  isAppFullScreen: boolean;
  toggleAppFullScreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isAppFullScreen, setIsAppFullScreen] = useState(false);

  const handleFullscreenChange = useCallback(() => {
    setIsAppFullScreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggleAppFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  return (
    <FullscreenContext.Provider value={{ isAppFullScreen, toggleAppFullScreen }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen(): FullscreenContextType {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
}

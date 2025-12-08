import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getTTSEnabled, getTTSAutoPlay, getTTSRate } from '../data/storage';

interface TTSContextType {
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
  ttsRate: number;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const TTSProvider = ({ children }: { children: ReactNode }) => {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsAutoPlay, setTtsAutoPlay] = useState(false);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      console.log('[TTSContext] Loading TTS settings...');
      const [enabled, autoPlay, rate] = await Promise.all([
        getTTSEnabled(),
        getTTSAutoPlay(),
        getTTSRate(),
      ]);
      console.log('[TTSContext] Loaded settings:', { enabled, autoPlay, rate });
      setTtsEnabled(enabled);
      setTtsAutoPlay(autoPlay);
      setTtsRate(rate);
    } catch (error) {
      console.error('[TTSContext] Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const refreshSettings = useCallback(async () => {
    console.log('[TTSContext] Refreshing TTS settings...');
    await loadSettings();
  }, [loadSettings]);

  return (
    <TTSContext.Provider value={{ ttsEnabled, ttsAutoPlay, ttsRate, isLoading, refreshSettings }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = (): TTSContextType => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within TTSProvider');
  }
  return context;
};

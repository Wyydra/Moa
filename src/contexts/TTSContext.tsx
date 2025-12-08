import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTTSEnabled, getTTSAutoPlay, getTTSRate } from '../data/storage';

interface TTSContextType {
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
  ttsRate: number;
  isLoading: boolean;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const TTSProvider = ({ children }: { children: ReactNode }) => {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsAutoPlay, setTtsAutoPlay] = useState(false);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [enabled, autoPlay, rate] = await Promise.all([
        getTTSEnabled(),
        getTTSAutoPlay(),
        getTTSRate(),
      ]);
      setTtsEnabled(enabled);
      setTtsAutoPlay(autoPlay);
      setTtsRate(rate);
    } catch (error) {
      console.error('[TTSContext] Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TTSContext.Provider value={{ ttsEnabled, ttsAutoPlay, ttsRate, isLoading }}>
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

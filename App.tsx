import { ThemeProvider } from './src/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { useEffect, useState } from 'react';
import { initDatabase } from './src/database';
import * as SplashScreen from 'expo-splash-screen'

export default function App() {
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();

        if (__DEV__) {
          const { resetAndSeed } = await import('./src/database/seed');
          await resetAndSeed();
        }

        setDbReady(true);
      } catch (err) {
        console.error('Failed to initialize:', err);
      }
    }

    initialize();
  }, [])

  useEffect(() => {
    if (dbReady) {
      SplashScreen.hideAsync()
    }
  }, [dbReady])

  // show loading screen while initialization
  if (!dbReady) {
    return null
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Navigation />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

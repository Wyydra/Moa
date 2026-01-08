import { ThemeProvider } from './src/theme';
import Navigation from './src/navigation';

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}

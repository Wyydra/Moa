import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Screen({ children, style }: ScreenProps) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      ...{
        alignItems: 'center',
      },
    },
  });
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>
        {children}
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

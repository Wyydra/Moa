import { useTheme } from "../theme";
import { TextStyle, Text, StyleSheet } from "react-native";

interface ScreenTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export default function ScreenTile({children, style}: ScreenTitleProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    title: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      letterSpacing: theme.typography.letterSpacing.wide,
      textAlign: 'center',
    },
  });
  return <Text style={[styles.title, style]}>{children}</Text>;
}

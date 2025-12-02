import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { COLORS } from '../utils/constants';

interface CardContentRendererProps {
  content: string;
  style?: any;
  textStyle?: any;
  numberOfLines?: number;
}

export default function CardContentRenderer({
  content,
  style,
  textStyle,
  numberOfLines,
}: CardContentRendererProps) {
  const { width } = useWindowDimensions();

  // Check if content contains HTML tags
  const containsHTML = /<[^>]*>/g.test(content);

  if (!containsHTML) {
    // Plain text - render as Text component
    return (
      <Text style={[textStyle, style]} numberOfLines={numberOfLines}>
        {content}
      </Text>
    );
  }

  // HTML content - render with RenderHTML
  return (
    <RenderHTML
      contentWidth={width - 80}
      source={{ html: content }}
      tagsStyles={{
        body: {
          color: textStyle?.color || COLORS.text,
          fontSize: textStyle?.fontSize || 18,
          fontWeight: textStyle?.fontWeight || 'normal',
          textAlign: textStyle?.textAlign || 'center',
          margin: 0,
          padding: 0,
        },
        p: { margin: 0, marginBottom: 8 },
        h1: { margin: 0, marginBottom: 8, fontSize: 24 },
        h2: { margin: 0, marginBottom: 8, fontSize: 20 },
        ul: { margin: 0, marginBottom: 8 },
        ol: { margin: 0, marginBottom: 8 },
        li: { marginBottom: 4 },
      }}
      baseStyle={{
        ...textStyle,
      }}
    />
  );
}

import React from 'react';
import { Text, ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { markdownToHtml, isMarkdown, stripMarkdown } from '../utils/markdown';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/themes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CardContentRendererProps {
  content: string;
  style?: any;
  textStyle?: any;
  numberOfLines?: number;
  maxHeight?: number; // Maximum height before scrolling (optional, overrides maxHeightPercent)
  maxHeightPercent?: number; // Maximum height as percentage of screen height (default: 35%)
}

export default function CardContentRenderer({
  content,
  style,
  textStyle,
  numberOfLines,
  maxHeight,
  maxHeightPercent = 0.35, // Default: 35% of screen height
}: CardContentRendererProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  // Calculate max height: use explicit maxHeight if provided, otherwise use percentage
  const calculatedMaxHeight = maxHeight ?? (SCREEN_HEIGHT * maxHeightPercent);

  // Convert Markdown to HTML if needed
  let displayContent = content;
  if (isMarkdown(content)) {
    displayContent = stripMarkdown(content);
  }

  // Check if content contains HTML tags
  const containsHTML = /<[^>]*>/g.test(content);

  if (!containsHTML && !isMarkdown(content)) {
    // Plain text - render as Text component
    return (
      <Text style={[textStyle, style]} numberOfLines={numberOfLines}>
        {displayContent}
      </Text>
    );
  }

  // Markdown or HTML content - render in a ScrollView with max height
  const [contentHeight, setContentHeight] = React.useState(0);
  const [scrollViewHeight, setScrollViewHeight] = React.useState(0);
  const [scrollY, setScrollY] = React.useState(0);
  
  const isScrollable = contentHeight > scrollViewHeight && scrollViewHeight > 0;
  
  // Calculate scrollbar position and size
  const scrollbarHeight = isScrollable 
    ? Math.max((scrollViewHeight / contentHeight) * scrollViewHeight, 30) 
    : 0;
  const scrollbarPosition = isScrollable 
    ? (scrollY / (contentHeight - scrollViewHeight)) * (scrollViewHeight - scrollbarHeight)
    : 0;

  return (
    <View style={[style, styles.container, { maxHeight: calculatedMaxHeight }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
          <Text style={[styles.contentText, textStyle]}>
            {displayContent}
          </Text>
        </View>
      </ScrollView>
      {isScrollable && (
        <View style={styles.scrollbarTrack}>
          <View 
            style={[
              styles.scrollbarThumb,
              {
                height: scrollbarHeight,
                transform: [{ translateY: scrollbarPosition }],
              }
            ]}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  contentText: {
    color: theme.text,
    fontSize: 18,
    textAlign: 'center',
  },
  scrollbarTrack: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
  },
  scrollbarThumb: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 4,
  },
});

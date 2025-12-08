import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../utils/constants';
import { wrapWithMarkdown, insertLinePrefix } from '../utils/markdown';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/themes';

interface MarkdownEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  label,
  autoFocus = false,
}: MarkdownEditorProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const textInputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [contentHeight, setContentHeight] = useState(44);

  const handleSelectionChange = (event: any) => {
    setSelection(event.nativeEvent.selection);
  };

  const applyMarkdown = (prefix: string, suffix?: string) => {
    const result = wrapWithMarkdown(value, selection.start, selection.end, prefix, suffix);
    onChange(result.text);
    
    // Set selection after state update
    setTimeout(() => {
      textInputRef.current?.setNativeProps({
        selection: { start: result.selectionStart, end: result.selectionEnd },
      });
    }, 10);
  };

  const applyLinePrefix = (prefix: string) => {
    const result = insertLinePrefix(value, selection.start, prefix);
    onChange(result.text);
    
    setTimeout(() => {
      textInputRef.current?.setNativeProps({
        selection: { start: result.selectionStart, end: result.selectionStart },
      });
    }, 10);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Toolbar */}
      <View style={styles.toolbarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbar}
        >
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyMarkdown('**')}
          >
            <Text style={styles.toolbarButtonTextBold}>B</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyMarkdown('*')}
          >
            <Text style={styles.toolbarButtonTextItalic}>I</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyMarkdown('__')}
          >
            <Text style={styles.toolbarButtonTextUnderline}>U</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyMarkdown('~~')}
          >
            <Text style={styles.toolbarButtonText}>S</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyLinePrefix('# ')}
          >
            <Text style={styles.toolbarButtonText}>H1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyLinePrefix('## ')}
          >
            <Text style={styles.toolbarButtonText}>H2</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyLinePrefix('- ')}
          >
            <Ionicons name="list" size={18} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => applyLinePrefix('1. ')}
          >
            <Ionicons name="list-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* TextInput */}
      <TextInput
        ref={textInputRef}
        style={[styles.input, { height: Math.min(Math.max(44, contentHeight), 400) }]}
        value={value}
        onChangeText={onChange}
        onSelectionChange={handleSelectionChange}
        onContentSizeChange={(event) => {
          setContentHeight(event.nativeEvent.contentSize.height);
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.textLight}
        multiline
        autoFocus={autoFocus}
        textAlignVertical="top"
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  toolbarContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  toolbarButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: theme.surface,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  toolbarButtonTextBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  toolbarButtonTextItalic: {
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.text,
  },
  toolbarButtonTextUnderline: {
    fontSize: 16,
    textDecorationLine: 'underline',
    color: theme.text,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
    marginHorizontal: SPACING.xs,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: theme.border,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: theme.text,
    minHeight: 44,
  },
});

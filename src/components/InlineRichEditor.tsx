import React, { useRef, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import RenderHTML from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';

interface InlineRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
}

function InlineRichEditor({
  value,
  onChange,
  placeholder,
  label,
  autoFocus = false,
}: InlineRichEditorProps) {
  const richText = useRef<RichEditor>(null);
  const { width } = useWindowDimensions();
  const [isEditing, setIsEditing] = useState(autoFocus);
  const [isLoading, setIsLoading] = useState(false);
  const [editorMounted, setEditorMounted] = useState(autoFocus);

  const handleContentChange = (html: string) => {
    onChange(html);
  };

  useEffect(() => {
    if (autoFocus && richText.current) {
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 400);
    }
  }, [autoFocus]);

  const handlePressEdit = () => {
    if (!editorMounted) {
      setIsLoading(true);
      setEditorMounted(true);
      // Wait for WebView to mount
      setTimeout(() => {
        setIsLoading(false);
        setIsEditing(true);
        setTimeout(() => {
          richText.current?.focusContentEditor();
        }, 200);
      }, 300);
    } else {
      setIsEditing(true);
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 100);
    }
  };

  const handlePressDone = () => {
    setIsEditing(false);
    richText.current?.blurContentEditor();
  };

  const isEmpty = !value || value.replace(/<[^>]*>/g, '').trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Label with Edit/Done button */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {isEditing && (
          <Pressable onPress={handlePressDone} style={styles.doneButton}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </Pressable>
        )}
      </View>

      {/* Editor Container */}
      <View style={[styles.editorWrapper, isEditing && styles.editorWrapperFocused]}>
        {!isEditing ? (
          // PREVIEW MODE - Lightweight
          <Pressable onPress={handlePressEdit} style={styles.previewContainer}>
            {isEmpty ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholder}>{placeholder}</Text>
                <Ionicons name="create-outline" size={20} color={COLORS.textLight} style={styles.editIcon} />
              </View>
            ) : (
              <RenderHTML
                contentWidth={width - (SPACING.xl * 2) - (SPACING.md * 2)}
                source={{ html: value }}
                tagsStyles={{
                  body: { color: COLORS.text, fontSize: 16, margin: 0, padding: 0 },
                  p: { margin: 0, marginBottom: 8 },
                  h1: { margin: 0, marginBottom: 8, fontSize: 22 },
                  h2: { margin: 0, marginBottom: 8, fontSize: 18 },
                  ul: { margin: 0, marginBottom: 8, paddingLeft: 20 },
                  ol: { margin: 0, marginBottom: 8, paddingLeft: 20 },
                  li: { marginBottom: 4 },
                }}
              />
            )}
          </Pressable>
        ) : (
          // EDITING MODE - Heavy WebView (lazy loaded)
          <View style={styles.editingContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : editorMounted ? (
              <>
                {/* Toolbar */}
                <View style={styles.toolbarContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    style={styles.toolbarScroll}
                  >
                    <RichToolbar
                      editor={richText}
                      actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.heading1,
                        actions.heading2,
                        actions.setStrikethrough,
                        actions.alignLeft,
                        actions.alignCenter,
                        actions.alignRight,
                        actions.undo,
                        actions.redo,
                      ]}
                      iconMap={{
                        [actions.setBold]: () => <Text style={styles.toolbarIconBold}>B</Text>,
                        [actions.setItalic]: () => <Text style={styles.toolbarIconItalic}>I</Text>,
                        [actions.setUnderline]: () => <Text style={styles.toolbarIconUnderline}>U</Text>,
                        [actions.heading1]: () => <Text style={styles.toolbarIcon}>H1</Text>,
                        [actions.heading2]: () => <Text style={styles.toolbarIcon}>H2</Text>,
                      }}
                      style={styles.toolbar}
                      selectedIconTint={COLORS.primary}
                      disabledIconTint={COLORS.textLight}
                      iconTint={COLORS.text}
                    />
                  </ScrollView>
                </View>

                {/* Editor */}
                <RichEditor
                  ref={richText}
                  initialContentHTML={value}
                  onChange={handleContentChange}
                  placeholder={placeholder}
                  style={styles.editor}
                  editorStyle={{
                    backgroundColor: COLORS.surface,
                    color: COLORS.text,
                    placeholderColor: COLORS.textLight,
                    contentCSSText: `
                      font-size: 18px;
                      line-height: 1.6;
                      color: ${COLORS.text};
                      padding: ${SPACING.md}px;
                    `,
                  }}
                  useContainer={true}
                />
              </>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(InlineRichEditor);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  doneButton: {
    padding: SPACING.xs,
  },
  editorWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 80,
  },
  editorWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  previewContainer: {
    padding: SPACING.lg,
    minHeight: 80,
    justifyContent: 'center',
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    color: COLORS.textLight,
    fontSize: 16,
    flex: 1,
  },
  editIcon: {
    marginLeft: SPACING.sm,
  },
  editingContainer: {
    backgroundColor: COLORS.surface,
    minHeight: 200,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  toolbarContainer: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 50,
  },
  toolbarScroll: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 0,
    minHeight: 50,
  },
  toolbarIcon: {
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.text,
  },
  toolbarIconBold: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  toolbarIconItalic: {
    fontStyle: 'italic',
    fontSize: 16,
    color: COLORS.text,
  },
  toolbarIconUnderline: {
    textDecorationLine: 'underline',
    fontSize: 16,
    color: COLORS.text,
  },
  editor: {
    minHeight: 150,
    backgroundColor: COLORS.surface,
  },
});

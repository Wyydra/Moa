import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { COLORS, SPACING } from '../utils/constants';

interface InlineRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  label: string;
  autoFocus?: boolean;
  delayMount?: number; // Delay in ms before mounting the editor
}

function InlineRichEditor({
  value,
  onChange,
  placeholder,
  label,
  autoFocus = false,
  delayMount = 0,
}: InlineRichEditorProps) {
  const richText = useRef<RichEditor>(null);
  const [shouldRender, setShouldRender] = React.useState(delayMount === 0);

  const handleContentChange = (html: string) => {
    onChange(html);
  };

  // Delayed mount for sequential loading
  useEffect(() => {
    if (delayMount > 0) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delayMount);
      return () => clearTimeout(timer);
    }
  }, [delayMount]);

  useEffect(() => {
    if (autoFocus && richText.current && shouldRender) {
      setTimeout(() => {
        richText.current?.focusContentEditor();
      }, 400);
    }
  }, [autoFocus, shouldRender]);

  if (!shouldRender) {
    // Show placeholder while loading
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.editorWrapper, styles.loadingWrapper]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Editor Container - Always visible */}
      <View style={styles.editorWrapper}>
        <View style={styles.editingContainer}>
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
        </View>
      </View>
    </View>
  );
}

export default memo(InlineRichEditor);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  editorWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  editingContainer: {
    backgroundColor: COLORS.surface,
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
  loadingWrapper: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
});

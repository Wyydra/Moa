import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from '../utils/constants';
import { generateId, saveCard } from "../data/storage";
import { Card } from "../data/model";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InlineRichEditor from '../components/InlineRichEditor';


export default function AddCardScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { deckId } = route.params;
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSave = async () => {
    const frontText = stripHtmlTags(front);
    const backText = stripHtmlTags(back);
    
    if (!frontText || !backText) {
      return;
    }

    const newCard: Card = {
      id: generateId(),
      front: front,
      back: back,
      deckId,
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: Date.now(),
      tags: tags.length > 0 ? tags : undefined,
    };

    await saveCard(newCard);
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={commonStyles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.spacer} />
          <Text style={commonStyles.screenTitle}>{t('card.addCard')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Inline Rich Editor for Front */}
        <InlineRichEditor
          value={front}
          onChange={setFront}
          label={t('card.front')}
          placeholder={t('card.enterText')}
          autoFocus={true}
        />

        {/* Inline Rich Editor for Back */}
        <InlineRichEditor
          value={back}
          onChange={setBack}
          label={t('card.back')}
          placeholder={t('card.enterText')}
        />

        <Text style={commonStyles.label}>{t('card.tags')}</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAddTag} style={styles.addTagButton}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textInverse} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[commonStyles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={commonStyles.buttonText}>{t('card.saveCard')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingTop: SPACING.md,
  },
  spacer: {
    width: 28,
  },
  closeButton: {
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tagInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  addTagButton: {
    padding: SPACING.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  tagText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: SPACING.xl,
  },
});

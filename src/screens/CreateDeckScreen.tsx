import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from 'react-i18next';
import { createCommonStyles } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/themes';
import { saveDeck, generateId, getAllTags } from '../data/storage';
import { Deck } from "../data/model";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguagePicker from '../components/LanguagePicker';

export default function CreateDeckScreen({ navigation }: any) {
  const { theme } = useTheme();
  const commonStyles = createCommonStyles(theme);
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frontLanguage, setFrontLanguage] = useState<string | undefined>('app-language');
  const [backLanguage, setBackLanguage] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const existingTags = await getAllTags();
    setAllTags(existingTags);
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && ! tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    const newDeck: Deck = {
      id: generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      createdAt: Date.now(),
      cardCount: 0,
      tags: tags,
      frontLanguage: frontLanguage,
      backLanguage: backLanguage,
    };

    await saveDeck(newDeck);
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

 return (
    <View style={commonStyles.container}>
      <View style={[styles.header, { marginTop: insets.top }]}>
        <View style={styles.spacer} />
        <Text style={commonStyles.screenTitle}>{t('deck.createDeck')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={commonStyles.label}>{t('deck.deckName')}</Text>
      <TextInput
        style={commonStyles.input}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={commonStyles.label}>{t('deck.description')}</Text>
      <TextInput
        style={[commonStyles.input, styles.descriptionInput]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={commonStyles.label}>{t('deck.frontLanguage')}</Text>
      <Text style={styles.languageDescription}>{t('deck.frontLanguageDescription')}</Text>
      <LanguagePicker 
        value={frontLanguage} 
        onChange={setFrontLanguage}
        includeAppLanguage={true}
      />

      <Text style={commonStyles.label}>{t('deck.backLanguage')}</Text>
      <Text style={styles.languageDescription}>{t('deck.backLanguageDescription')}</Text>
      <LanguagePicker 
        value={backLanguage} 
        onChange={setBackLanguage}
      />

      <Text style={commonStyles.label}>{t('deck.tags')}</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
              <Ionicons name="close-circle" size={18} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.tagInputRow}>
        <TextInput
          style={[commonStyles.input, styles.tagInput]}
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addTagButton}
          onPress={handleAddTag}
        >
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {allTags.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.suggestedTags}
        >
          {allTags
            .filter(tag => !tags.includes(tag))
            .map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedTagChip}
                onPress={() => {
                  setTags([...tags, tag]);
                }}
              >
                <Text style={styles.suggestedTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

        <TouchableOpacity
          style={[commonStyles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={commonStyles.buttonText}>{t('deck.createDeck')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  spacer: {
    width: 28,
  },
  closeButton: {
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
    minHeight: 40,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 0.5,
    borderColor: theme.border,
    ...SHADOWS.sm,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    marginRight: 6,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tagInput: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  addTagButton: {
    padding: SPACING.xs,
  },
  suggestedTags: {
    marginBottom: SPACING.md,
    maxHeight: 40,
  },
  suggestedTagChip: {
    backgroundColor: theme.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  suggestedTagText: {
    color: theme.textLight,
    fontSize: 14,
  },
  saveButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  languageDescription: {
    fontSize: 12,
    color: theme.textLight,
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
  },
});

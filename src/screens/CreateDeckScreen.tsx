import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';
import { saveDeck, generateId, getAllTags } from '../data/storage';
import { Deck } from "../data/model";

const LANGUAGES = [
  { code: undefined, name: 'Auto-detect', nativeName: '🌐' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
];

export default function CreateDeckScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

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
      language: language,
    };

    await saveDeck(newDeck);
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

 return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={commonStyles.screenTitle}>{t('deck.createDeck')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
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
        placeholder={t('deck.descriptionPlaceholder')}
        multiline
        numberOfLines={3}
      />

      <Text style={commonStyles.label}>{t('deck.language')}</Text>
      <Text style={styles.languageDescription}>{t('deck.languageDescription')}</Text>
      
      <TouchableOpacity 
        style={styles.languageSelector}
        onPress={() => setShowLanguagePicker(true)}
      >
        <View style={styles.languageSelectorContent}>
          <Text style={styles.languageSelectorNative}>
            {LANGUAGES.find(l => l.code === language)?.nativeName || '🌐'}
          </Text>
          <Text style={styles.languageSelectorText}>
            {LANGUAGES.find(l => l.code === language)?.name || t('deck.languageAuto')}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal
        visible={showLanguagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('deck.language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code || 'auto'}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.languageOptionSelected
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.languageOptionNative}>{lang.nativeName}</Text>
                  <Text style={styles.languageOptionName}>
                    {lang.code === undefined ? t('deck.languageAuto') : lang.name}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark" size={24} color={COLORS.skyBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
          placeholder={t('deck.tagsPlaceholder')}
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addTagButton}
          onPress={handleAddTag}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.skyBlue} />
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    width: 28,
  },
  closeButton: {
    marginTop: 60,
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
    backgroundColor: COLORS.skyBlue,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
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
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: SPACING.sm,
  },
  suggestedTagText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 32,
  },
  languageDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  languageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageSelectorNative: {
    fontSize: 24,
  },
  languageSelectorText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  languageOptionSelected: {
    backgroundColor: COLORS.skyBlue + '10',
  },
  languageOptionNative: {
    fontSize: 28,
  },
  languageOptionName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
});

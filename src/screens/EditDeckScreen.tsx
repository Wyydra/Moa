import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { getDeckById, saveDeck, getAllTags } from "../data/storage";
import { View, Alert, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from '../utils/constants';

export default function EditDeckScreen({ route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeck();
  }, []);

  const loadDeck = async () => {
    const deck = await getDeckById(deckId);
    if (deck) {
      setName(deck.name);
      setDescription(deck.description || '');
      setTags(deck.tags || []);
    }
    setLoading(false);
    
    const existingTags = await getAllTags();
    setAllTags(existingTags);
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Deck name is required');
      return;
    }

    const deck = await getDeckById(deckId);
    if (deck) {
      deck.name = name.trim();
      deck.description = description.trim() || undefined;
      deck.tags = tags;
      await saveDeck(deck);
      navigation.goBack();
    }
  };

  const handleClose = () => {
    navigation.goBack();
  }

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.emptyText}>{t('common.loading')}</Text>
      </View>
    )
  }
return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={commonStyles.screenTitle}>{t('deck.editDeck')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

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
        <Text style={commonStyles.buttonText}>{t('card.saveChanges')}</Text>
      </TouchableOpacity>
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
});

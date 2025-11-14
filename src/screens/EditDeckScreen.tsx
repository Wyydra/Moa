import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { getDeckById, saveDeck } from "../data/storage";
import { View, Alert, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { commonStyles } from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '../utils/constants';

export default function EditDeckScreen({ route, navigation}: any) {
  const { t } = useTranslation();
  const { deckId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeck();
  }, []);

  const loadDeck = async () => {
    const deck = await getDeckById(deckId);
    if (deck) {
      setName(deck.name);
      setDescription(deck.description || '');
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Deck name is required');
      return;
    }

    const deck = await getDeckById(deckId);
    if (deck) {
      deck.name = name.trim();
      deck.description = description.trim() || undefined;
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
  saveButton: {
    marginTop: 32,
  },
});

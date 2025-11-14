import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '../utils/constants';
import { saveCard, getAllCards, deleteCard } from "../data/storage";
import { Card } from "../data/model";


export default function EditCardScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { cardId } = route.params;
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    const cards = await getAllCards();
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setFront(card.front);
      setBack(card.back);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      return;
    }

    const cards = await getAllCards();
    const existingCard = cards.find(c => c.id === cardId);
    
    if (existingCard) {
      const updatedCard: Card = {
        ...existingCard,
        front: front.trim(),
        back: back.trim(),
      };
      await saveCard(updatedCard);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      t('card.deleteCard'),
      t('card.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: "cancel"
        },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            await deleteCard(cardId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color={COLORS.coral} />
        </TouchableOpacity>
        <Text style={commonStyles.screenTitle}>{t('card.editCard')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={commonStyles.label}>{t('card.front')}</Text>
      <TextInput
        style={commonStyles.input}
        value={front}
        onChangeText={setFront}
        autoFocus
      />

      <Text style={commonStyles.label}>{t('card.back')}</Text>
      <TextInput
        style={commonStyles.input}
        value={back}
        onChangeText={setBack}
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
  closeButton: {
    marginTop: 60,
  },
  deleteButton: {
    marginTop: 60,
  },
  saveButton: {
    marginTop: 32,
  },
});

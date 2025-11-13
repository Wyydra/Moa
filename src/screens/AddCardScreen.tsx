import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from '../utils/constants';
import { generateId, saveCard } from "../data/storage";
import { Card } from "../data/model";


export default function AddCardScreen({ route, navigation }: any) {
  const { deckId } = route.params;
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      return;
    }

    const newCard: Card = {
      id: generateId(),
      front: front.trim(),
      back: back.trim(),
      deckId,
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: Date.now(),
    };

    await saveCard(newCard);
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={commonStyles.screenTitle}>Add Card</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={commonStyles.label}>Front</Text>
      <TextInput
        style={commonStyles.input}
        value={front}
        onChangeText={setFront}
        autoFocus
      />

      <Text style={commonStyles.label}>Back</Text>
      <TextInput
        style={commonStyles.input}
        value={back}
        onChangeText={setBack}
      />

      <TouchableOpacity
        style={[commonStyles.button, styles.saveButton]}
        onPress={handleSave}
      >
        <Text style={commonStyles.buttonText}>Save Card</Text>
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
  saveButton: {
    marginTop: 32,
  },
});

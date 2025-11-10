import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { saveDeck, generateId } from '../data/storage';
import { Deck } from "../data/model";

export default function CreateDeckScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
        <Text style={commonStyles.screenTitle}>Create Deck</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={commonStyles.label}>Deck Name</Text>
      <TextInput
        style={commonStyles.input}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={commonStyles.label}>Description (Optional)</Text>
      <TextInput
        style={[commonStyles.input, styles.descriptionInput]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[commonStyles.button, styles.saveButton]}
        onPress={handleSave}
      >
        <Text style={commonStyles.buttonText}>Create Deck</Text>
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
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 32,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';

export interface Option {
  code: string;
  name: string;
  nativeName?: string;
  icon?: string;
}

interface OptionPickerProps {
  label: string;
  description?: string;
  value: string;
  options: Option[];
  onValueChange: (code: string) => void;
}

export default function OptionPicker({ 
  label, 
  description, 
  value, 
  options, 
  onValueChange 
}: OptionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedOption = options.find(o => o.code === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setShowPicker(true)}
      >
        <View style={styles.selectorContent}>
          {selectedOption?.icon && (
            <Text style={styles.icon}>{selectedOption.icon}</Text>
          )}
          <Text style={styles.selectorText}>
            {selectedOption?.nativeName || selectedOption?.name || value}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.option,
                    value === option.code && styles.optionSelected
                  ]}
                  onPress={() => {
                    onValueChange(option.code);
                    setShowPicker(false);
                  }}
                >
                  {option.icon && (
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                  )}
                  <Text style={styles.optionName}>
                    {option.nativeName || option.name}
                  </Text>
                  {value === option.code && (
                    <Ionicons name="checkmark" size={24} color={COLORS.skyBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: 50,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  selectorText: {
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.skyBlue + '10',
  },
  optionIcon: {
    fontSize: 28,
  },
  optionName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/themes';

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
  const { theme } = useTheme();
  const styles = createStyles(theme);
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
        <Ionicons name="chevron-down" size={20} color={theme.textLight} />
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
                <Ionicons name="close" size={24} color={theme.text} />
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
                    <Ionicons name="checkmark" size={24} color={theme.primary} />
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

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: theme.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: theme.textLight,
    marginBottom: SPACING.md,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 50,
    borderWidth: 0.5,
    borderColor: theme.border,
    ...SHADOWS.sm,
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
    fontSize: TYPOGRAPHY.fontSize.md,
    color: theme.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: theme.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: theme.primary + '10',
  },
  optionIcon: {
    fontSize: 28,
  },
  optionName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: theme.text,
    flex: 1,
  },
});

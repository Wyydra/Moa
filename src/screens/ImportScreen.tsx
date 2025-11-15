import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../styles/commonStyles';
import { COLORS, SPACING } from '../utils/constants';
import { importDeckFromJSON } from '../data/storage';

export default function ImportScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const fetchQuizletDeck = async () => {
    if (!url.trim()) {
      Alert.alert(t('common.error'), t('import.error.emptyUrl'));
      return;
    }

    setLoading(true);
    try {
      const quizletId = extractQuizletId(url);
      if (!quizletId) {
        Alert.alert(t('common.error'), 'Invalid Quizlet URL');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://quizlet.com/webapi/3.2/studiables/${quizletId}?client=web`);
      const data = await response.json();
      
      if (!data.studiables || data.studiables.length === 0) {
        Alert.alert(t('common.error'), 'Could not find deck');
        setLoading(false);
        return;
      }

      const deckName = data.set?.title || 'Imported Deck';
      const cards = data.studiables
        .filter((card: any) => card.definition && card.term)
        .map((card: any) => ({
          front: card.term,
          back: card.definition,
        }));

      setPreview({
        deckName,
        cardCount: cards.length,
        cards,
      });
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to fetch deck. Make sure it\'s a public Quizlet set.');
    } finally {
      setLoading(false);
    }
  };

  const extractQuizletId = (url: string): string | null => {
    const match = url.match(/quizlet\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleImport = async () => {
    if (!preview) return;

    try {
      setLoading(true);
      const deckData = {
        deck: {
          id: `deck_${Date.now()}`,
          name: preview.deckName,
          description: 'Imported from Quizlet',
          createdAt: new Date().toISOString(),
        },
        cards: preview.cards.map((card: any, idx: number) => ({
          id: `card_${Date.now()}_${idx}`,
          deckId: `deck_${Date.now()}`,
          front: card.front,
          back: card.back,
          createdAt: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
        })),
      };

      await importDeckFromJSON(JSON.stringify(deckData));
      Alert.alert(t('common.success'), t('deck.importSuccess', { name: preview.deckName }), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to import deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={commonStyles.screenTitle}>{t('import.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>{t('import.quizletUrl')}</Text>
          <TextInput
            style={styles.input}
            placeholder="https://quizlet.com/123456789/..."
            value={url}
            onChangeText={setUrl}
            editable={!loading}
          />
          <Text style={styles.info}>{t('import.info')}</Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.skyBlue} />
            <Text style={styles.loadingText}>{t('import.importing')}</Text>
          </View>
        )}

        {!loading && !preview && (
          <TouchableOpacity
            style={[commonStyles.button, styles.fetchButton]}
            onPress={fetchQuizletDeck}
            disabled={!url.trim()}
          >
            <Text style={commonStyles.buttonText}>{t('import.fetchDeck')}</Text>
          </TouchableOpacity>
        )}

        {!loading && preview && (
          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <Ionicons name="document" size={32} color={COLORS.skyBlue} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{preview.deckName}</Text>
                <Text style={styles.previewCardCount}>
                  {preview.cardCount} {t('import.cardCount')}
                </Text>
              </View>
            </View>

            <View style={styles.cardPreview}>
              <Text style={styles.previewSectionTitle}>{t('import.preview')}</Text>
              {preview.cards.slice(0, 3).map((card: any, idx: number) => (
                <View key={idx} style={styles.cardItem}>
                  <Text style={styles.cardFront} numberOfLines={1}>{card.front}</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
                  <Text style={styles.cardBack} numberOfLines={1}>{card.back}</Text>
                </View>
              ))}
              {preview.cardCount > 3 && (
                <Text style={styles.moreCards}>
                  {t('import.more')} ({preview.cardCount - 3} more)
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[commonStyles.button, styles.importButton]}
                onPress={handleImport}
                disabled={loading}
              >
                <Text style={commonStyles.buttonText}>{t('import.import')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => setPreview(null)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  info: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  fetchButton: {
    marginTop: SPACING.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textLight,
    fontSize: 14,
  },
  preview: {
    marginTop: SPACING.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  previewCardCount: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  cardPreview: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
  },
  previewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardFront: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  cardBack: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
  },
  moreCards: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  actions: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  importButton: {
    marginBottom: SPACING.sm,
  },
   cancelButton: {
     marginBottom: SPACING.lg,
     borderWidth: 2,
     borderColor: COLORS.textLight,
     backgroundColor: 'transparent',
     shadowOpacity: 0,
     elevation: 0,
   },
   cancelButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: COLORS.textLight,
   },
 });

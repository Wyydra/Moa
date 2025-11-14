import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { getLanguagePreference } from '../data/storage';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

const resources = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  }
};

const initI18n = async () => {
  const savedLanguage = await getLanguagePreference();
  const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || deviceLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false
      }
    });
};

initI18n();

export default i18n;

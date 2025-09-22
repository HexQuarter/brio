import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "../public/locales/en.json";

const resources = {
  en: {
    translation: enTranslation,
  },
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
//   .use(LanguageDetector)
  .init({
    resources,
    lng: "en", // default language
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });
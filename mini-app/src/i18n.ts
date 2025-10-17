import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "../public/locales/en.json";
import frTranslation from "../public/locales/fr.json";
import esTranslation from "../public/locales/es.json";
import zhTranslation from "../public/locales/zh.json";
import hiTranslation from "../public/locales/hi.json";

const resources = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  es: { translation: esTranslation },
  zh: { translation: zhTranslation },
  hi: { translation: hiTranslation },
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: "en",
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
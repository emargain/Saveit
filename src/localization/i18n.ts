import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import type { Resource } from "i18next";
import { initReactI18next } from "react-i18next";

import enAdmin from "./locales/en/admin.json";
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enCustomer from "./locales/en/customer.json";
import enPartner from "./locales/en/partner.json";
import esAdmin from "./locales/es/admin.json";
import esAuth from "./locales/es/auth.json";
import esCommon from "./locales/es/common.json";
import esCustomer from "./locales/es/customer.json";
import esPartner from "./locales/es/partner.json";

export const LOCALE_STORAGE_KEY = "@saveit_locale_override";

const resources: Resource = {
  en: {
    common: enCommon,
    auth: enAuth,
    customer: enCustomer,
    partner: enPartner,
    admin: enAdmin,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    customer: esCustomer,
    partner: esPartner,
    admin: esAdmin,
  },
};

export type AppLanguage = "en" | "es";

function deviceDefaultLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return code === "es" ? "es" : "en";
}

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
  if (initPromise) return initPromise;
  const defaultLng = deviceDefaultLanguage();

  initPromise = (async () => {
    let lng: AppLanguage = defaultLng;
    try {
      const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "en" || stored === "es") lng = stored;
    } catch {
      /* ignore */
    }

    await i18n.use(initReactI18next).init({
      compatibilityJSON: "v4",
      resources,
      lng,
      fallbackLng: "en",
      defaultNS: "common",
      ns: ["common", "auth", "customer", "partner", "admin"],
      interpolation: { escapeValue: false },
    });
  })();

  return initPromise;
}

export async function setAppLanguage(lng: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export async function clearLanguageOverride(): Promise<void> {
  await AsyncStorage.removeItem(LOCALE_STORAGE_KEY);
  await i18n.changeLanguage(deviceDefaultLanguage());
}

export { i18n };

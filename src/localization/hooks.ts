import { useTranslation as useI18NextTranslation } from "react-i18next";

/**
 * Typed convenience re-export. Use namespaces: common, auth, customer, partner, admin.
 */
export function useAppTranslation(ns?: string | string[]) {
  return useI18NextTranslation(ns);
}

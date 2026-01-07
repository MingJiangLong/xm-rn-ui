import { useContext } from "react";
import { I_LocalContext, LocaleContext } from "./i18n.context";

/**
 * 用于组件内
 * @returns 
 */
export function useI18n() {
    const localeContext = useContext<I_LocalContext>(LocaleContext);
    if (!localeContext) throw new Error("useI18n must be used within  LocaleProvider")
    return localeContext;
}
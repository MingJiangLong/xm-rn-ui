import React, {
    PropsWithChildren, ReactNode,
    useCallback,
    useEffect, useMemo, useState
} from "react";

import { i18nTranslateHelper } from "./translate";
import { LocaleContext } from "./i18n.context";
export type I_Locale<T = any> = { [k: string]: T }
interface I_Storage {
    getItem: (key: string) => Promise<string | null>
    setItem: (key: string, value: string) => Promise<void>
}
type LocaleProviderProps = PropsWithChildren<{
    /** 该资源会覆盖fetchLocale获取到的资源 */
    devLocale?: I_Locale
    cachePrefix?: string
    fetchLocale: () => Promise<I_Locale>
    storage: I_Storage
    onMountedCallback?: () => void
}>



const APP_LOCALE_CACHE = "__APP_LOCALE_CACHE__"
export function LocaleProvider(props: LocaleProviderProps) {

    const { children, storage, cachePrefix, devLocale, onMountedCallback } = props;

    const [latestLocale, setLatestLocal] = useState<I_Locale>({} as I_Locale)

    const cacheName = useMemo(() => {
        return `${cachePrefix ?? ""}${APP_LOCALE_CACHE}`
    }, [])

    async function getLocaleFromCache(): Promise<I_Locale> {
        try {
            const result = await storage?.getItem(cacheName)
            return JSON.parse(result ?? JSON.stringify({}))
        } catch (error: any) {
            console.error("[i18n] getLocaleFromCache error", error);
            return {}
        }
    }

    const storeLocale = useCallback(
        async function storeLocale(locale?: I_Locale) {
            try {
                if (!locale) return;
                storage?.setItem(cacheName, JSON.stringify(locale))
            } catch (error: any) {
                console.error("[i18n] storeLocale error", error);
            }
        }, []
    )

    const updateLatestLocal = useCallback(
        async function (newLocale?: I_Locale) {
            const localeInCache = await getLocaleFromCache()
            const latestLocale = {
                ...localeInCache,
                ...newLocale
            }
            setLatestLocal(latestLocale)
            storeLocale(latestLocale)
        }, []
    )

    const onFetchLocale = useCallback(async () => {
        const locale = await props.fetchLocale()
        updateLatestLocal({ ...locale, ...devLocale })
        onMountedCallback?.();
    }, [])

    const i18n = useMemo(() => {
        i18nTranslateHelper.syncLocalSource(latestLocale)
        return {
            translate: (key: string, ...args: string[]) => {
                return i18nTranslateHelper.translate(latestLocale, key, ...args)
            },
            translateThunk(key: string, ...args: (string | ReactNode)[]) {
                return i18nTranslateHelper.translateThunk(latestLocale, key, ...args)
            },
        }
    }, [latestLocale])

    useEffect(() => {
        onFetchLocale()
    }, [])


    useEffect(() => {
        updateLatestLocal(devLocale)
    }, [devLocale])

    return (
        <LocaleContext.Provider value={i18n as any}>
            {children}
        </LocaleContext.Provider>
    )

}
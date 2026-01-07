import React from "react";
import { I_Locale } from "./i18n";


let globalLocalSource: I_Locale = {};
function syncLocalSource(value: I_Locale) {
    globalLocalSource = {
        ...globalLocalSource,
        ...value
    }
}

function splitLocaleKey(key: string) {
    return key.split(".").filter(Boolean)
}

function findSource<T = any>(source: any, keys: string[], defaultValue?: any): T {
    const currentKey = keys.shift();
    if (currentKey == undefined) return source as T;
    if (source == null) return defaultValue as T;
    if (typeof source !== "object" || source === null) return defaultValue as T;
    return findSource(source?.[currentKey], keys, defaultValue) as T
}


function translateFn<T = string>(source: I_Locale, key: string, ...args: string[]) {

    const keys = splitLocaleKey(key)
    const foundLocale = findSource(source, keys, key)

    const typeofFoundLocale = typeof foundLocale;
    if (!args.length || foundLocale == key || (typeofFoundLocale != "string" && typeofFoundLocale != "number")) return foundLocale as T;

    return `${foundLocale}`.replace(/\$(\d+)/g, (_match, index) => {
        const nextStr = args[index]
        if (nextStr) return nextStr;
        return `$${index}`
    }) as T
}

function translateThunkFn(source: Record<string, string | number>, key: string, ...args: (string | React.ReactNode)[]) {
    const foundLocale = translateFn(source, key)
    if (foundLocale == key) return [foundLocale];
    const typeofFoundLocale = typeof foundLocale;
    if (typeofFoundLocale != 'string') return [foundLocale];
    return `${foundLocale}`.split(/\$(\d+)/).filter(Boolean).map((item: string) => {
        if (/^\d+$/.test(item)) {
            const willReplaceStr = args[Number(item)]
            if (willReplaceStr) return willReplaceStr
            return item
        }
        return `${item}`
    })
}

export const i18nTranslateHelper = {
    syncLocalSource,
    translate: translateFn,
    translateThunk: translateThunkFn
}

/**
 * 用于非组件内
 * @param key 
 * @param args 
 * @returns 
 */
export const translate = <T>(key: string, ...args: string[]) => translateFn<T>(globalLocalSource, key, ...args)


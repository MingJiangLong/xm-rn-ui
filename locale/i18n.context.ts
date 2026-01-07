import { createContext, ReactNode } from "react";

export type I_LocalContext = {
    /**
     * 只会翻译 value为字符串或者数字的字段
     * @param key 
     * @param args 
     * @returns 
     */
    translate: <T = string>(key: string, ...args: string[]) => T | undefined
    translateThunk: (key: string, ...args: (string | ReactNode)[]) => (string | ReactNode)[]
}


export const LocaleContext = createContext<I_LocalContext>({
    translate: <T = string>(key: string) => key as T,
    translateThunk: (key) => [key],
});
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useWindowDimensions } from "react-native";

interface UIScreenContextValue {
    designWidth: number;
    designHeight: number;
    screenWidth: number;
    screenHeight: number;
}

const UIScreenContext = createContext<UIScreenContextValue | null>(null);

type UIScreenProviderProps = PropsWithChildren<Partial<UIScreenContextValue>>;

const DEFAULT_DESIGN_WIDTH = 375;
const DEFAULT_DESIGN_HEIGHT = 812;

export function UIScreenProvider({
    children,
    designWidth = DEFAULT_DESIGN_WIDTH,
    designHeight = DEFAULT_DESIGN_HEIGHT,
}: UIScreenProviderProps) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const value = useMemo(
        () => ({
            designWidth,
            designHeight,
            screenWidth,
            screenHeight,
        }),
        [designWidth, designHeight, screenWidth, screenHeight]
    );

    return (
        <UIScreenContext.Provider value={value}>
            {children}
        </UIScreenContext.Provider>
    );
}

export function useUIScreen(): UIScreenContextValue {
    const content = useContext(UIScreenContext);
    if (!content) throw new Error("useUIScreen must be used within a UIScreenProvider.");
    return content;
}


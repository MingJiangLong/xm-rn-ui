import { createContext, memo, PropsWithChildren, useContext, useMemo } from "react";
import { useWindowDimensions } from "react-native";

interface UIScreenContextValue {
    scaleX: number
    scaleY: number
}

const UIScreenContext = createContext<UIScreenContextValue | null>(null);

type UIScreenProviderProps = PropsWithChildren<{
    designPixelWidth?: number;
    designPixelHeight?: number;
}>;

const DEFAULT_DESIGN_WIDTH = 375;
const DEFAULT_DESIGN_HEIGHT = 812;

export const UIScreenProvider = memo(
    function UIScreenProvider({
        children,
        designPixelWidth = DEFAULT_DESIGN_WIDTH,
        designPixelHeight = DEFAULT_DESIGN_HEIGHT,
    }: UIScreenProviderProps) {
        const { width: screenDpWidth, height: screenDpHeight } = useWindowDimensions();

        const value = useMemo(
            () => ({
                scaleX: screenDpWidth / designPixelWidth,
                scaleY: screenDpHeight / designPixelHeight,
            }),
            [designPixelWidth, designPixelHeight, screenDpWidth, screenDpHeight]
        );

        return (
            <UIScreenContext.Provider value={value}>
                {children}
            </UIScreenContext.Provider>
        );
    }
)

export function useUIScreen(): UIScreenContextValue {
    const content = useContext(UIScreenContext);
    if (!content) throw new Error("useUIScreen must be used within a UIScreenProvider.");
    return content;
}


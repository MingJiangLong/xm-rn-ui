import { Image as RnImage, ImageProps } from 'react-native'
import { useUIScreen } from '../provider/ui-screen'
import { useMemo } from 'react';
export default function Image(props: ImageProps & {
    designWidth?: number, designHeight?: number, scaleBy?: "width" | "height"
}) {

    const { designWidth, designHeight, style, scaleBy = "width", ...rest } = props
    const {
        designWidth: baseDesignWidth, designHeight: baseDesignHeight,
        screenWidth: screenWidthPx, screenHeight: screenHeightPx
    } = useUIScreen();

    const computedSize = useMemo(() => {
        if (!designWidth || !designHeight) return {};
        if (scaleBy === "width") {
            const computedWidth = (designWidth / baseDesignWidth) * screenWidthPx;
            return {
                width: computedWidth,
                height: computedWidth / (designWidth / designHeight),
            };
        }

        const computedHeight = (designHeight / baseDesignHeight) * screenHeightPx;
        return {
            width: computedHeight / (designHeight / designWidth),
            height: computedHeight,
        };
    }, [baseDesignWidth, baseDesignHeight, screenWidthPx, screenHeightPx, designWidth, designHeight, scaleBy]);

    return (
        <RnImage {...rest} style={[computedSize, style]} />
    )
}
import { ImageBackground as RnImageBackground, type ImageProps as RnImageProps } from 'react-native'
import { useUIScreen } from '../../provider/ui-screen.provider'
import { memo, useMemo } from 'react';

type ImageBackgroundProps = RnImageProps & {
    pixelWidth?: number, pixelHeight?: number, scaleBy?: "width" | "height"
}
export const ImageBackground = memo(
    function ImageBackground(props: ImageBackgroundProps) {

        const { pixelWidth, pixelHeight, style, scaleBy = "width", ...rest } = props
        const {
            scaleX, scaleY
        } = useUIScreen();
        const computedSize = useMemo(() => {
            if (!pixelWidth || !pixelHeight) return undefined;
            if (scaleBy === "width") {
                const computedWidth = scaleX * pixelWidth;
                return {
                    width: computedWidth,
                    height: (computedWidth / pixelWidth) * pixelHeight,
                };
            }
            const computedHeight = scaleY * pixelHeight;
            return {
                height: computedHeight,
                width: computedHeight / pixelHeight * pixelWidth,
            };
        }, [pixelWidth, pixelHeight, scaleBy, scaleX, scaleY]);

        const styles = useMemo(() => {
            return [computedSize, style]
        }, [computedSize, style])

        return (
            <RnImageBackground {...rest} style={styles} />
        )
    }
)
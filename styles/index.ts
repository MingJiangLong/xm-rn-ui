import {
    ImageStyle, TextStyle, ViewStyle,
    StyleSheet, RegisteredStyle, Dimensions,
    PixelRatio
} from "react-native";

export enum FixedDimension {
    Height = 1,
    Width = 2,
}
const RESIZE_REGEX = /^(\-?\d+(?:\.\d*)?)@(h|v)(r?)$/;

function resizeValue(
    resizeHorizontal: (value: number) => number,
    resizeVertical: (value: number) => number,
) {
    return (value: any) => {
        if (typeof value !== 'string') return value;
        const match = RESIZE_REGEX.exec(value);
        if (!match) return value;

        const [_all, size, resizedType, needRound] = match;
        const sizeNumber = parseFloat(size);
        const roundFn = needRound === 'r' ? (v: number) => Math.round(v) : (v: number) => v;
        const resizeFn = resizedType === 'v' ? resizeVertical : resizeHorizontal;

        return PixelRatio.roundToNearestPixel(roundFn(resizeFn(sizeNumber)));
    };
}


function resizeObjectAndArrayValue(items: any, resizeFn: (value: any) => any): any {
    if (isPlainObject(items)) {
        return Object.keys(items).reduce((total, current) => {
            total[current] = resizeObjectAndArrayValue(items[current], resizeFn);
            return total;
        }, {} as any);
    }
    if (Array.isArray(items)) {
        return items.map((it) => resizeObjectAndArrayValue(it, resizeFn));
    }
    return resizeFn(items);
}

function isPlainObject(value: any): value is Record<string, any> {
    return Object.prototype.toString.call(value) === '[object Object]';
}


function createResponsiveStyleBuilder(UIWidth: number = 375, UIHeight: number = 812) {
    const { width: tempWidthDp, height: tempHeightDp } = Dimensions.get("window");
    // 实际设备的宽高（按短边/长边排序以适配横竖屏）
    const [windowWidthDp, windowHeightDp] = tempWidthDp > tempHeightDp ? [tempHeightDp, tempWidthDp] : [tempWidthDp, tempHeightDp];
    /**
     * container 信息
     * 还是会有问题
     * 如果长宽高不能撑满整个试图？
     * @param currentWidthPx 当前容器px宽
     * @param currentHeightPx 当前容器px高
     */
    return <T extends StylesMap<ViewStyle, TextStyle, ImageStyle>>(styleObject: T) => {
        return StyleSheet.create(
            resizeObjectAndArrayValue(
                styleObject,
                resizeValue(
                    (horizontalPxValue: number) => (horizontalPxValue / UIWidth) * windowWidthDp,
                    (verticalPxValue: number) => (verticalPxValue / UIHeight) * windowHeightDp
                ))
        ) as {
                [P in keyof T]: RegisteredStyle<{
                    [S in keyof T[P]]: T[P][S] extends ResizedValue ? number : T[P][S];
                }>;
            };
    };
}

// Memoized factories cache: keyed by design+window dimensions to avoid rebuilding builders
const responsiveBuilderCache = new Map<string, ReturnType<typeof createResponsiveStyleBuilder>>();
const aspectRatioBuilderCache = new Map<string, ReturnType<typeof createAspectRatioStyleBuilder>>();

function memoizedCreateResponsiveStyleBuilder(UIWidth: number = 375, UIHeight: number = 812) {
    const { width: tempWidthDp, height: tempHeightDp } = Dimensions.get("window");
    const [windowWidthDp, windowHeightDp] = tempWidthDp > tempHeightDp ? [tempHeightDp, tempWidthDp] : [tempWidthDp, tempHeightDp];
    const key = `${UIWidth}x${UIHeight}-${windowWidthDp}x${windowHeightDp}`;
    const existing = responsiveBuilderCache.get(key);
    if (existing) return existing;
    const builder = createResponsiveStyleBuilder(UIWidth, UIHeight);
    responsiveBuilderCache.set(key, builder);
    return builder;
}

function memoizedCreateAspectRatioStyleBuilder(UIWidth: number = 375, UIHeight: number = 812) {
    const { width: tempWidthDp, height: tempHeightDp } = Dimensions.get("window");
    const [windowWidthDp, windowHeightDp] = tempWidthDp > tempHeightDp ? [tempHeightDp, tempWidthDp] : [tempWidthDp, tempHeightDp];
    const key = `${UIWidth}x${UIHeight}-${windowWidthDp}x${windowHeightDp}`;
    const existing = aspectRatioBuilderCache.get(key);
    if (existing) return existing;
    const builder = createAspectRatioStyleBuilder(UIWidth, UIHeight);
    aspectRatioBuilderCache.set(key, builder);
    return builder;
}
function createAspectRatioStyleBuilder(UIWidth: number = 375, UIHeight: number = 812) {

    const { width: tempWidthDp, height: tempHeightDp } = Dimensions.get("window");
    // 实际设备的宽高（按短边/长边排序以适配横竖屏）
    const [windowWidthDp, windowHeightDp] = tempWidthDp > tempHeightDp ? [tempHeightDp, tempWidthDp] : [tempWidthDp, tempHeightDp];
    /**
     * container 信息
     * 还是会有问题
     * 如果长宽高不能撑满整个试图？
     * @param currentWidthPx 当前容器px宽
     * @param currentHeightPx 当前容器px高
     */
    return (localWidthPx: number = 375, localHeightPx: number = 812, fixed = FixedDimension.Width) => {

        let localWidthDp = windowWidthDp * (localWidthPx / UIWidth);
        let localHeightDp = windowHeightDp * (localHeightPx / UIHeight);

        if (fixed == FixedDimension.Height) {
            localWidthDp = localHeightDp * (localWidthPx / localHeightPx);
        }

        if (fixed == FixedDimension.Width) {
            localHeightDp = localWidthDp / (localWidthPx / localHeightPx);
        }
        return <T extends StylesMap<ViewStyle, TextStyle, ImageStyle>>(styleObject: T) => {
            return StyleSheet.create(
                resizeObjectAndArrayValue(
                    styleObject,
                    resizeValue(
                        (horizontalPxValue: number) => (horizontalPxValue / localWidthPx) * localWidthDp,
                        (verticalPxValue: number) => (verticalPxValue / localHeightPx) * localHeightDp
                    ))
            ) as {
                    [P in keyof T]: RegisteredStyle<{
                        [S in keyof T[P]]: T[P][S] extends ResizedValue ? number : T[P][S];
                    }>;
                };
        };
    }


}

export function createInlineStyle<T extends StyleValue<TextStyle | ViewStyle | ImageStyle>>(value: T) {
    const temp = createResponsiveStyle({
        appStyle: value,
    });
    return temp.appStyle;
}


export const createAspectRatioStyle = memoizedCreateAspectRatioStyleBuilder();
export const createResponsiveStyle = memoizedCreateResponsiveStyleBuilder();


type HorizontalResizedValue = `${number}@h${'r' | ''}`;
type VerticalResizedValue = `${number}@v${'r' | ''}`;
type ResizedValue = HorizontalResizedValue | VerticalResizedValue;

type StyleValue<T> = { [P in keyof T]: number extends T[P] ? ResizedValue | T[P] : T[P] };

type ViewStyleMap<T> = StyleValue<T>;
type TextStyleMap<T> = StyleValue<T>;
type ImageStyleMap<T> = StyleValue<T>;

type StylesMap<V, T, I> = { [k: string]: ViewStyleMap<V> | TextStyleMap<T> | ImageStyleMap<I> };


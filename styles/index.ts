import {
    ImageStyle, TextStyle, ViewStyle,
    //@ts-ignore
    StyleSheet, RegisteredStyle, Dimensions,
    PixelRatio
} from "react-native";

export enum FixSize {
    height = 1,
    width = 2
}

function resizeValue(
    resizeHorizontal: (value: any) => any,
    resizeVertical: (value: any) => any,
) {
    return (value: any) => {
        const regexp = /^(\-?\d+(?:\.\d*)?)@(h|v)(r?)$/
        const canResize = regexp.test(value);
        if (!canResize) return value;
        const regexpResult = regexp.exec(value);
        if (!regexpResult) return value;
        const [_all, size, resizedType, needRound] = regexpResult;
        const sizeNumber = parseFloat(size);
        let roundFn = (value: number) => value;
        if (needRound == "r") {
            roundFn = (value: number) => Math.round(value)
        }
        let resizeFn = resizeHorizontal;
        if (resizedType == "v") {
            resizeFn = resizeVertical
        }
        return PixelRatio.roundToNearestPixel(roundFn(resizeFn(sizeNumber)));
    }
}


function resizeObjectAndArrayValue(items: any, resizeFn: (value: any) => any): any {
    const isValueObject = isObject(items);
    const isValueArray = Array.isArray(items)
    if (isValueObject) {
        return Object.keys(items).reduce((total, current) => {
            total[current] = resizeObjectAndArrayValue(items[current], resizeFn);
            return total;
        }, {} as any)
    }
    if (isValueArray) {
        return items.map(resizeFn)
    }
    return resizeFn(items);
}

function isObject(value: any) {
    return Object.prototype.toString.call(value) === '[object Object]'
}


function createAppStyleBuilder(UIWidth: number = 375, UIHeight: number = 812) {
    const { width: temptWidthDp, height: temptHeightDp } = Dimensions.get("window");
    // 实际上设备的宽高
    const [windowWidthDp, windowHeightDp] = temptWidthDp > temptHeightDp ? [temptHeightDp, temptWidthDp] : [temptWidthDp, temptHeightDp,]
    /**
     * container 信息
     * 还是会有问题
     * 如果长宽高不能撑满整个试图？
     * @param currentWidthPx 当前容器px宽
     * @param currentHeightPx 当前容器px高
     */
    return <T extends I_Styles<ViewStyle, TextStyle, ImageStyle>>(styleObject: T) => {
        return StyleSheet.create(
            resizeObjectAndArrayValue(
                styleObject,
                resizeValue(
                    (horizontalPxValue: number) => (horizontalPxValue / UIWidth) * windowWidthDp,
                    (verticalPxValue: number) => (verticalPxValue / UIHeight) * windowHeightDp
                ))
        ) as {
                [P in keyof T]: RegisteredStyle<{
                    [S in keyof T[P]]: T[P][S] extends I_ResizedValue ? number : T[P][S];
                }>;
            }
    }
}
function createAspectStyleBuilder(UIWidth: number = 375, UIHeight: number = 812) {

    const { width: temptWidthDp, height: temptHeightDp } = Dimensions.get("window");
    // 实际上设备的宽高
    const [windowWidthDp, windowHeightDp] = temptWidthDp > temptHeightDp ? [temptHeightDp, temptWidthDp] : [temptWidthDp, temptHeightDp,]
    /**
     * container 信息
     * 还是会有问题
     * 如果长宽高不能撑满整个试图？
     * @param currentWidthPx 当前容器px宽
     * @param currentHeightPx 当前容器px高
     */
    return (localWidthPx: number = 375, localHeightPx: number = 812, fixed = FixSize.width) => {

        let localWidthDp = windowWidthDp * (localWidthPx / UIWidth);
        let localHeightDp = windowHeightDp * (localHeightPx / UIHeight);

        if (fixed == FixSize.height) {
            localWidthDp = localHeightDp * (localWidthPx / localHeightPx)
        }

        if (fixed == FixSize.width) {
            localHeightDp = localWidthDp / (localWidthPx / localHeightPx)
        }
        return <T extends I_Styles<ViewStyle, TextStyle, ImageStyle>>(styleObject: T) => {
            return StyleSheet.create(
                resizeObjectAndArrayValue(
                    styleObject,
                    resizeValue(
                        (horizontalPxValue: number) => (horizontalPxValue / localWidthPx) * localWidthDp,
                        (verticalPxValue: number) => (verticalPxValue / localHeightPx) * localHeightDp
                    ))
            ) as {
                    [P in keyof T]: RegisteredStyle<{
                        [S in keyof T[P]]: T[P][S] extends I_ResizedValue ? number : T[P][S];
                    }>;
                }
        }
    }


}

export function createInlineStyle<T extends I_StyleValue<TextStyle | ViewStyle | ImageStyle>>(value: T) {
    const temp = createAppStyle({
        appStyle: value
    })
    return temp.appStyle;
}


export const createAspectStyle = createAspectStyleBuilder();
export const createAppStyle = createAppStyleBuilder()



type I_HorizontalValue = `${number}@h${'r' | ''}`;
type I_VerticalValue = `${number}@v${'r' | ''}`;
type I_ResizedValue = I_HorizontalValue | I_VerticalValue;

type I_StyleValue<T> = { [P in keyof T]: number extends T[P] ? I_ResizedValue | T[P] : T[P] };

type I_ViewStyle<T> = I_StyleValue<T>;
type I_TextStyle<T> = I_StyleValue<T>;
type I_ImageStyle<T> = I_StyleValue<T>;

type I_Styles<V, T, I> = { [k: string]: I_ViewStyle<V> | I_TextStyle<T> | I_ImageStyle<I> };


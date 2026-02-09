import { ImageSourcePropType, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useMemo, useCallback } from "react";

interface DragProps {
    imageSource?: ImageSourcePropType;
    onPress?: () => void;
    nodeWidth?: number;
    nodeHeight?: number;
    initPosition?: {
        left: number;
        top: number;
    };
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

const DEFAULT_NODE_SIZE = 50;
const DEFAULT_BOTTOM_OFFSET = 100;
const OPACITY_PRESSED = 0.5;
const OPACITY_NORMAL = 1;

export default function Drag(props: DragProps) {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const {
        nodeHeight = DEFAULT_NODE_SIZE,
        nodeWidth = DEFAULT_NODE_SIZE,
        onPress,
        imageSource,
        top = 0,
        bottom = 0,
        left = 0,
        right = 0,
        initPosition
    } = props;

    // 计算默认初始位置
    const defaultInitPosition = useMemo(
        () => ({
            left: windowWidth - nodeWidth,
            top: windowHeight - nodeHeight - DEFAULT_BOTTOM_OFFSET
        }),
        [windowWidth, windowHeight, nodeWidth, nodeHeight]
    );

    const finalInitPosition = initPosition || defaultInitPosition;

    const isPressed = useSharedValue(false);
    const offset = useSharedValue({ x: 0, y: 0 });
    const start = useSharedValue({ x: 0, y: 0 });
    const dragged = useSharedValue(false);

    // 优化：提取边界检测逻辑
    const isWithinBounds = useCallback(
        (x: number, y: number): boolean => {
            const minX = nodeWidth / 2 + left;
            const maxX = windowWidth - nodeWidth / 2 - right;
            const minY = nodeHeight / 2 + top;
            const maxY = windowHeight - nodeHeight / 2 - bottom;

            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        },
        [nodeWidth, nodeHeight, left, right, top, bottom, windowWidth, windowHeight]
    );

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: offset.value.x },
            { translateY: offset.value.y }
        ],
        opacity: withSpring(isPressed.value ? OPACITY_PRESSED : OPACITY_NORMAL)
    }));

    const gesture = useMemo(
        () =>
            Gesture.Pan()
                .onBegin(() => {
                    isPressed.value = true;
                    dragged.value = false;
                })
                .onUpdate((e) => {
                    if (!isWithinBounds(e.absoluteX, e.absoluteY)) return;

                    offset.value = {
                        x: e.translationX + start.value.x,
                        y: e.translationY + start.value.y
                    };
                    dragged.value = true;
                })
                .onEnd(() => {
                    start.value = {
                        x: offset.value.x,
                        y: offset.value.y
                    };
                })
                .onFinalize(() => {
                    isPressed.value = false;
                    if (!dragged.value) {
                        runOnJS(onPress ?? (() => { }))();
                    }
                })
                .runOnJS(true),
        [isWithinBounds, onPress]
    );

    return (
        <GestureDetector gesture={gesture}>
            <Animated.Image
                source={imageSource}
                style={[
                    {
                        width: nodeWidth,
                        height: nodeHeight,
                        position: 'absolute',
                        ...finalInitPosition
                    },
                    animatedStyles
                ]}
            />
        </GestureDetector>
    );
}
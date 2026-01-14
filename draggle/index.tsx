import { ImageSourcePropType, StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export default function Drag(
    props: {
        imageSource?: ImageSourcePropType
        onPress?: () => void
        nodeWidth?: number
        nodeHeight?: number
        initPosition?: {
            left: number
            top: number
        }
        top?: number
        bottom?: number
        left?: number
        right?: number
    }) {

    const { width: windowWidth, height: windowHeight } = useWindowDimensions()

    const {
        nodeHeight = 50, nodeWidth = 50, onPress, imageSource,
        top = 0, bottom = 0, left = 0, right = 0,
        initPosition = {
            left: windowWidth - nodeWidth,
            top: windowHeight - nodeHeight - 100
        } } = props;
    // const { left, right, top, bottom } = useSafeAreaInsets()

    const isPressed = useSharedValue(false);
    const offset = useSharedValue({ x: 0, y: 0 });
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: offset.value.x },
                { translateY: offset.value.y },
            ],
            opacity: withSpring(isPressed.value ? 0.5 : 1),
        };
    });

    const start = useSharedValue({ x: 0, y: 0 });
    const dragged = useSharedValue(false)
    const gesture = Gesture.Pan()
        .onBegin(() => {
            isPressed.value = true;
            dragged.value = false;
        })
        .onUpdate((e) => {
            if (
                e.absoluteX < (nodeWidth / 2 + left) ||
                e.absoluteX > (windowWidth - nodeWidth / 2 + right) ||
                e.absoluteY < (nodeHeight / 2 + top) ||
                e.absoluteY > (windowHeight - nodeHeight / 2 - bottom - top))
                return
            offset.value = {
                x: e.translationX + start.value.x,
                y: e.translationY + start.value.y,
            };
            dragged.value = true
        })
        .onEnd(() => {
            start.value = {
                x: offset.value.x,
                y: offset.value.y,
            };
        })
        .onFinalize((e) => {
            isPressed.value = false;
            runOnJS(() => {
                if (!dragged.value) {
                    onPress?.()
                }
            })()
        }).runOnJS(true);

    return (
        <>
            <GestureDetector gesture={gesture}>
                <Animated.Image
                    source={imageSource}
                    style={[
                        { width: nodeWidth, height: nodeHeight, position: 'absolute', ...initPosition },
                        animatedStyles
                    ]} />
            </GestureDetector>
        </>
    );
}
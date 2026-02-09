import React, { useCallback, useRef, useMemo } from 'react';
import {
    StyleProp,
    ViewStyle,
    AccessibilityRole,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureStateChangeEvent,
    TapGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';

interface TouchableOpacityProps {
    children?: React.ReactNode;
    onPress?: (event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: AccessibilityRole;
    /** 防抖延迟时间（毫秒） */
    debounceTime?: number;
}

const ANIMATION_CONFIG = {
    duration: 150,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
};

const DEFAULT_DEBOUNCE_TIME = 300;
const DEFAULT_ACCESSIBILITY_ROLE = "adjustable";
const PRESSED_OPACITY = 0.7;

export const TouchableOpacity = React.memo(function TouchableOpacity(props: TouchableOpacityProps) {
    const {
        children,
        onPress,
        style,
        disabled = false,
        accessible = true,
        accessibilityLabel,
        accessibilityHint,
        debounceTime = DEFAULT_DEBOUNCE_TIME,
        accessibilityRole = DEFAULT_ACCESSIBILITY_ROLE
    } = props;

    const opacity = useSharedValue(1);
    const lastPressTime = useRef(0);

    const handlePress = useCallback(
        (event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => {
            if (disabled || !onPress) return;

            const now = Date.now();
            if (now - lastPressTime.current < debounceTime) return;

            lastPressTime.current = now;
            onPress(event);
        },
        [disabled, onPress, debounceTime]
    );

    const tap = useMemo(
        () =>
            Gesture.Tap()
                .enabled(!disabled)
                .onBegin(() => {
                    opacity.set(withTiming(PRESSED_OPACITY, ANIMATION_CONFIG));
                })
                .onFinalize(() => {
                    opacity.set(withTiming(1, ANIMATION_CONFIG));
                })
                .onEnd((event, success) => {
                    if (success) {
                        runOnJS(handlePress)(event);
                    }
                }),
        [disabled, handlePress]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.get(),
    }));

    const accessibilityState = useMemo(
        () => ({ disabled }),
        [disabled]
    );

    return (
        <GestureDetector gesture={tap}>
            <Animated.View
                style={[animatedStyle, style]}
                accessible={accessible}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityRole={accessibilityRole}
                accessibilityState={accessibilityState}
            >
                {children}
            </Animated.View>
        </GestureDetector>
    );
});

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
import Animated, { runOnJS } from 'react-native-reanimated';

interface PressableProps {
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

const DEFAULT_DEBOUNCE_TIME = 300;
const DEFAULT_ACCESSIBILITY_ROLE = "adjustable";

export const Pressable = React.memo(function Pressable(props: PressableProps) {
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
                .onEnd((event, success) => {
                    if (success) {
                        runOnJS(handlePress)(event);
                    }
                }),
        [disabled, handlePress]
    );

    const accessibilityState = useMemo(
        () => ({ disabled }),
        [disabled]
    );

    return (
        <GestureDetector gesture={tap}>
            <Animated.View
                style={style}
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

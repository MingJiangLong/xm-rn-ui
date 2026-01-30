import React, { useCallback, useRef } from 'react';
import {
    StyleProp,
    Text,
    ViewStyle,
    ActivityIndicator,
    TextStyle,
} from "react-native";

import {
    Gesture, GestureDetector, GestureStateChangeEvent,
    TapGestureHandlerEventPayload
} from 'react-native-gesture-handler'

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated'

export interface ButtonTheme {
    containerStyles?: {
        primary?: ViewStyle;
        secondary?: ViewStyle;
        outline?: ViewStyle;
        ghost?: ViewStyle;
        [key: string]: ViewStyle | undefined
    }
    containerSizes?: {
        small?: ViewStyle;
        medium?: ViewStyle;
        large?: ViewStyle;
        [key: string]: ViewStyle | undefined
    }

    textStyles?: {
        primary?: TextStyle;
        secondary?: TextStyle;
        outline?: TextStyle;
        ghost?: TextStyle;
        [key: string]: TextStyle | undefined
    }
    textSizes?: {
        small?: TextStyle;
        medium?: TextStyle;
        large?: TextStyle;
        [key: string]: TextStyle | undefined
    }
    loadingColor?: {
        primary?: string;
        secondary?: string;
        outline?: string;
        ghost?: string;
        [key: string]: string | undefined
    }
}
const ButtonThemeContext = React.createContext<ButtonTheme | null>(null);
export const ButtonThemeProvider = ButtonThemeContext.Provider;

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface I_ButtonProps {
    children?: React.ReactNode;
    onPress?: (event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;


    variant?: ButtonVariant;
    size?: ButtonSize;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;

    /** 防抖 */
    debounceTime?: number;
    /** 按钮是否处于加载状态 */
    loading?: boolean;
}

const ANIMATION_CONFIG = {
    duration: 150,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
};

export const Button = React.memo(function Button(props: I_ButtonProps) {
    const {
        children,
        onPress,
        style,
        disabled = false,
        loading = false,
        variant = 'primary',
        size = 'medium',
        accessible = true,
        accessibilityLabel,
        accessibilityHint,
        debounceTime = 300,
    } = props;
    const theme = React.useContext(ButtonThemeContext);
    const isDisabled = disabled || loading;
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);
    const lastPressTime = useRef(0);

    const getVariantStyle = () => {
        if (theme?.containerStyles?.[variant]) return theme?.containerStyles?.[variant];
        return styles.containerStyles[variant] || styles.containerStyles.primary;
    };

    const getVariantSizeStyle = () => {
        if (theme?.containerSizes?.[size]) return theme?.containerSizes?.[size];
        return styles.containerSizes?.[size] || styles.containerSizes.medium;
    }

    const getLoadingColor = () => {
        if (theme?.loadingColor?.[variant]) return theme?.loadingColor[variant];
        return "#FFF"
    }
    const handlePress = useCallback((event: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => {
        if (isDisabled || !onPress) return;

        const now = Date.now();
        if (now - lastPressTime.current < debounceTime) return;
        lastPressTime.current = now;

        onPress(event);
    }, [isDisabled, onPress, debounceTime]);

    const tap = Gesture.Tap()
        .enabled(!isDisabled)
        .onBegin(() => {
            opacity.set(withTiming(0.7, ANIMATION_CONFIG));
            scale.set(withTiming(0.98, ANIMATION_CONFIG));
        })
        .onFinalize(() => {
            opacity.set(withTiming(1, ANIMATION_CONFIG));
            scale.set(withTiming(1, ANIMATION_CONFIG));
        })
        .onEnd((event, success) => {
            if (success) {
                runOnJS(handlePress)(event);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));
    const buttonStyle: StyleProp<ViewStyle> = [
        styles.baseContainer,
        getVariantStyle(), // 应用动态 variant
        getVariantSizeStyle(),
        isDisabled && styles.disabled,
        animatedStyle,
        style,
    ];

    return (
        <GestureDetector gesture={tap}>
            <Animated.View
                style={buttonStyle}
                accessible={accessible}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityRole="button"
                accessibilityState={{ disabled: isDisabled }}
            >
                {
                    loading ? (
                        <ActivityIndicator
                            size="small"
                            color={getLoadingColor()}
                        />
                    ) : (
                        children
                    )}
            </Animated.View>
        </GestureDetector>
    );
})



interface I_ButtonTextProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    style?: StyleProp<TextStyle>;
}

export const ButtonText = React.memo(
    function (props: I_ButtonTextProps) {
        const { children, variant = 'primary', size = 'medium', disabled = false, style } = props;
        const theme = React.useContext(ButtonThemeContext);

        const getTextVariantStyle = () => {
            if (theme?.textStyles?.[variant]) return theme?.textStyles?.[variant];
            return styles.textVariants[variant] || styles.textVariants.primary;
        };

        const getTextSizeStyle = () => {
            if (theme?.textSizes?.[size]) return theme?.textSizes?.[size];
            return styles.textSizes[size] || styles.textSizes.medium;
        };

        const textStyle = [
            styles.baseText,
            getTextVariantStyle(),
            getTextSizeStyle(),
            disabled && styles.textDisabled,
            style,
        ];

        return <Text style={textStyle}>{children}</Text>;
    }
)

const styles = {
    baseContainer: {
        borderRadius: 8,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
    },
    // Variants
    containerStyles: {
        primary: {
            backgroundColor: '#007AFF',
        },
        secondary: {
            backgroundColor: '#F2F2F7',
        },
        outline: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#007AFF',
        },
        ghost: {
            backgroundColor: 'transparent',
        },
    },
    containerSizes: {
        small: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            minHeight: 36,
        },
        medium: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            minHeight: 44,
        },
        large: {
            paddingVertical: 16,
            paddingHorizontal: 32,
            minHeight: 52,
        },
    },
    // States
    disabled: {
        opacity: 0.5,
    },
    // Text styles
    baseText: {
        fontWeight: '600' as const,
        textAlign: 'center' as const,
    },
    textVariants: {
        primary: { color: '#fff' },
        secondary: { color: '#007AFF' },
        outline: { color: '#007AFF' },
        ghost: { color: '#007AFF' },
    },
    textSizes: {
        small: { fontSize: 14 },
        medium: { fontSize: 16 },
        large: { fontSize: 18 },
    },
    textDisabled: {
        color: '#8E8E93',
    },
};


import React, { useCallback, useMemo, useState } from 'react'
import { TextInput as RnTextInput, FocusEvent, TextInputProps, View, StyleProp, ViewStyle } from 'react-native'

type I_TextInputProps = {
    prefix?: React.ReactNode
    suffix?: React.ReactNode
    containerStyle?: StyleProp<ViewStyle> | ((options: { focused: boolean }) => StyleProp<ViewStyle>)
    inputStyle?: TextInputProps["style"] | ((options: { focused: boolean }) => TextInputProps["style"])
} & Omit<TextInputProps, "style">
export default function TextInput(props: I_TextInputProps) {

    const { inputStyle, containerStyle, onBlur, onFocus, ...rest } = props

    const [focused, setFocused] = useState(false)

    const wrapperOnBlur = useCallback((e: FocusEvent) => {
        setFocused(false)
        onBlur?.(e)
    }, [onBlur])

    const wrapperOnFocus = useCallback((e: FocusEvent) => {
        setFocused(true)
        onFocus?.(e)
    }, [onFocus])


    const styleMemo = useMemo(() => {
        if (typeof inputStyle === "function") {
            return inputStyle({ focused })
        }
        return inputStyle
    }, [inputStyle, focused])

    const containerMemo = useMemo(() => {
        if (typeof containerStyle === "function") {
            return containerStyle({ focused })
        }
        return containerStyle
    }, [containerStyle, focused])


    return (
        <View style={[{ flexDirection: 'row', columnGap: 8, alignItems: 'center' }, containerMemo]}>
            {props.prefix}
            <RnTextInput
                {...rest}
                onBlur={wrapperOnBlur}
                onFocus={wrapperOnFocus}
                style={[{ flex: 1 }, styleMemo]}
            />
            {props.suffix}
        </View>
    )
}
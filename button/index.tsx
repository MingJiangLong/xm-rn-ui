import { PropsWithChildren, useMemo } from "react";
import {
    StyleProp, TextStyle,
    TouchableOpacity, ViewStyle,
    StyleSheet, Text
} from "react-native";





interface ButtonProps extends PropsWithChildren<{}> {
    containerStyle?: StyleProp<ViewStyle>
    textStyle?: StyleProp<TextStyle>
    title?: string | number
}
export function Button(props: ButtonProps) {

    const { containerStyle, textStyle, children, title } = props


    const childrenNode = useMemo(() => {
        if (title) return (
            <Text style={[styles.text, textStyle]}>{title}</Text>
        )

        return children;
    }, [children, title])
    return (
        <TouchableOpacity style={[styles.container, containerStyle]}>
            {childrenNode}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({


    container: {
        paddingVertical: 11,
        justifyContent: "center",
        alignItems: "center"
    },
    text: {
        fontSize: 18,
        color: "black"
    }
})
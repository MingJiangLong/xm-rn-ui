import { PropsWithChildren, useMemo } from "react";
import { StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";


interface I_ButtonProps extends PropsWithChildren<{}> {
    title?: React.ReactNode
    containerStyle?: StyleProp<ViewStyle>
    textStyle?: StyleProp<TextStyle>
    onPress?: () => void
}
export default function Button(props: I_ButtonProps) {

    const { children, containerStyle, textStyle, onPress, title } = props


    const childrenNode = useMemo(() => {
        if (children) return children;
        if (title == undefined) return <></>
        const titleType = typeof title;
        if (titleType == "string" || titleType == "number" || titleType == "boolean") {
            return <Text style={[{ fontSize: 16 }, textStyle]}>{title}</Text>
        }
        return title
    }, [children, textStyle])
    return (
        <TouchableOpacity
            style={[{ justifyContent: "center", alignItems: 'center' }, containerStyle]}
            onPress={onPress}
        >
            {childrenNode}
        </TouchableOpacity>
    )
}
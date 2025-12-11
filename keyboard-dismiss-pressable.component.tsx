import type { PropsWithChildren } from "react";
import React, { useRef } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";


/**
 * 点击非输入框时,自动收起键盘
 * @param param0 
 * @returns 
 */
export default function KeyboardDismissPressable({ children }: PropsWithChildren) {
    const isTargetTextInput = useRef(false);

    const tap = Gesture.Tap()
        .onEnd(() => {
            if (!isTargetTextInput.current) {
                Keyboard.dismiss();
            }
        })
        .runOnJS(true);

    return (
        <GestureDetector gesture={tap}>
            <View
                style={styles.container}
                onStartShouldSetResponderCapture={(e) => {
                    console.log(e);
                    // 好像只有textinput 才有target
                    // if (e.nativeEvent.target) {
                    //     isTargetTextInput.current = true;
                    // } else {
                    //     isTargetTextInput.current = false
                    // }
                    return false;
                }}
                accessible={false}
            >
                {children}
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
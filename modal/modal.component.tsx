import { createContext, FC, PropsWithChildren, useEffect, useRef, useState } from "react";
import { Host, Portal } from "react-native-portalize";
import React from 'react'
import { ViewStyle, StyleProp, Keyboard, DeviceEventEmitter, StyleSheet, useWindowDimensions, ScrollView, View, Platform, } from "react-native";
import Animated, { AnimatableValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { runOnJS, runOnRuntime } from 'react-native-worklets'
const OPEN_OBSERVER_MODAL = "__OPEN_OBSERVER_MODAL__"
const CLOSE_OBSERVER_MODAL = "__CLOSE_OBSERVER_MODAL__"

const buildOpenName = (id?: string) => `${OPEN_OBSERVER_MODAL}__${id}`
const buildCloseName = (id?: string) => `${CLOSE_OBSERVER_MODAL}__${id}`
interface I_ModalProviderProps { }


const ModalContext = createContext({
    loadingCount: 0,
    noticeCount: 0,
    modalCount: 0,
    updateNoticeCount: () => { }
})
export function ModalProvider(props: PropsWithChildren<I_ModalProviderProps>) {
    const { children } = props;
    return (
        <Host>
            {/* <ModalContext.Provider value={{}}> */}

            {children}
            {/* </ModalContext.Provider> */}
        </Host>
    )
}

interface I_ObserverModalProps {
    id?: string
    modalContainerStyle?: StyleProp<ViewStyle>
    onModalShow?: (modalName?: string) => void
    onModalClose?: (modalName?: string) => void
}


interface I_OpenObserverModalOptions {
    children: React.ReactNode
    moreModalContainerStyle?: StyleProp<ViewStyle>

}

interface I_ObserverModal extends FC<I_ObserverModalProps> {
    /**
     * 打开observer弹窗
     * @param options 
     */
    open: (options: I_OpenObserverModalOptions, id?: string) => void
    /**
     * 打开observer弹窗
     * @param options 
     */
    close: (id?: string) => void
}

/**
 * 弹窗 自身通过监听来管理show
 * @param props 
 * @returns 
 */
const ObserverModalFn: I_ObserverModal = function (props) {
    const { modalContainerStyle, onModalClose, id } = props
    const [show, setShow] = useState(false)
    const [moreModalContainerStyle, setMoreModalContainerStyle] = useState<StyleProp<ViewStyle>>([])
    const [childrenNode, setChildrenNode] = useState<React.ReactNode>(undefined)
    const open: I_ObserverModal["open"] = function (options) {
        const { children, moreModalContainerStyle } = options
        setMoreModalContainerStyle(moreModalContainerStyle)
        setChildrenNode(children)
        setShow(true)
    }

    const close: I_ObserverModal["close"] = function () {
        setShow(false)
    }

    const addListener = function () {
        const openSub = DeviceEventEmitter.addListener(buildOpenName(id), open)
        const closeSub = DeviceEventEmitter.addListener(buildCloseName(id), close)

        return () => {
            openSub.remove()
            closeSub.remove()
        }
    }


    useEffect(addListener, [])
    return (
        <Modal show={show} modalContainerStyle={[styles.modalContainer, modalContainerStyle, moreModalContainerStyle,]}>
            {childrenNode}
        </Modal>
    )

}

/**
 * 
 * @param options 
 * @param modalGroupName 来源于是否有被ListenerGroup包裹   有则是 ListenerGroup的props.groupName
 */
const openObserverModal: (options: I_OpenObserverModalOptions, id?: string) => void = function (options, id) {
    DeviceEventEmitter.emit(buildOpenName(id), options)
}

/**
 * 关闭弹窗
 * @param modalGroupName 来源于是否有被ListenerGroup包裹   有则是 ListenerGroup的props.groupName
 */
function closeObserverModal(id?: string) {
    DeviceEventEmitter.emit(buildCloseName(id))
}


ObserverModalFn.open = openObserverModal
ObserverModalFn.close = closeObserverModal



/**
 * 弹窗 自身通过监听来管理show
 * @description
 * ObserverModal.open({children:<><>})
 */
export const ObserverModal = ObserverModalFn

interface I_ModalProps {
    show?: boolean
    onClose?: () => void
    /** 部分Modal可能不需要在键盘弹起时自动滚动 */
    adjustKeyboardHeight?: boolean

    modalContainerStyle?: StyleProp<ViewStyle>
}
export function Modal(props: PropsWithChildren<I_ModalProps>) {

    const scrollViewRef = useRef<ScrollView>(null)
    const { children, show, modalContainerStyle, adjustKeyboardHeight = true } = props;
    const opacity = useSharedValue(0);
    const viewPaddingBottom = useSharedValue(0)
    const [showModal, setShowModal] = useState(false);
    const scrollHeight = useSharedValue(0)
    const animatedStyles = useAnimatedStyle(() => ({
        opacity: opacity.value,
        height: scrollHeight.value,
    }));




    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            viewPaddingBottom.value = e.endCoordinates.height
            if (adjustKeyboardHeight) {
                scrollViewRef.current?.scrollToEnd()
            }
        });

        const keyboardDidChangeFrame = Keyboard.addListener("keyboardWillHide", (e) => {
            viewPaddingBottom.value = 0;
        })
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            viewPaddingBottom.value = 0
        });

        return () => {
            keyboardDidChangeFrame.remove();
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const onModalOpened = () => {
        setShowModal(true)
        requestAnimationFrame(() => {
            opacity.value = withSpring(1)
        })
    }

    const closeCallback = (
        finished?: boolean,
        current?: AnimatableValue
    ) => {
        if (!finished) return;
        setShowModal(false)
    }
    const onModalClosed = () => {
        opacity.value = withSpring(0, {
            mass: 1
        }, (finished, current) => {
            runOnJS(closeCallback)(finished, current)
        })
    }

    const positionViewStyle = useAnimatedStyle(() => {
        return {
            height: viewPaddingBottom.value
        }
    })



    useEffect(() => {
        if (show) {
            onModalOpened()
        }

        if (!show) {
            onModalClosed()
        }
        return () => {
            requestAnimationFrame(() => {
                Keyboard.dismiss()
            })
        }
    }, [show])

    return (
        <>
            {
                (!!showModal) && (
                    <Portal>
                        <ScrollView
                            keyboardShouldPersistTaps="never"
                            onLayout={(e) => {
                                scrollHeight.value = e.nativeEvent.layout.height
                            }}
                            style={{ flex: 1, }}
                            showsVerticalScrollIndicator={false}

                            bounces={false}
                            ref={scrollViewRef}
                        >
                            <Animated.View style={[animatedStyles, styles.modalContainer, modalContainerStyle,]}>
                                {
                                    show && children
                                }
                            </Animated.View>
                            <Animated.View style={positionViewStyle} />
                        </ScrollView>
                    </Portal>
                )
            }
        </>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
    }
})






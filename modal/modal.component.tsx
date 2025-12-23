import { createContext, FC, PropsWithChildren, useEffect, useState } from "react";
import { Host, Portal } from "react-native-portalize";
import React from 'react'
import { ViewStyle, StyleProp, Keyboard, DeviceEventEmitter, StyleSheet } from "react-native";
import Animated, { AnimatableValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets'
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
    const opacity = useSharedValue(0);
    const open: I_ObserverModal["open"] = function (options) {
        const { children, moreModalContainerStyle } = options
        setMoreModalContainerStyle(moreModalContainerStyle)
        setChildrenNode(children)
        setShow(true)
        opacity.value = withSpring(1)
    }

    const closeCallback = (
        finished?: boolean,
    ) => {
        if (!finished) return;
        setShow(false)
    }
    const close: I_ObserverModal["close"] = function () {
        opacity.value = withSpring(0, {}, (finished) => {
            runOnJS(closeCallback)(finished)
        })
    }

    const addListener = function () {
        const openSub = DeviceEventEmitter.addListener(buildOpenName(id), open)
        const closeSub = DeviceEventEmitter.addListener(buildCloseName(id), close)

        return () => {
            openSub.remove()
            closeSub.remove()
        }
    }

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value
        }
    })

    useEffect(addListener, [])
    return (
        <>
            {
                !!show && (
                    <Portal>
                        <Animated.View style={[styles.modalContainer, animatedStyle, modalContainerStyle, moreModalContainerStyle,]}>
                            {childrenNode}
                        </Animated.View>
                    </Portal>
                )
            }
        </>
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
    modalContainerStyle?: StyleProp<ViewStyle>
}
export function Modal(props: PropsWithChildren<I_ModalProps>) {

    const { children, show, modalContainerStyle } = props;
    const opacity = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    const [showModal, setShowModal] = useState(false);
    const onModalOpened = () => {
        setShowModal(true)
        opacity.value = withSpring(1)
    }

    const closeCallback = (
        finished?: boolean,
        current?: AnimatableValue
    ) => {
        if (!finished) return;
        setShowModal(false)
    }
    const onModalClosed = () => {
        opacity.value = withSpring(1, {}, (finished, current) => {
            runOnJS(closeCallback)(finished, current)
        })
    }

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
                !!showModal && (
                    <Portal>
                        <Animated.View style={[styles.modalContainer, modalContainerStyle, animatedStyles]}>
                            {children}
                        </Animated.View>
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






import { FC, memo, PropsWithChildren, useEffect, useRef, useState } from "react";
import { Portal } from "react-native-portalize";
import React from 'react'
import {
    ViewStyle, StyleProp, Keyboard, DeviceEventEmitter,
    StyleSheet, ScrollView,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets'

const OPEN_OBSERVER_MODAL = "__OPEN_OBSERVER_MODAL__"
const CLOSE_OBSERVER_MODAL = "__CLOSE_OBSERVER_MODAL__"

const buildOpenName = (id?: string) => `${OPEN_OBSERVER_MODAL}__${id}`;
const buildCloseName = (id?: string) => `${CLOSE_OBSERVER_MODAL}__${id}`;

interface ObserverModalProps {
    id?: string;
    modalContainerStyle?: StyleProp<ViewStyle>;
    onModalShow?: (modalName?: string) => void;
    onModalClose?: (modalName?: string) => void;
}


interface OpenObserverModalOptions {
    children: React.ReactNode;
    moreModalContainerStyle?: StyleProp<ViewStyle>;

}

interface ObserverModalComponent extends FC<ObserverModalProps> {
    /**
     * 打开observer弹窗
     * @param options 
     */
    open: (options: OpenObserverModalOptions, id?: string) => void
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
const ObserverModalFn: ObserverModalComponent = function (props) {
    const { modalContainerStyle, onModalClose, id } = props;
    const [show, setShow] = useState(false);
    const [moreModalContainerStyle, setMoreModalContainerStyle] = useState<StyleProp<ViewStyle> | undefined>(undefined);
    const [childrenNode, setChildrenNode] = useState<React.ReactNode | undefined>(undefined);

    const open = function (options: OpenObserverModalOptions) {
        const { children, moreModalContainerStyle } = options;
        setMoreModalContainerStyle(moreModalContainerStyle);
        setChildrenNode(children);
        setShow(true);
    };

    const close = function () {
        setShow(false);
    };

    useEffect(() => {
        const openSub = DeviceEventEmitter.addListener(buildOpenName(id), open);
        const closeSub = DeviceEventEmitter.addListener(buildCloseName(id), close);

        return () => {
            openSub.remove();
            closeSub.remove();
        };
    }, [id]);

    return (
        <Modal show={show} modalContainerStyle={[styles.modalContainer, modalContainerStyle, moreModalContainerStyle]}>
            {childrenNode}
        </Modal>
    );

}

/**
 * 
 * @param options 
 * @param modalGroupName 来源于是否有被ListenerGroup包裹   有则是 ListenerGroup的props.groupName
 */
const openObserverModal: (options: OpenObserverModalOptions, id?: string) => void = function (options, id) {
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





interface ModalProps {
    show?: boolean;
    onClose?: () => void;
    /** 部分Modal可能不需要在键盘弹起时自动滚动 */
    adjustKeyboardHeight?: boolean;

    modalContainerStyle?: StyleProp<ViewStyle>;
}
export const Modal = memo(
    function Modal(props: PropsWithChildren<ModalProps>) {

        const scrollViewRef = useRef<ScrollView>(null)
        const { children, show, modalContainerStyle, adjustKeyboardHeight = true } = props;
        const opacity = useSharedValue(0);
        const viewPaddingBottom = useSharedValue(0);
        const [showModal, setShowModal] = useState(false);
        const scrollHeight = useSharedValue(0);
        const animatedStyles = useAnimatedStyle(() => ({
            opacity: opacity.get(),
            height: scrollHeight.get(),
        }));




        useEffect(() => {
            const onShow = (e: any) => {
                viewPaddingBottom.set(e.endCoordinates?.height || 0)
                if (adjustKeyboardHeight) scrollViewRef.current?.scrollToEnd();
            };
            const onWillHide = () => {
                viewPaddingBottom.set(0)
            };
            const showSub = Keyboard.addListener('keyboardDidShow', onShow);
            const willHideSub = Keyboard.addListener('keyboardWillHide', onWillHide);
            const hideSub = Keyboard.addListener('keyboardDidHide', onWillHide);

            return () => {
                showSub.remove();
                willHideSub.remove();
                hideSub.remove();
            };
        }, [adjustKeyboardHeight]);

        const onModalOpened = () => {
            setShowModal(true);
            requestAnimationFrame(() => {
                opacity.set(withSpring(1))
            });
        };

        const closeCallback = (finished?: boolean) => {
            if (!finished) return;
            setShowModal(false);
        };

        const onModalClosed = () => {
            opacity.set(
                withSpring(0, { mass: 1 }, (finished) => {
                    runOnJS(closeCallback)(finished);
                })
            )
        };

        const positionViewStyle = useAnimatedStyle(() => {
            return {
                height: viewPaddingBottom.get()
            }
        })



        useEffect(() => {
            if (show) onModalOpened();
            else onModalClosed();

            return () => {
                requestAnimationFrame(() => {
                    Keyboard.dismiss();
                });
            };
        }, [show]);

        return (
            <>
                {
                    (!!showModal) && (
                        <Portal>
                            <ScrollView
                                keyboardShouldPersistTaps="never"
                                onLayout={(e) => {
                                    scrollHeight.set(e.nativeEvent.layout.height)
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
)

/**
 * 弹窗 自身通过监听来管理show
 * @description
 * ObserverModal.open({children:<><>})
 */
export const ObserverModal = ObserverModalFn

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
    }
})






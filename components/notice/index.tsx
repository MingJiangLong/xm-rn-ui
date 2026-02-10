import { FC, useEffect, useState, cloneElement, ReactElement, useRef, useMemo } from "react";
import { DeviceEventEmitter, StyleProp, ViewStyle, } from "react-native";
import React from 'react'
import { Modal } from "../modal";

const OPEN_NOTICE = "OPEN_NOTICE"
const CLOSE_NOTICE = "CLOSE_NOTICE"
const buildOpenName = (id?: string) => `${OPEN_NOTICE}__${id}`
const buildCloseName = (id?: string) => `${CLOSE_NOTICE}__${id}`
type I_OpenOptions = {
    message?: React.ReactNode
    duration?: number
    /** 弹窗样式 */
    moreModalContainerStyle?: StyleProp<ViewStyle>

    /** 消息外壳样式 */
    moreContainerStyle?: StyleProp<ViewStyle>


}
interface I_Notice extends FC<
    {
        modalContainerStyle?: StyleProp<ViewStyle>
        children: (message: React.ReactNode) => ReactElement<any>
        duration?: number
        id?: string
        showLog?: boolean
    }
> {
    open: (options: I_OpenOptions, id?: string) => void
    close: (id?: string) => void
}

const Notice: I_Notice = (props) => {

    const { modalContainerStyle, children, duration = 1500, id, showLog } = props
    const [show, setShow] = useState(false)
    const [moreModalContainerStyle, setMoreModalContainerStyle] = useState<StyleProp<ViewStyle>>([])
    const [moreContainerStyle, setMoreContainerStyle] = useState<StyleProp<ViewStyle>>([])
    const [message, setMessage] = useState<React.ReactNode>(undefined)

    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const openNotice: I_Notice["open"] = (options) => {
        clearCloseTimeout();
        setNoticeRenderInfo(options)
        openNoticeModal()
        startCloseTimer(options.duration ?? duration)
    }


    /** 打开弹窗 */
    function openNoticeModal() {
        setShow(true)
    }

    /** 设置渲染信息 */
    function setNoticeRenderInfo(options: I_OpenOptions) {
        const { message, moreModalContainerStyle = [], moreContainerStyle = [], } = options;
        setMessage(message)
        setMoreModalContainerStyle(moreModalContainerStyle)
        setMoreContainerStyle(moreContainerStyle)
    }

    function closeNotice() {
        clearCloseTimeout()
        startCloseTimer(500)
    }

    /** 清除关闭定时器 */
    const clearCloseTimeout = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null;
        }
    }

    /** 设置关闭定时器 */
    function startCloseTimer(duration: number) {
        clearCloseTimeout()
        closeTimer.current = setTimeout(() => {
            setShow(false)
            closeTimer.current = null
        }, duration)
    }

    function addListener() {
        showLog && console.log("[Notice]:已加载");
        const openSub = DeviceEventEmitter.addListener(buildOpenName(id), openNotice)
        const closeSub = DeviceEventEmitter.addListener(buildCloseName(id), closeNotice)
        return () => {
            showLog && console.log("[Notice]:已移除");
            openSub.remove()
            closeSub.remove()
        }
    }
    useEffect(addListener, [])


    const childrenNode = useMemo(() => {
        const childrenNodeTemp = children(message);
        return cloneElement(childrenNodeTemp, { ...childrenNodeTemp.props, style: [childrenNodeTemp.props.style, moreContainerStyle] })

    }, [message])
    return (
        <Modal show={show} modalContainerStyle={[modalContainerStyle, moreModalContainerStyle]} adjustKeyboardHeight={false}>
            {childrenNode}
        </Modal>
    )
}


const open: I_Notice["open"] = (options, id) => {
    DeviceEventEmitter.emit(buildOpenName(id), options)
}


const close: I_Notice["close"] = (id) => {
    DeviceEventEmitter.emit(buildCloseName(id),)
}


Notice.open = open
Notice.close = close

export default Notice

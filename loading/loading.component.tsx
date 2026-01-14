import { FC, useEffect, useState, PropsWithChildren, useRef } from "react";
import { Modal } from "../modal/modal.component";
import { DeviceEventEmitter, StyleProp, ViewStyle, } from "react-native";
interface I_Loading extends FC<PropsWithChildren<
    {
        id?: string
        modalContainerStyle?: StyleProp<ViewStyle>
        minDuration?: number
        showLog?: boolean
    }
>> {
    open: (id?: string) => void
    close: (id?: string) => void
    add: <T extends (...args: any[]) => Promise<any>>(fn: T, id?: string) => (...args: Parameters<T>) => Promise<ReturnType<T>>
}
const OPEN_LOADING = "OPEN_LOADING"
const CLOSE_LOADING = "CLOSE_LOADING"
const buildOpenName = (id?: string) => `${OPEN_LOADING}__${id ?? ""}`
const buildCloseName = (id?: string) => `${CLOSE_LOADING}__${id ?? ""}`
const Loading: I_Loading = (props) => {

    const { modalContainerStyle, children, minDuration = 100, id, showLog } = props
    const [loadingCount, setLoadingCount] = useState(0);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)

    const [loading, setLoading] = useState(false)
    function openLoading() {
        setLoadingCount(pre => pre + 1)
    }

    function closeLoading() {
        setLoadingCount(pre => Math.max(0, pre - 1))
    }

    const clearCloseTimer = () => {
        if (!closeTimer.current) return;
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null;
        }
    }

    const onLoadingCountChange = () => {

        if (loadingCount == 0) {

            startCloseTimer()
        }

        if (loadingCount > 0) {
            clearCloseTimer()
            setLoading(true)
        }
    }

    const startCloseTimer = () => {
        clearCloseTimer()
        closeTimer.current = setTimeout(() => {
            setLoading(false)
            closeTimer.current = null
        }, minDuration)
    }



    function addListener() {
        showLog && console.log(`[xm-rn-ui]:组件Loading已加载`);
        const openSub = DeviceEventEmitter.addListener(buildOpenName(id), openLoading)
        const closeSub = DeviceEventEmitter.addListener(buildCloseName(id), closeLoading)
        return () => {
            showLog && console.log("[xm-rn-ui]:组件Loading已卸载");
            openSub.remove()
            closeSub.remove()
        }
    }

    useEffect(addListener, [])
    useEffect(onLoadingCountChange, [loadingCount])
    return (
        <Modal show={loading} modalContainerStyle={modalContainerStyle} ignoreKeyboardHeight>
            {children}
        </Modal>
    )
}


const open = (id?: string) => {
    DeviceEventEmitter.emit(buildOpenName(id))
}


const close = (id?: string) => {
    DeviceEventEmitter.emit(buildCloseName(id))
}
export function addLoading<T extends (...args: any[]) => Promise<any>>(fn: T, id?: string) {
    return async (...args: Parameters<T>) => {
        try {
            open(id)
            return await fn(...args)
        } finally {
            close(id)
        }
    }
}

Loading.open = open
Loading.close = close
Loading.add = addLoading
export default Loading
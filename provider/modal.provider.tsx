import { memo, PropsWithChildren } from "react";
import { Host } from "react-native-portalize";

interface ModalProviderProps { }

export const ModalProvider = memo(
    function ModalProvider(props: PropsWithChildren<ModalProviderProps>) {
        const { children } = props;
        return (
            <Host>
                {children}
            </Host>
        )
    }
)
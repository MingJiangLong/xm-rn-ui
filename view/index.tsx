import { View as RNView } from 'react-native'

export function View(
    props: Pick<React.ComponentProps<typeof RNView>, 'style' | 'children'>
) {
    return <RNView {...props} />
}

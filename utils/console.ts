import { SDK_NAME } from "../constant";

// const newConsoleLog = console.log.bind(console);
// console.log = (...args: Parameters<typeof console.log>) => {
//     const prefix = `[${SDK_NAME}]`;
//     newConsoleLog.call(prefix, ...args)
// }

// const newConsoleError = console.error.bind(console);
// console.error = (...args: Parameters<typeof console.error>) => {
//     const prefix = `[${SDK_NAME}]`;
//     newConsoleError.call(prefix, ...args)
// }

// const newConsoleWarn = console.warn.bind(console);
// console.warn = (...args: Parameters<typeof console.warn>) => {
//     const prefix = `[${SDK_NAME}]`;
//     newConsoleWarn.call(prefix, ...args)
// }

// 不能修改公共方法



export const log = (...args: Parameters<typeof console.log>) => {
    const prefix = `[${SDK_NAME}]`;
    console.log(prefix, ...args);
}

export const warn = (...args: Parameters<typeof console.warn>) => {
    const prefix = `[${SDK_NAME}]`;
    console.warn(prefix, ...args);
}

export const error = (...args: Parameters<typeof console.error>) => {
    const prefix = `[${SDK_NAME}]`;
    console.error(prefix, ...args);
}
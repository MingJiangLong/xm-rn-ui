import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type I_Validate<T> = ((value: T) => boolean) | ((value: T) => Promise<boolean>)
type I_Rule<T = any> = { validate: I_Validate<T>, message?: string }

type I_Form = {
    formFieldsValue: Record<string, any>
    formFieldsError: Record<string, FormFieldError | undefined>
    /** 更新表单错误 */
    onUpdateFormFieldError: (name: string, error?: FormFieldError) => void

    /** 更新表单校验时规则 */
    onUpdateFormFieldRules: (name: string, rules: I_Rule[]) => void

    /** 更新表单值 */
    onUpdateFormField: (name: string, value: any, ignoredRules?: boolean) => void

    /** 删除表单值 */
    onDeleteFormField: (name: string) => void

    validate: (names?: string[]) => Promise<Record<string, any>>
}
const FormContext = createContext<I_Form | null>(null);
class FormFieldError extends Error {
    constructor(message?: string) {
        super(message);
    }
}


function useForm() {

    const [refresh, setRefresh] = useState(0);

    const formFieldsValueRef = useRef<Record<string, any>>({})
    const formFieldsErrorRef = useRef<Record<string, FormFieldError | undefined>>({})
    const formFieldsRulesRef = useRef<Record<string, I_Rule[]>>({})

    const onRefresh = useCallback(() => {
        setRefresh(pre => (pre + 1) % 200)
    }, [])

    const onUpdateFormField = useCallback((name: string, value: any) => {
        const formFieldsValue = formFieldsValueRef.current
        formFieldsValueRef.current = {
            ...formFieldsValue, [name]: value
        }
        onUpdateFormFieldError(name)
        onRefresh()
    }, [])

    const onDeleteFormField = useCallback((name: string) => {
        Reflect.deleteProperty(formFieldsValueRef.current, name)
        Reflect.deleteProperty(formFieldsErrorRef.current, name)
        Reflect.deleteProperty(formFieldsRulesRef.current, name)
        onRefresh()
    }, [])

    /** 更新表单错误 */
    const onUpdateFormFieldError = useCallback(
        (name: string, error?: FormFieldError) => {
            const formFieldsError = formFieldsErrorRef.current
            formFieldsErrorRef.current = {
                ...formFieldsError,
                [name]: error
            }
            onRefresh()
        }, [])

    /** 更新表单校验时规则 */
    const onUpdateFormFieldRules = useCallback((name: string, rules: I_Rule[]) => {

        const formFieldsRules = formFieldsRulesRef.current
        formFieldsRulesRef.current = {
            ...formFieldsRules,
            [name]: rules
        }
        onUpdateFormFieldError(name, new FormFieldError())
    }, [])

    const validate = useCallback(
        async (names: string[] = []) => {
            let formFields: Record<string, any> = {}
            const formFieldsValue = formFieldsValueRef.current;
            const formFieldsRules = formFieldsRulesRef.current;
            const formFieldsError = formFieldsErrorRef.current;

            let lastNames = names ?? Object.keys(formFieldsValue);
            for (let name of lastNames) {
                const formFieldValue = formFieldsValue[name];
                const formFieldRules = formFieldsRules[name];

                if (!formFieldRules?.length) continue;

                for (let rules of formFieldRules) {
                    const isTrue = await rules.validate(formFieldValue);
                    if (!isTrue) {
                        const error = new FormFieldError(rules.message);
                        formFieldsErrorRef.current = {
                            ...formFieldsError,
                            [name]: new FormFieldError(rules.message)
                        }

                        onRefresh();
                        throw error;
                    }

                    formFields = {
                        ...formFields,
                        [name]: formFieldValue
                    }
                }
            }
            return formFields
        }, []
    )

    return useMemo(() => (
        {
            formFieldsValue: formFieldsValueRef.current,
            formFieldsError: formFieldsErrorRef.current,
            onUpdateFormField,
            onUpdateFormFieldRules,
            onUpdateFormFieldError,
            onDeleteFormField,
            validate,
        }
    ), [refresh])

}

export function Form(props: PropsWithChildren<{
    form: I_Form
}>) {
    const { children } = props;
    const form = useForm();

    return (
        <FormContext.Provider value={form}>
            {children}
        </FormContext.Provider>
    )
}

type I_FormItem = {
    error?: FormFieldError
    onValueChange?: (value: any) => void
    value?: any
}

const FormItemContext = createContext<I_FormItem | null>(null);
export function FormItem(props: PropsWithChildren<{
    name: string
    initialValue?: any

    rulesWhenChange?: I_Rule[]
    rulesWhenValidate?: I_Rule[]

    destroyWhenUnmount?: boolean
}>) {

    const form = useContext(FormContext);
    if (!form) {
        throw new Error("FormItem must be used within a Form component.")
    }
    const { name, initialValue, destroyWhenUnmount, rulesWhenValidate, children } = props;



    useEffect(() => {
        form.onUpdateFormFieldRules(name, rulesWhenValidate ?? []);
        form.onUpdateFormField(name, initialValue);

        return () => {
            if (!destroyWhenUnmount) return;
            form.onDeleteFormField(name);
        }
    }, [])


    const formItem = useMemo(() => {

        return {
            value: form.formFieldsValue[name],
            onValueChange: (value: any) => form.onUpdateFormField(name, value),
            error: form.formFieldsError[name],
        }
    }, [form])

    return (
        <FormItemContext.Provider value={formItem}>
            {children}
        </FormItemContext.Provider>
    )
}


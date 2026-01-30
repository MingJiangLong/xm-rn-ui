import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

/**
 * Advanced Form System for React Native
 *
 * Features:
 * - Type-safe form state management
 * - Declarative validation with async support
 * - Field-level validation and error handling
 * - Performance optimized with minimal re-renders
 * - Built-in common validation rules
 * - Form submission helpers
 * - Touch state tracking
 * - Validation state tracking
 *
 * Basic Usage:
 *
 * ```tsx
 * function LoginForm() {
 *   const form = useCreateForm({
 *     email: '',
 *     password: '',
 *   });
 *
 *   const handleSubmit = async () => {
 *     const result = await submitForm(form, async (values) => {
 *       // Submit to API
 *       return await api.login(values);
 *     });
 *
 *     if (result) {
 *       // Success
 *     }
 *   };
 *
 *   return (
 *     <Form form={form}>
 *       <FormItem
 *         name="email"
 *         rules={[required(), email()]}
 *       >
 *         <EmailInput />
 *       </FormItem>
 *
 *       <FormItem
 *         name="password"
 *         rules={[required(), minLength(6)]}
 *       >
 *         <PasswordInput />
 *       </FormItem>
 *
 *       <Button onPress={handleSubmit} disabled={!form.isValid()}>
 *         Login
 *       </Button>
 *     </Form>
 *   );
 * }
 * ```
 *
 * Custom Input Component:
 *
 * ```tsx
 * function CustomInput() {
 *   const { value, error, onChange, onBlur, touched } = useFormItem();
 *
 *   return (
 *     <View>
 *       <TextInput
 *         value={value}
 *         onChangeText={onChange}
 *         onBlur={onBlur}
 *       />
 *       {touched && error && <Text style={{color: 'red'}}>{error.message}</Text>}
 *     </View>
 *   );
 * }
 * ```
 */

// Types
type ValidationFunction<T = any> = (value: T) => boolean | Promise<boolean>;

interface ValidationRule<T = any> {
    passWhen: ValidationFunction<T>;
    errorMessage?: string;
}

type FormUpdateAction<T = any> = Record<string, T> | ((current: Record<string, T>) => Record<string, T>);

interface FormFieldError extends Error {
    field: string;
    value: any;
}

interface FormState {
    values: Record<string, any>;
    errors: Record<string, FormFieldError | undefined>;
    rules: Record<string, ValidationRule[]>;
    isValidating: Record<string, boolean>;
    touched: Record<string, boolean>;
}

interface FormActions {
    setValue: (name: string, value: any) => void;
    setValues: (updates: FormUpdateAction) => void;
    setError: (name: string, error: FormFieldError | undefined) => void;
    setErrors: (updates: FormUpdateAction<FormFieldError | undefined>) => void;
    setRules: (name: string, rules: ValidationRule[]) => void;
    setTouched: (name: string, touched: boolean) => void;
    validate: (names?: string[]) => Promise<Record<string, any>>;
    validateField: (name: string) => Promise<any>;
    reset: (fields?: string[]) => void;
    resetErrors: (fields?: string[]) => void;
    isValid: () => boolean;
    getValues: () => Record<string, any>;
    getErrors: () => Record<string, FormFieldError | undefined>;
}

export function useCreateForm(initialValues: Record<string, any> = {}): FormState & FormActions {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const formStateRef = useRef<FormState>({
        values: { ...initialValues },
        errors: {},
        rules: {},
        isValidating: {},
        touched: {},
    });

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => (prev + 1) % 1000);
    }, []);

    // Actions
    const setValue = useCallback((name: string, value: any) => {
        formStateRef.current.values = {
            ...formStateRef.current.values,
            [name]: value,
        };
        triggerRefresh();
    }, [triggerRefresh]);

    const setValues = useCallback((updates: FormUpdateAction) => {
        const currentValues = formStateRef.current.values;
        const newValues = typeof updates === 'function' ? updates(currentValues) : updates;

        formStateRef.current.values = {
            ...currentValues,
            ...newValues,
        };

        // Clear errors for updated fields
        const updatedFields = Object.keys(newValues);
        updatedFields.forEach(field => {
            if (formStateRef.current.errors[field]) {
                formStateRef.current.errors = {
                    ...formStateRef.current.errors,
                    [field]: undefined,
                };
            }
        });

        triggerRefresh();
    }, [triggerRefresh]);

    const setError = useCallback((name: string, error: FormFieldError | undefined) => {
        formStateRef.current.errors = {
            ...formStateRef.current.errors,
            [name]: error,
        };
        triggerRefresh();
    }, [triggerRefresh]);

    const setErrors = useCallback((updates: FormUpdateAction<FormFieldError | undefined>) => {
        const currentErrors = formStateRef.current.errors;
        const newErrors = typeof updates === 'function' ? updates(currentErrors) : updates;

        formStateRef.current.errors = {
            ...currentErrors,
            ...newErrors,
        };
        triggerRefresh();
    }, [triggerRefresh]);

    const setRules = useCallback((name: string, rules: ValidationRule[]) => {
        formStateRef.current.rules = {
            ...formStateRef.current.rules,
            [name]: rules,
        };
        triggerRefresh();
    }, [triggerRefresh]);

    const setTouched = useCallback((name: string, touched: boolean) => {
        formStateRef.current.touched = {
            ...formStateRef.current.touched,
            [name]: touched,
        };
        triggerRefresh();
    }, [triggerRefresh]);

    const validateField = useCallback(async (name: string): Promise<any> => {
        const value = formStateRef.current.values[name];
        const rules = formStateRef.current.rules[name] || [];

        formStateRef.current.isValidating = {
            ...formStateRef.current.isValidating,
            [name]: true,
        };
        triggerRefresh();

        try {
            for (const rule of rules) {
                const isValid = await rule.passWhen(value);
                if (!isValid) {
                    const error = Object.assign(new Error(rule.errorMessage || 'Validation failed'), {
                        field: name,
                        value,
                    }) as FormFieldError;

                    formStateRef.current.errors = {
                        ...formStateRef.current.errors,
                        [name]: error,
                    };
                    return Promise.reject(error);
                }
            }

            // Clear error if validation passes
            formStateRef.current.errors = {
                ...formStateRef.current.errors,
                [name]: undefined,
            };

            formStateRef.current.isValidating = {
                ...formStateRef.current.isValidating,
                [name]: false,
            };
            triggerRefresh();

            return value;
        } catch (error) {
            formStateRef.current.isValidating = {
                ...formStateRef.current.isValidating,
                [name]: false,
            };
            triggerRefresh();
            throw error;
        }
    }, [triggerRefresh]);

    const validate = useCallback(async (names?: string[]): Promise<Record<string, any>> => {
        const fieldsToValidate = names || Object.keys(formStateRef.current.values);
        const validatedValues: Record<string, any> = {};

        for (const name of fieldsToValidate) {
            try {
                const value = await validateField(name);
                validatedValues[name] = value;
            } catch (error) {
                // Validation failed, but continue with other fields
                // The error is already set in validateField
            }
        }

        return validatedValues;
    }, [validateField]);

    const reset = useCallback((fields?: string[]) => {
        const fieldsToReset = fields || Object.keys(formStateRef.current.values);

        formStateRef.current.values = { ...initialValues };
        formStateRef.current.errors = {};
        formStateRef.current.touched = {};
        formStateRef.current.isValidating = {};

        triggerRefresh();
    }, [initialValues, triggerRefresh]);

    const resetErrors = useCallback((fields?: string[]) => {
        const fieldsToReset = fields || Object.keys(formStateRef.current.errors);

        const newErrors = { ...formStateRef.current.errors };
        fieldsToReset.forEach(field => {
            newErrors[field] = undefined;
        });

        formStateRef.current.errors = newErrors;
        triggerRefresh();
    }, [triggerRefresh]);

    const isValid = useCallback((): boolean => {
        return Object.values(formStateRef.current.errors).every(error => !error);
    }, []);

    const getValues = useCallback(() => ({ ...formStateRef.current.values }), []);
    const getErrors = useCallback(() => ({ ...formStateRef.current.errors }), []);

    return useMemo(() => ({
        // State
        values: formStateRef.current.values,
        errors: formStateRef.current.errors,
        rules: formStateRef.current.rules,
        isValidating: formStateRef.current.isValidating,
        touched: formStateRef.current.touched,

        // Actions
        setValue,
        setValues,
        setError,
        setErrors,
        setRules,
        setTouched,
        validate,
        validateField,
        reset,
        resetErrors,
        isValid,
        getValues,
        getErrors,
    }), [
        refreshTrigger,
        setValue,
        setValues,
        setError,
        setErrors,
        setRules,
        setTouched,
        validate,
        validateField,
        reset,
        resetErrors,
        isValid,
        getValues,
        getErrors,
    ]);
}
const FormContext = createContext<ReturnType<typeof useCreateForm> | null>(null);

export function Form({ children, form }: PropsWithChildren<{ form: ReturnType<typeof useCreateForm> }>) {
    return (
        <FormContext.Provider value={form}>
            {children}
        </FormContext.Provider>
    );
}

interface FormItemProps {
    name: string;
    initialValue?: any;
    rules?: ValidationRule[];
    children: React.ReactNode;
    onChange?: (value: any) => void;
    onBlur?: () => void;
    onFocus?: () => void;
}

interface FormItemContextValue {
    value: any;
    error: FormFieldError | undefined;
    isValidating: boolean;
    touched: boolean;
    onChange: (value: any) => void;
    onBlur: () => void;
    onFocus: () => void;
    validate: () => Promise<any>;
}

const FormItemContext = createContext<FormItemContextValue | null>(null);

export const FormItem = React.memo<FormItemProps>(function FormItemComponent({
    name,
    initialValue,
    rules = [],
    children,
    onChange,
    onBlur,
    onFocus,
}) {
    const form = useContext(FormContext);
    if (!form) {
        throw new Error("FormItem must be used within a Form component.");
    }

    // Initialize field on mount
    useEffect(() => {
        if (initialValue !== undefined) {
            form.setValue(name, initialValue);
        }
        form.setRules(name, rules);
    }, [name, initialValue, rules, form]);

    const handleChange = useCallback((value: any) => {
        form.setValue(name, value);
        onChange?.(value);
    }, [name, form, onChange]);

    const handleBlur = useCallback(() => {
        form.setTouched(name, true);
        onBlur?.();
    }, [name, form, onBlur]);

    const handleFocus = useCallback(() => {
        onFocus?.();
    }, [onFocus]);

    const validate = useCallback(() => {
        return form.validateField(name);
    }, [name, form]);

    const contextValue = useMemo((): FormItemContextValue => ({
        value: form.values[name],
        error: form.errors[name],
        isValidating: form.isValidating[name] || false,
        touched: form.touched[name] || false,
        onChange: handleChange,
        onBlur: handleBlur,
        onFocus: handleFocus,
        validate,
    }), [
        form.values[name],
        form.errors[name],
        form.isValidating[name],
        form.touched[name],
        handleChange,
        handleBlur,
        handleFocus,
        validate,
    ]);

    return (
        <FormItemContext.Provider value={contextValue}>
            {children}
        </FormItemContext.Provider>
    );
});

export function useFormItem(): FormItemContextValue {
    const context = useContext(FormItemContext);
    if (!context) {
        throw new Error("useFormItem must be used within a FormItem component.");
    }
    return context;
}

// Utility hooks
export function useForm(): ReturnType<typeof useCreateForm> {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error("useForm must be used within a Form component.");
    }
    return context;
}

// Utility functions
export const createValidationRule = <T = any>(
    validator: ValidationFunction<T>,
    errorMessage?: string
): ValidationRule<T> => ({
    passWhen: validator,
    errorMessage,
});

// Common validation rules
export const required = (errorMessage = "This field is required"): ValidationRule =>
    createValidationRule(
        (value: any) => value !== null && value !== undefined && value !== '',
        errorMessage
    );

export const minLength = (min: number, errorMessage?: string): ValidationRule<string> =>
    createValidationRule(
        (value: string) => !value || value.length >= min,
        errorMessage || `Minimum length is ${min}`
    );

export const maxLength = (max: number, errorMessage?: string): ValidationRule<string> =>
    createValidationRule(
        (value: string) => !value || value.length <= max,
        errorMessage || `Maximum length is ${max}`
    );

export const pattern = (regex: RegExp, errorMessage?: string): ValidationRule<string> =>
    createValidationRule(
        (value: string) => !value || regex.test(value),
        errorMessage || 'Invalid format'
    );

export const email = (errorMessage = "Invalid email address"): ValidationRule<string> =>
    pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMessage);

export const numeric = (errorMessage = "Must be a number"): ValidationRule =>
    createValidationRule(
        (value: any) => !value || (!isNaN(value) && !isNaN(parseFloat(value))),
        errorMessage
    );

// Form submission helper
export async function submitForm<T = any>(
    form: ReturnType<typeof useCreateForm>,
    onSuccess: (values: Record<string, any>) => Promise<T> | T,
    onError?: (errors: Record<string, FormFieldError>) => void
): Promise<T | null> {
    try {
        const validatedValues = await form.validate();
        const result = await onSuccess(validatedValues);
        return result;
    } catch (error) {
        if (onError) {
            const errors = Object.fromEntries(
                Object.entries(form.errors).filter(([, error]) => error !== undefined)
            ) as Record<string, FormFieldError>;
            onError(errors);
        }
        return null;
    }
}


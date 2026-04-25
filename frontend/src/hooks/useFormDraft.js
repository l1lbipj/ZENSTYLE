import { useCallback, useMemo, useRef, useState } from 'react'

function stableStringify(value) {
  return JSON.stringify(value, Object.keys(value || {}).sort())
}

function isEqual(a, b) {
  return stableStringify(a) === stableStringify(b)
}

export default function useFormDraft(initialValues, validate) {
  const initialRef = useRef(initialValues)
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})

  const runValidate = useCallback(
    (nextValues = values) => {
      if (typeof validate !== 'function') return {}
      return validate(nextValues) || {}
    },
    [validate, values],
  )

  const dirty = useMemo(() => !isEqual(values, initialRef.current), [values])
  const liveErrors = runValidate(values)
  const hasErrors = Object.keys(liveErrors).length > 0

  const setFieldValue = useCallback(
    (name, nextValue) => {
      const nextValues = { ...values, [name]: nextValue }
      setValues(nextValues)
      if (touched[name]) {
        setErrors(runValidate(nextValues))
      }
    },
    [runValidate, touched, values],
  )

  const markTouched = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      const nextErrors = runValidate()
      setErrors(nextErrors)
      return nextErrors
    },
    [runValidate],
  )

  const validateAll = useCallback(
    (nextValues = values) => {
      const nextErrors = runValidate(nextValues)
      setErrors(nextErrors)
      setTouched(
        Object.keys(nextValues || {}).reduce((acc, key) => {
          acc[key] = true
          return acc
        }, {}),
      )
      return nextErrors
    },
    [runValidate, values],
  )

  const reset = useCallback((nextValues = initialRef.current) => {
    initialRef.current = nextValues
    setValues(nextValues)
    setTouched({})
    setErrors({})
  }, [])

  const updateInitial = useCallback((nextValues) => {
    initialRef.current = nextValues
  }, [])

  const bindInput = useCallback(
    (name) => ({
      name,
      value: values[name] ?? '',
      onChange: (event) => {
        const { type, checked, value } = event.target
        setFieldValue(name, type === 'checkbox' ? checked : value)
      },
      onBlur: () => markTouched(name),
    }),
    [markTouched, setFieldValue, values],
  )

  const setAllValues = useCallback((nextValues, { resetBaseline = false } = {}) => {
    setValues(nextValues)
    if (resetBaseline) {
      initialRef.current = nextValues
    }
  }, [])

  return {
    values,
    setValues: setAllValues,
    setFieldValue,
    bindInput,
    touched,
    errors,
    dirty,
    hasErrors,
    liveErrors,
    validateAll,
    markTouched,
    reset,
    updateInitial,
  }
}

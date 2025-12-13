import { useState, useCallback } from "react";

/**
 * Custom hook for managing form state
 * @param {Object} initialValues - Initial form values
 * @returns {Object} Form state and handlers
 */
export function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    resetForm,
    setFieldValue,
  };
}

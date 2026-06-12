import { useCallback, useState } from "react";

type FieldErrorMap = Record<string, string>;

export interface UseFieldErrors {
  /** Mark a field touched (call from onBlur). */
  touch: (key: string) => void;
  /** Stamp submitted=true and store the full latest error map (call on Continue/Save). */
  setSubmitted: (map: FieldErrorMap) => void;
  /** Recompute the live error map (call from a store-slice effect) so fixed fields clear instantly. */
  revalidate: (map: FieldErrorMap) => void;
  /** Error string to SHOW for a key — only after the field is touched or the step was submitted. */
  errorFor: (key: string) => string | undefined;
  /** Convenience boolean for aria-invalid. */
  hasError: (key: string) => boolean;
  /** All currently-visible error messages (for an optional summary). */
  visibleErrors: () => string[];
}

/*
 * useFieldErrors
 * Tiny client-side helper for "reward early, punish late" per-field validation.
 * It never validates — the caller feeds it the `fieldErrors` map produced by a
 * validateSeekerStepX() function. The hook only decides WHICH errors to surface:
 * a field's error shows once it has been touched (blurred) or the step submitted,
 * and clears the moment it drops out of the latest map.
 */
export function useFieldErrors(): UseFieldErrors {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrorMap>({});

  const touch = useCallback((key: string) => {
    setTouched((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const submit = useCallback((map: FieldErrorMap) => {
    setErrors(map);
    setSubmitted(true);
  }, []);

  const revalidate = useCallback((map: FieldErrorMap) => {
    setErrors(map);
  }, []);

  const isVisible = useCallback(
    (key: string) => submitted || touched.has(key),
    [submitted, touched],
  );

  const errorFor = useCallback(
    (key: string) => (isVisible(key) ? errors[key] : undefined),
    [isVisible, errors],
  );

  const hasError = useCallback(
    (key: string) => Boolean(errorFor(key)),
    [errorFor],
  );

  const visibleErrors = useCallback(
    () =>
      Object.entries(errors)
        .filter(([key]) => isVisible(key))
        .map(([, message]) => message),
    [errors, isVisible],
  );

  return {
    touch,
    setSubmitted: submit,
    revalidate,
    errorFor,
    hasError,
    visibleErrors,
  };
}

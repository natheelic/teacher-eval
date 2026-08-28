"use client";

import { useEffect, useRef } from "react";
import { useToast } from "./ToastProvider";

/**
 * The shape every Server Action in this app returns. Declared structurally
 * rather than importing one concrete state type, because `ActionState`,
 * `SettingsActionState`, `CreateTokenState` and friends all carry extra
 * fields of their own.
 */
export type ToastableState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string | undefined>;
};

/**
 * Announces a Server Action result as a toast — the app's single feedback
 * channel for mutations. Successes toast in the success tone, failures
 * (`error`, or any `fieldErrors`) in the danger tone.
 *
 * `success` may be a function so the message can quote the result
 * ("Test email sent to ..."); returning null from it skips the toast, for
 * actions whose success is already its own dedicated UI (the one-time token
 * reveal).
 */
export function useActionToast<S extends ToastableState>(
  state: S,
  success?: string | ((state: S) => string | null),
): void {
  const { toast } = useToast();
  // The last result already announced, compared by *identity*: a Server
  // Action returns a fresh object on every dispatch, so submitting a form
  // that fails the same way twice announces twice, while a re-render from
  // anything else (a parent revalidating, a sibling's state) announces
  // nothing. Starting at `state` also suppresses a toast on first mount,
  // where the initial state is not a result anyone asked for.
  const announced = useRef<ToastableState>(state);

  useEffect(() => {
    if (state === announced.current) return;
    announced.current = state;

    const failure = state.error ?? joinFieldErrors(state.fieldErrors);
    if (failure) {
      toast(failure, "danger");
      return;
    }

    if (!state.ok || success === undefined) return;
    const message = typeof success === "function" ? success(state) : success;
    if (message) toast(message);
  }, [state, success, toast]);
}

/**
 * One toast per submission rather than one per field: three stacked toasts
 * for three empty inputs is noise, and ToastProvider's MAX_VISIBLE would drop
 * some of them anyway.
 */
function joinFieldErrors(fieldErrors: ToastableState["fieldErrors"]): string | null {
  if (!fieldErrors) return null;
  const messages = Object.values(fieldErrors).filter(
    (message): message is string => Boolean(message),
  );
  return messages.length > 0 ? messages.join(" · ") : null;
}

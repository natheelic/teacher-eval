"use client";

import { useState } from "react";

export type SwitchProps = {
  /** Controlled value. When omitted the switch manages its own state. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Enables use inside a plain <form action={...}>. */
  name?: string;
  "aria-label"?: string;
};

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  name,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);

  // Controlled when `checked` is supplied, uncontrolled otherwise, so the
  // existing `<Switch defaultChecked />` call sites keep working unchanged.
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internal;

  function toggle() {
    if (disabled) return;
    const next = !value;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value ? "on" : "off"} />}
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
        className={`flex h-5 w-[34px] items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          value ? "border-border bg-success" : "border-border bg-hover"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-surface shadow-md transition-transform ${
            value ? "translate-x-[17px] bg-surface" : "translate-x-0.5 bg-foreground-muted"
          }`}
        />
      </button>
    </>
  );
}

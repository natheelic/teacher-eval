"use client";

import { useState } from "react";

export function Switch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => setChecked((c) => !c)}
      className={`flex h-5 w-[34px] items-center rounded-full border transition-colors ${
        checked
          ? "border-black/8 bg-[#3fcf8e]"
          : "border-black/8 bg-black/4"
      }`}
    >
      <span
        className={`size-4 rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-[17px] bg-white" : "translate-x-0.5 bg-[#696969]"
        }`}
      />
    </button>
  );
}

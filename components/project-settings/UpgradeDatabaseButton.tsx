"use client";

import { useTransition } from "react";
import { upgradeDatabase } from "@/lib/actions/projects";

export function UpgradeDatabaseButton({
  projectId,
  disabled,
}: {
  projectId: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || disabled}
      title={disabled ? "Only owners and admins can upgrade." : undefined}
      onClick={() =>
        startTransition(async () => {
          await upgradeDatabase(projectId);
        })
      }
      className="mt-2 flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Upgrading..." : "Upgrade project"}
    </button>
  );
}

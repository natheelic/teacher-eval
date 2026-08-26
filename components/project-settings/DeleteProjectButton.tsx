"use client";

import { useState, useTransition } from "react";
import { deleteProject } from "@/lib/actions/projects";

/**
 * Deletion is irreversible from the dashboard, so it asks the user to type the
 * project name rather than relying on a single click.
 */
export function DeleteProjectButton({
  projectId,
  projectName,
  canDelete,
}: {
  projectId: string;
  projectName: string;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        disabled={!canDelete}
        title={canDelete ? undefined : "Only owners can delete a project."}
        onClick={() => setOpen(true)}
        className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/30 bg-[#fff0ee] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete project
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor="confirm-delete"
        className="text-[13px] font-medium text-[#030303]"
      >
        Type <span className="font-mono">{projectName}</span> to confirm.
      </label>
      <input
        id="confirm-delete"
        value={confirmText}
        autoFocus
        onChange={(e) => setConfirmText(e.target.value)}
        className="h-[34px] w-full max-w-[320px] rounded-md border border-black/15 bg-white px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-[#ab413e]/50"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending || confirmText !== projectName}
          onClick={() =>
            startTransition(async () => {
              await deleteProject(projectId);
            })
          }
          className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/40 bg-[#ab413e]/10 px-2.5 py-1 text-xs font-medium text-[#ab413e] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
          }}
          className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

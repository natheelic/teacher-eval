"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  changeUserRole,
  deleteUser,
  resendInvitation,
  setUserSuspended,
} from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

export type UserRowActionsProps = {
  user: {
    id: string;
    label: string;
    role: Role;
    status: UserStatus;
    suspended: boolean;
  };
  assignableRoles: Role[];
  canDelete: boolean;
};

export function UserRowActions({
  user,
  assignableRoles,
  canDelete,
}: UserRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmingDelete(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /**
   * Server-side guards (last-admin, permission) throw, so surface the message
   * instead of silently doing nothing.
   */
  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
        setOpen(false);
        setConfirmingDelete(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const itemClass =
    "flex w-full items-center px-3 py-2 text-left text-[13px] font-medium text-foreground hover:bg-hover disabled:opacity-50";

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={`Actions for ${user.label}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-7 items-center justify-center rounded-md hover:bg-hover"
      >
        <MoreHorizontal className="size-3.5 text-foreground-secondary" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-40 flex w-60 flex-col overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          {assignableRoles.length > 0 && (
            <>
              <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.6px] text-foreground-muted">
                Change role
              </p>
              {assignableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={pending || role === user.role}
                  onClick={() => run(() => changeUserRole(user.id, role))}
                  className={itemClass}
                >
                  {ROLE_LABELS[role]}
                  {role === user.role && (
                    <span className="ml-auto text-xs text-foreground-muted">
                      current
                    </span>
                  )}
                </button>
              ))}
              <div className="my-1 h-px w-full bg-hover" />
            </>
          )}

          {user.status === "INVITED" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => resendInvitation(user.id))}
              className={itemClass}
            >
              Resend invite
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setResetting(true);
              }}
              className={itemClass}
            >
              Reset password
            </button>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => setUserSuspended(user.id, !user.suspended))
            }
            className={itemClass}
          >
            {user.suspended ? "Reactivate account" : "Suspend account"}
          </button>

          {canDelete && (
            <>
              <div className="my-1 h-px w-full bg-hover" />
              {confirmingDelete ? (
                <div className="flex flex-col gap-2 px-3 py-2">
                  <p className="text-[13px] font-medium text-foreground">
                    Delete {user.label}?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteUser(user.id))}
                      className="flex h-[26px] items-center rounded-md border border-danger/40 bg-danger/10 px-2.5 text-xs font-medium text-danger hover:brightness-95 disabled:opacity-50"
                    >
                      {pending ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmingDelete(true)}
                  className={`${itemClass} text-danger`}
                >
                  Delete user
                </button>
              )}
            </>
          )}

          {error && (
            <p className="px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      )}

      {resetting && (
        <ResetPasswordDialog
          userId={user.id}
          label={user.label}
          onClose={() => setResetting(false)}
        />
      )}
    </div>
  );
}

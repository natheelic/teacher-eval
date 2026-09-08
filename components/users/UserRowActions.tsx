"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import {
  changeUserRole,
  deleteUser,
  resendInvitation,
  setUserSuspended,
} from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/permissions";
import { useToast } from "@/components/layout/ToastProvider";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      // The menu is portalled out of `rootRef`, so it needs its own check.
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      setConfirmingDelete(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /**
   * The menu is rendered in a portal with viewport-fixed coordinates rather
   * than absolutely inside the row: the table wrapper is `overflow-x-auto`,
   * which computes `overflow-y` to `auto` as well, so an in-flow dropdown gets
   * clipped by the table box — badly so when there are only a few rows and the
   * box is short.
   *
   * Its height also varies with role count and which section is showing (role
   * list, delete confirmation, an inline error), so measure space above/below
   * the trigger on every open (and whenever height-changing content changes)
   * and flip upward + cap height with the menu's own scroll when it doesn't
   * fit.
   */
  const position = useCallback(() => {
    const trigger = rootRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const GAP = 4;
    const VIEWPORT_MARGIN = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu.scrollHeight;
    const spaceBelow =
      window.innerHeight - triggerRect.bottom - GAP - VIEWPORT_MARGIN;
    const spaceAbove = triggerRect.top - GAP - VIEWPORT_MARGIN;
    const flipUp = menuHeight > spaceBelow && spaceAbove > spaceBelow;
    const maxHeight = Math.max(flipUp ? spaceAbove : spaceBelow, 120);

    // Right-align to the trigger, then keep the whole menu on screen.
    const width = menu.offsetWidth;
    const left = Math.min(
      Math.max(triggerRect.right - width, VIEWPORT_MARGIN),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    const top = flipUp
      ? Math.max(
          triggerRect.top - GAP - Math.min(menuHeight, maxHeight),
          VIEWPORT_MARGIN,
        )
      : triggerRect.bottom + GAP;

    setMenuStyle({ top, left, maxHeight });
  }, []);

  // Layout effect, so a reopen re-measures before the browser paints and the
  // previous open's coordinates are never visible.
  useLayoutEffect(() => {
    if (!open) return;
    position();
  }, [
    open,
    position,
    assignableRoles.length,
    canDelete,
    confirmingDelete,
    error,
    user.status,
  ]);

  // Fixed coordinates go stale the moment anything scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    const onReflow = () => position();
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, position]);

  /**
   * Server-side guards (last-admin, permission) throw, so surface the message
   * instead of silently doing nothing. Errors stay inline in the open menu;
   * only the success path toasts, since the menu closes on success and several
   * of these actions leave no visible trace in the row.
   */
  function run(fn: () => Promise<void>, success: string) {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
        setOpen(false);
        setConfirmingDelete(false);
        toast(success);
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

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: menuStyle?.top ?? 0,
              left: menuStyle?.left ?? 0,
              maxHeight: menuStyle?.maxHeight,
              // Hidden for the one frame before it has been measured, so it
              // never flashes in the top-left corner.
              visibility: menuStyle ? "visible" : "hidden",
            }}
            className="fixed z-50 flex w-60 flex-col overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
          >
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
                    onClick={() =>
                      run(
                        () => changeUserRole(user.id, role),
                        `${user.label} is now ${ROLE_LABELS[role]}.`,
                      )
                    }
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

            <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.6px] text-foreground-muted">
              Account
            </p>

            {user.status === "INVITED" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => resendInvitation(user.id),
                    `Invitation resent to ${user.label}.`,
                  )
                }
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
                run(
                  () => setUserSuspended(user.id, !user.suspended),
                  user.suspended
                    ? `${user.label} reactivated.`
                    : `${user.label} suspended.`,
                )
              }
              className={`${itemClass} ${user.suspended ? "" : "text-pending-strong"}`}
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
                        onClick={() =>
                          run(
                            () => deleteUser(user.id),
                            `${user.label} deleted.`,
                          )
                        }
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
          </div>,
          document.body,
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

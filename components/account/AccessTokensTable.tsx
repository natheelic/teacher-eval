"use client";

import { useActionState, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { KeyRound, Plus, Trash2, X } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { RelativeTime } from "./RelativeTime";
import { CopyButton } from "../dashboard/CopyButton";
import {
  createApiToken,
  revokeApiToken,
  type CreateTokenState,
} from "@/lib/actions/tokens";
import type { ApiTokenView } from "@/lib/queries/account";
import { formatDate } from "@/lib/format";
import { API_TOKEN_SCOPES } from "@/lib/auth/scopes";
import { useActionToast } from "@/components/layout/useActionToast";
import { useToast } from "@/components/layout/ToastProvider";

const initialState: CreateTokenState = {};

export function AccessTokensTable({ tokens }: { tokens: ApiTokenView[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // The specific plaintext already shown-and-dismissed, not just a boolean —
  // comparing by value (not "has any reveal ever been dismissed") is what
  // lets a *second* Generate flow show its own reveal panel. A plain
  // `!state.plaintext` check here was the bug (ROADMAP 5.10): state.plaintext
  // never goes back to undefined on its own, since useActionState only
  // updates on the next dispatch — so once one token had been created, the
  // dialog could never show again for the rest of the session.
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimistic, removeOptimistic] = useOptimistic(
    tokens,
    (state, id: string) => state.filter((t) => t.id !== id),
  );
  const [state, formAction, creating] = useActionState(
    createApiToken,
    initialState,
  );
  const { toast } = useToast();
  // Failures toast; a *success* does not, because the reveal panel below is
  // the confirmation — and it must not auto-dismiss, since it is the only
  // time the plaintext token is ever shown.
  useActionToast(state, () => null);

  const showReveal = Boolean(state.plaintext) && state.plaintext !== dismissedToken;
  // Once a token exists, the reveal panel takes over from the dialog.
  const showDialog = dialogOpen && !showReveal;

  function dismissReveal() {
    setDismissedToken(state.plaintext ?? null);
    setDialogOpen(false);
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between">
        <SectionHeading
          title="Access tokens"
          description="Personal access tokens can be used to authenticate with the API."
        />
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95"
        >
          <Plus className="size-3.5" />
          Generate new token
        </button>
      </div>

      {showReveal && (
        <RevealPanel
          name={state.tokenName ?? "New token"}
          token={state.plaintext!}
          onDismiss={dismissReveal}
        />
      )}

      <SettingsCard>
        {optimistic.length === 0 ? (
          <div className="flex w-full flex-col items-center gap-1 p-8 text-center">
            <p className="text-[13px] font-medium text-foreground">
              No access tokens yet
            </p>
            <p className="text-[13px] font-medium text-foreground-muted">
              Generate one to authenticate with the API.
            </p>
          </div>
        ) : (
          optimistic.map((token, i) => (
            <div
              key={token.id}
              className={`flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                i < optimistic.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-hover text-foreground-secondary">
                  <KeyRound className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col items-start">
                  <p className="text-[13px] font-medium text-foreground">
                    {token.name}
                  </p>
                  <p className="truncate font-mono text-xs font-medium text-foreground-muted">
                    {token.preview}
                  </p>
                  <p className="text-xs font-medium text-foreground-muted">
                    {token.scopes.length > 0
                      ? token.scopes.join(", ")
                      : "No scopes — every route will reject this token"}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-6 sm:w-auto">
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-xs font-medium text-foreground-muted">
                    Created {formatDate(token.createdAt)}
                  </p>
                  <p className="text-xs font-medium text-foreground-muted">
                    Last used:{" "}
                    {token.lastUsedAt ? (
                      <RelativeTime iso={token.lastUsedAt} />
                    ) : (
                      "Never"
                    )}
                  </p>
                  <ExpiryLabel iso={token.expiresAt} />
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      removeOptimistic(token.id);
                      await revokeApiToken(token.id);
                      toast(`Revoked “${token.name}”.`);
                    })
                  }
                  className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-medium text-foreground hover:brightness-95 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </SettingsCard>

      {showDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Generate access token"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialogOpen(false);
          }}
        >
          <form
            action={formAction}
            className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <h2 className="font-display text-lg font-semibold text-foreground">
              Generate access token
            </h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-foreground">
                Token name
              </span>
              <input
                name="name"
                autoFocus
                placeholder="CLI token"
                className="h-[34px] w-full rounded-md border border-border-strong bg-hover px-3 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-foreground">
                Expiration
              </span>
              <select
                name="expiresIn"
                defaultValue=""
                className="h-[34px] w-full rounded-md border border-border-strong bg-hover px-3 text-[13px] font-medium text-foreground outline-none focus:border-border-emphasis"
              >
                <option value="">No expiration</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-foreground">
                Scopes
              </span>
              {API_TOKEN_SCOPES.map((scope) => (
                <label
                  key={scope.value}
                  className="flex items-start gap-2 text-[13px] font-medium text-foreground"
                >
                  <input
                    type="checkbox"
                    name="scopes"
                    value={scope.value}
                    defaultChecked
                    className="mt-0.5"
                  />
                  <span className="flex flex-col">
                    {scope.label}
                    <span className="text-xs font-medium text-foreground-muted">
                      {scope.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex h-[26px] items-center rounded-md border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground hover:bg-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex h-[26px] items-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50"
              >
                {creating ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Never changes, so the store never notifies — mirrors RelativeTime.tsx.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * "Expired" depends on comparing against `new Date()`, which — like relative
 * time — can differ between the server render and the client's hydration
 * pass. Renders the neutral "Expires <date>" / "No expiration" form until
 * hydrated, then upgrades to "Expired" if the date has passed.
 */
function ExpiryLabel({ iso }: { iso: string | null }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!iso) {
    return (
      <p className="text-xs font-medium text-foreground-muted">No expiration</p>
    );
  }

  const expired = hydrated && new Date(iso) < new Date();

  return (
    <p
      className={`text-xs font-medium ${expired ? "text-danger" : "text-foreground-muted"}`}
    >
      {expired ? "Expired" : "Expires"} {formatDate(iso)}
    </p>
  );
}

/**
 * The plaintext token is never stored, so this is the only chance to copy it.
 * Controlled by the parent (`showReveal`/`dismissReveal`) rather than owning
 * its own dismissed flag — see AccessTokensTable's `dismissedToken` comment.
 */
function RevealPanel({
  name,
  token,
  onDismiss,
}: {
  name: string;
  token: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex w-full max-w-[688px] flex-col gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-[13px] font-semibold text-foreground">
            Copy “{name}” now
          </p>
          <p className="text-[13px] font-medium text-foreground-secondary">
            This is the only time the token is shown. It cannot be retrieved
            later.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-hover"
        >
          <X className="size-3.5 text-foreground-secondary" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded border border-border bg-surface px-2 py-1.5 font-mono text-xs text-foreground">
          {token}
        </code>
        <CopyButton value={token} />
      </div>
    </div>
  );
}

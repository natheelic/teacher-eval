"use client";

import { useOptimistic, useTransition } from "react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { Switch } from "./Switch";
import { toggleShortcut } from "@/lib/actions/preferences";

/**
 * The slugs are the storage keys in UserPreferences.keyboardShortcuts. They
 * are owned by the UI, which is why that column is JSON rather than a table.
 */
const SHORTCUTS = [
  { slug: "open-command-menu", label: "Open command menu", keys: "⌘K" },
  { slug: "toggle-ai-panel", label: "Toggle AI Assistant panel", keys: "⌘I" },
  { slug: "toggle-inline-editor", label: "Toggle inline editor", keys: "⌘E" },
  { slug: "copy-markdown", label: "Copy results as Markdown", keys: "⌘⇧M" },
  { slug: "copy-json", label: "Copy results as JSON", keys: "⌘⇧J" },
  { slug: "copy-csv", label: "Copy results as CSV", keys: "⌘⇧C" },
  { slug: "download-csv", label: "Download results as CSV", keys: "⌘⇧D" },
  { slug: "publish-oauth-app", label: "Publish OAuth app", keys: "⇧N" },
  { slug: "invite-members", label: "Invite members", keys: "⇧N" },
  { slug: "add-project-connection", label: "Add project connection", keys: "⇧N" },
  { slug: "new-project", label: "New project", keys: "⇧N" },
  { slug: "create-private-app", label: "Create private app", keys: "⇧N" },
  { slug: "refresh-audit-logs", label: "Refresh audit logs", keys: "⇧R" },
] as const;

export function KeyboardShortcuts({
  shortcuts,
}: {
  shortcuts: Record<string, boolean>;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    shortcuts,
    (state, update: { slug: string; enabled: boolean }) => ({
      ...state,
      [update.slug]: update.enabled,
    }),
  );

  function handleToggle(slug: string, enabled: boolean) {
    startTransition(async () => {
      setOptimistic({ slug, enabled });
      await toggleShortcut(slug, enabled);
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Keyboard shortcuts"
        description="Choose which shortcuts stay active while working in the dashboard."
      />
      <SettingsCard>
        {SHORTCUTS.map((shortcut, i) => (
          <div
            key={shortcut.slug}
            className={`flex w-full flex-wrap items-center justify-between gap-2 px-4 py-4 ${
              i < SHORTCUTS.length - 1 ? "border-b border-black/8" : ""
            }`}
          >
            <p className="min-w-0 text-[13px] font-medium text-[#030303]">
              {shortcut.label}
            </p>
            <div className="flex shrink-0 items-center gap-[10px]">
              <span className="rounded bg-black/[0.03] px-1.5 py-0.5 text-[11px] font-medium tracking-[-0.275px] text-[#696969]">
                {shortcut.keys}
              </span>
              <Switch
                // Shortcuts default to on, so an absent key means enabled.
                checked={optimistic[shortcut.slug] ?? true}
                onCheckedChange={(next) => handleToggle(shortcut.slug, next)}
                disabled={pending}
                aria-label={shortcut.label}
              />
            </div>
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}

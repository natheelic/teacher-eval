"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Send, Trash2 } from "lucide-react";
import {
  SettingsBlock,
  SettingsCard,
  SettingsField,
} from "../account/SettingsPrimitives";
import {
  clearEmailSettings,
  saveEmailSettings,
  sendTestEmail,
  type EmailSettingsActionState,
} from "@/lib/actions/email-settings";
import type { SmtpAdminView } from "@/lib/queries/email-settings";
import {
  DEFAULT_PROVIDER_ID,
  EMAIL_PROVIDERS,
  getEmailProvider,
  type EmailProviderId,
} from "@/lib/email-providers";
import { useActionToast } from "@/components/layout/useActionToast";
import { useToast } from "@/components/layout/ToastProvider";

const initialState: EmailSettingsActionState = {};

const FIELD_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-border-strong";

/** Matches the green primary / soft-danger pair used across the app. */
const PRIMARY_BUTTON =
  "flex h-[30px] items-center gap-1.5 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-3 text-xs font-medium text-[#030303] hover:brightness-95 disabled:opacity-50";
const DANGER_BUTTON =
  "flex h-[30px] items-center gap-1.5 rounded-md border border-danger/30 bg-danger-soft px-3 text-xs font-medium text-foreground hover:brightness-95 disabled:opacity-50";
const NEUTRAL_BUTTON =
  "flex h-[30px] items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-xs font-medium text-foreground hover:bg-hover disabled:opacity-50";

const SOURCE_COPY: Record<
  SmtpAdminView["source"],
  { tone: "ok" | "warn"; text: string }
> = {
  database: { tone: "ok", text: "Sending through the settings saved here." },
  environment: {
    tone: "ok",
    text: "Sending through the SMTP_* environment variables. Saving settings here overrides them.",
  },
  unset: {
    tone: "warn",
    text: "Email is not configured — invitations and password resets cannot be sent.",
  },
};

export function EmailSettings({
  settings,
  defaultTestRecipient,
}: {
  settings: SmtpAdminView;
  defaultTestRecipient: string;
}) {
  const [state, formAction, submitting] = useActionState(
    saveEmailSettings,
    initialState,
  );
  const [testState, testAction, testing] = useActionState(
    sendTestEmail,
    initialState,
  );
  const [clearing, startClearTransition] = useTransition();
  const { toast } = useToast();
  useActionToast(state, "Settings saved.");
  useActionToast(testState, (result) => `Test email sent to ${result.sentTo}.`);

  // Defaults to whatever was saved; "custom" for a fresh install, which keeps
  // the full host/port form visible rather than presuming a provider.
  const [providerId, setProviderId] = useState<EmailProviderId>(
    settings.provider ?? DEFAULT_PROVIDER_ID,
  );
  const provider = getEmailProvider(providerId);
  const isCustom = provider.host === null;
  const status = SOURCE_COPY[settings.source];

  // Awaited inside the transition, matching LogoSettings/AnnouncementSettings.
  // A synchronous callback would end the transition before the action
  // resolved, so the button would never show its pending state and a failure
  // would surface as an unhandled rejection.
  function handleClear() {
    startClearTransition(async () => {
      const result = await clearEmailSettings();
      if (result?.error) toast(result.error, "danger");
      else toast("Email settings cleared.");
    });
  }

  const isConfigured = settings.source !== "unset";

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div
        className={`w-full max-w-[688px] rounded-md border px-4 py-3 ${
          status.tone === "warn"
            ? "border-danger/30 bg-danger-soft"
            : "border-border bg-surface"
        }`}
      >
        <p className="text-[13px] font-medium text-foreground-secondary">
          {status.text}
        </p>
        {settings.hasPassword && !settings.passwordDecryptable && (
          <p className="pt-2 text-[13px] font-medium text-danger">
            The stored {provider.credentialLabel} could not be
            decrypted — AUTH_SECRET may have changed. Re-enter it below.
          </p>
        )}
      </div>

      <SettingsCard>
        <form action={formAction} className="flex w-full flex-col">
          {/* The picker is inside the form so its value submits directly,
              while onChange re-renders the fields below it. */}
          <SettingsBlock
            title="Provider"
            description="Choosing a provider fills in its server details for you."
          >
            <SettingsField label="Email provider" htmlFor="provider">
              <select
                id="provider"
                name="provider"
                value={providerId}
                onChange={(e) =>
                  setProviderId(e.target.value as EmailProviderId)
                }
                className={FIELD_CLASS}
              >
                {EMAIL_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </SettingsField>
            <p className="text-[13px] font-medium text-foreground-muted">
              {provider.hint}
            </p>
          </SettingsBlock>

          {/* Keyed on the saved config so the fields below pick up their new
              defaults after a save. The key stays here and not on the <form>:
              remounting the form would reset useActionState and wipe the
              "Settings saved." confirmation the save just produced. */}
          <SettingsBlock
            key={`${settings.provider}-${settings.host}-${settings.port}-${settings.from}-${settings.user}`}
            title={isCustom ? "Server" : "Credentials"}
            description={
              isCustom
                ? undefined
                : `Connects to ${provider.host}:${provider.port}.`
            }
            bordered={false}
          >
            {isCustom && (
              <>
                <SettingsField label="Host" htmlFor="host">
                  <input
                    id="host"
                    name="host"
                    defaultValue={settings.host ?? ""}
                    placeholder="smtp.example.com"
                    required
                    className={FIELD_CLASS}
                  />
                </SettingsField>
                <SettingsField label="Port" htmlFor="port">
                  <input
                    id="port"
                    name="port"
                    type="number"
                    min={1}
                    max={65535}
                    defaultValue={settings.port ?? ""}
                    placeholder="587"
                    required
                    className={FIELD_CLASS}
                  />
                </SettingsField>
              </>
            )}

            <SettingsField
              label="From address"
              htmlFor="from"
              hint="Shown as the sender on every email the app sends."
            >
              <input
                id="from"
                name="from"
                defaultValue={settings.from ?? ""}
                placeholder="Portal &lt;noreply@example.com&gt;"
                required
                className={FIELD_CLASS}
              />
            </SettingsField>

            {/* Resend and SendGrid authenticate as a fixed literal username,
                which the action supplies — asking for it invites errors. */}
            {provider.fixedUser === null && (
              <SettingsField
                label={provider.needsCredential ? "Username" : "Username (optional)"}
                htmlFor="user"
              >
                <input
                  id="user"
                  name="user"
                  defaultValue={settings.user ?? ""}
                  placeholder={
                    provider.id === "gmail" || provider.id === "outlook"
                      ? "you@example.com"
                      : "Username"
                  }
                  required={provider.needsCredential}
                  className={FIELD_CLASS}
                />
              </SettingsField>
            )}

            <SettingsField
              label={
                provider.needsCredential
                  ? provider.credentialLabel
                  : `${provider.credentialLabel} (optional)`
              }
              htmlFor="password"
              hint={
                settings.hasPassword
                  ? `Saved. Leave blank to keep the current ${provider.credentialLabel}.`
                  : undefined
              }
            >
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={
                  settings.hasPassword ? "••••••••" : provider.credentialLabel
                }
                className={FIELD_CLASS}
              />
            </SettingsField>

            <div className="flex items-center justify-end gap-2">
              {isConfigured && settings.provider !== null && (
                <button
                  type="button"
                  disabled={clearing || submitting}
                  onClick={handleClear}
                  className={DANGER_BUTTON}
                >
                  <Trash2 className="size-3.5" />
                  {clearing ? "Clearing..." : "Clear"}
                </button>
              )}
              <button type="submit" disabled={submitting || clearing} className={PRIMARY_BUTTON}>
                <Check className="size-3.5" />
                {submitting ? "Saving..." : "Save settings"}
              </button>
            </div>
          </SettingsBlock>
        </form>
      </SettingsCard>

      <SettingsCard>
        <form action={testAction} className="flex w-full flex-col">
          <SettingsBlock
            title="Send a test email"
            description="Uses the saved settings above, so save any changes first."
            bordered={false}
          >
            <SettingsField label="Recipient" htmlFor="test-to">
              <input
                id="test-to"
                name="to"
                type="email"
                defaultValue={defaultTestRecipient}
                className={FIELD_CLASS}
              />
            </SettingsField>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={testing || !isConfigured}
                className={isConfigured ? NEUTRAL_BUTTON : `${NEUTRAL_BUTTON} cursor-not-allowed`}
                title={isConfigured ? undefined : "Configure email first"}
              >
                <Send className="size-3.5" />
                {testing ? "Sending..." : "Send test email"}
              </button>
            </div>
          </SettingsBlock>
        </form>
      </SettingsCard>
    </div>
  );
}

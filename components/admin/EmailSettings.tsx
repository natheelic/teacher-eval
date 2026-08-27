"use client";

import { useActionState, useState, useTransition } from "react";
import {
  SectionHeading,
  SettingsCard,
  SettingsRow,
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

const initialState: EmailSettingsActionState = {};

const FIELD_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground outline-none focus:border-border-strong";

const SOURCE_COPY: Record<SmtpAdminView["source"], string> = {
  database: "Using the settings saved here.",
  environment:
    "Using the SMTP_* environment variables. Saving settings here overrides them.",
  unset: "Email is not configured, so the app cannot send invitations or password resets.",
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
  const [clearError, setClearError] = useState<string | null>(null);

  // Defaults to whatever was saved; "custom" for a fresh install, which keeps
  // the full host/port form visible rather than presuming a provider.
  const [providerId, setProviderId] = useState<EmailProviderId>(
    settings.provider ?? DEFAULT_PROVIDER_ID,
  );
  const provider = getEmailProvider(providerId);
  const isCustom = provider.host === null;

  // Awaited inside the transition, matching LogoSettings/AnnouncementSettings.
  // A synchronous callback would end the transition before the action
  // resolved, so the button would never show its pending state and a failure
  // would surface as an unhandled rejection.
  function handleClear() {
    setClearError(null);
    startClearTransition(async () => {
      const result = await clearEmailSettings();
      if (result?.error) setClearError(result.error);
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="SMTP"
        description="The mail server used for invitations, password resets and email verification."
      />

      <div className="w-full max-w-[688px] rounded-md border border-border bg-surface px-4 py-3">
        <p className="text-[13px] font-medium text-foreground-secondary">
          {SOURCE_COPY[settings.source]}
        </p>
        {settings.hasPassword && !settings.passwordDecryptable && (
          <p className="pt-2 text-[13px] font-medium text-danger">
            The stored SMTP password could not be decrypted — AUTH_SECRET may have
            changed. Re-enter the password below.
          </p>
        )}
      </div>

      <SettingsCard>
        <SettingsRow
          label="Provider"
          description="Choosing a provider fills in its server details for you."
          control={
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value as EmailProviderId)}
              aria-label="Email provider"
              className={FIELD_CLASS}
            >
              {EMAIL_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          }
        />
        <SettingsRow
          label={isCustom ? "SMTP server" : "Credentials"}
          description={provider.hint}
          bordered={false}
          control={
            <form
              key={`${settings.provider}-${settings.host}-${settings.port}-${settings.from}-${settings.user}`}
              action={formAction}
              className="flex w-full flex-col gap-2"
            >
              {/* The picker lives outside the form so it can drive the fields,
                  so its value is submitted through a hidden input. */}
              <input type="hidden" name="provider" value={providerId} />

              {isCustom ? (
                <>
                  <input name="host" defaultValue={settings.host ?? ""} placeholder="smtp.example.com" required aria-label="SMTP host" className={FIELD_CLASS} />
                  <input name="port" type="number" min={1} max={65535} defaultValue={settings.port ?? ""} placeholder="587" required aria-label="SMTP port" className={FIELD_CLASS} />
                </>
              ) : (
                <p className="pb-1 text-[13px] font-medium text-foreground-muted">
                  {provider.host}:{provider.port}
                </p>
              )}

              <input name="from" defaultValue={settings.from ?? ""} placeholder="Portal &lt;noreply@example.com&gt;" required aria-label="From address" className={FIELD_CLASS} />

              {/* Resend and SendGrid authenticate as a fixed literal username,
                  which the action supplies — asking for it invites errors. */}
              {provider.fixedUser === null && (
                <input
                  name="user"
                  defaultValue={settings.user ?? ""}
                  placeholder={provider.needsCredential ? "Username" : "Username (optional)"}
                  required={provider.needsCredential}
                  aria-label="SMTP username"
                  className={FIELD_CLASS}
                />
              )}

              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={
                  settings.hasPassword
                    ? `A ${provider.credentialLabel.toLowerCase()} is saved — leave blank to keep it`
                    : provider.needsCredential
                      ? provider.credentialLabel
                      : `${provider.credentialLabel} (optional)`
                }
                aria-label={provider.credentialLabel}
                className={FIELD_CLASS}
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={clearing}
                  onClick={handleClear}
                  className="flex items-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-hover disabled:opacity-60"
                >
                  {clearing ? "Clearing..." : "Clear"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-hover disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>

              {(state.error || clearError) && (
                <p className="text-[13px] font-medium text-danger">
                  {state.error ?? clearError}
                </p>
              )}
              {state.ok && (
                <p className="text-[13px] font-medium text-foreground-secondary">
                  Settings saved.
                </p>
              )}
            </form>
          }
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsRow
          label="Send a test email"
          description="Sends using the saved settings above, so save any changes first."
          bordered={false}
          control={
            <form action={testAction} className="flex w-full flex-col gap-2">
              <input
                name="to"
                type="email"
                defaultValue={defaultTestRecipient}
                aria-label="Test recipient"
                className={FIELD_CLASS}
              />
              <button
                type="submit"
                disabled={testing}
                className="self-end rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-hover disabled:opacity-60"
              >
                {testing ? "Sending..." : "Send test email"}
              </button>
              {testState.error && (
                <p className="break-words text-[13px] font-medium text-danger">
                  {testState.error}
                </p>
              )}
              {testState.ok && (
                <p className="text-[13px] font-medium text-foreground-secondary">
                  Test email sent to {testState.sentTo}.
                </p>
              )}
            </form>
          }
        />
      </SettingsCard>
    </div>
  );
}

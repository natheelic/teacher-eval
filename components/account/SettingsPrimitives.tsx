export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="text-[13px] font-medium text-foreground-secondary">{description}</p>
    </div>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[688px] flex-col items-start overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      {children}
    </div>
  );
}

/**
 * A full-width block inside a SettingsCard, for sections that are a *form*
 * rather than a single control.
 *
 * SettingsRow puts its control in a fixed 262px right-aligned column, which is
 * right for a toggle or one button and wrong for a stack of text inputs — they
 * end up cramped against the edge while the label column sits mostly empty.
 * Use this instead when a section collects several values.
 */
export function SettingsBlock({
  title,
  description,
  children,
  bordered = true,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col gap-4 p-4 ${
        bordered ? "border-b border-border" : ""
      }`}
    >
      {(title || description) && (
        <div className="flex flex-col gap-0.5">
          {title && (
            <p className="text-[13px] font-medium text-foreground">{title}</p>
          )}
          {description && (
            <p className="text-[13px] font-medium text-foreground-muted">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * A labelled form field. The label stays visible after the field is filled,
 * unlike a placeholder — which is why placeholders are for examples here, not
 * for naming the field.
 */
export function SettingsField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[12px] font-medium text-foreground-muted">{hint}</p>
      )}
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  control,
  bordered = true,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-start sm:gap-6 ${
        bordered ? "border-b border-border" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start sm:flex-[368]">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-[13px] font-medium text-foreground-muted">
            {description}
          </p>
        )}
      </div>
      <div className="flex w-full shrink-0 flex-col items-start justify-center sm:w-[262px] sm:items-end">
        {control}
      </div>
    </div>
  );
}

import { AlertCircle } from "lucide-react";

/** Card shell shared by the sign-in and sign-up forms. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-lg border border-black/8 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-lg font-semibold text-[#030303]">
        {title}
      </h1>
      <p className="text-[13px] font-medium text-[#464646]">{description}</p>
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
  defaultValue,
  value,
  onChange,
  error,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  const describedBy = error ? `${name}-error` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[13px] font-medium text-[#030303]"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        defaultValue={onChange ? undefined : defaultValue}
        value={onChange ? value : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-[34px] w-full rounded-md border bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 ${
          error ? "border-[#ab413e]/60" : "border-black/15"
        }`}
      />
      {error && (
        <p id={describedBy} className="text-xs font-medium text-[#ab413e]">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-[#ab413e]/25 bg-[#ab413e]/5 px-3 py-2"
    >
      <AlertCircle className="mt-px size-3.5 shrink-0 text-[#ab413e]" />
      <p className="text-[13px] font-medium text-[#ab413e]">{message}</p>
    </div>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-[34px] w-full items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 text-[13px] font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-black/8" />
      <span className="text-xs font-medium text-[#696969]">or</span>
      <span className="h-px flex-1 bg-black/8" />
    </div>
  );
}

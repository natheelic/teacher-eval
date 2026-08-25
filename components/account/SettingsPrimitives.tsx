export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <h2 className="font-display text-lg font-semibold text-[#030303]">
        {title}
      </h2>
      <p className="text-[13px] font-medium text-[#464646]">{description}</p>
    </div>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[688px] flex-col items-start overflow-hidden rounded-lg border border-black/8 bg-white shadow-sm">
      {children}
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
        bordered ? "border-b border-black/8" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start sm:flex-[368]">
        <p className="text-[13px] font-medium text-[#030303]">{label}</p>
        {description && (
          <p className="text-[13px] font-medium text-[#696969]">
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

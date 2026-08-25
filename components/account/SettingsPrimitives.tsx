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
    <div className="flex w-[688px] flex-col items-start overflow-hidden rounded-lg border border-black/8 bg-white shadow-sm">
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
      className={`flex w-full items-start gap-6 p-4 ${
        bordered ? "border-b border-black/8" : ""
      }`}
    >
      <div className="flex min-w-0 flex-[368] flex-col items-start">
        <p className="text-[13px] font-medium text-[#030303]">{label}</p>
        {description && (
          <p className="text-[13px] font-medium text-[#696969]">
            {description}
          </p>
        )}
      </div>
      <div className="flex w-[262px] shrink-0 flex-col items-end justify-center">
        {control}
      </div>
    </div>
  );
}

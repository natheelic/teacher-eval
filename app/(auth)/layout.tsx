import { AppLogo } from "@/components/dashboard/AppLogo";
import { getAppSettings } from "@/lib/queries/settings";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const { logoUrl, appName } = await getAppSettings();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <AppLogo className="size-10" src={logoUrl} />
          <p className="text-[13px] font-medium text-foreground-muted">{appName}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

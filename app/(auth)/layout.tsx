import { AppLogo } from "@/components/dashboard/AppLogo";
import { appName } from "@/lib/app-config";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#fdfdfd] px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <AppLogo className="size-10" />
          <p className="text-[13px] font-medium text-[#696969]">{appName}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

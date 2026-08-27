import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/dashboard/AppLogo";
import { getAppSettings } from "@/lib/queries/settings";

// No appName here, so this stays a static object.
export const metadata: Metadata = { title: "Terms of Service" };

// Public: listed in auth.config's PUBLIC_EXACT, so anonymous visitors and
// signed-in users alike can reach it — conventionally a ToS page shouldn't
// require sign-in.

// A function of the resolved name rather than a module-level const, since the
// product name is now a runtime setting (ROADMAP 7.1).
const sectionsFor = (appName: string) => [
  {
    title: "Acceptance of Terms",
    body: `By creating an account or otherwise using ${appName}, you agree to these terms. If you don't agree, don't use the service.`,
  },
  {
    title: "Use of the Service",
    body: `${appName} manages user accounts, roles and access for a single application. You're responsible for the accounts you create and the actions taken under them.`,
  },
  {
    title: "Data Processing",
    body: `${appName} stores account information (name, email, role, and activity records) needed to operate the service. It is not shared with third parties beyond what's required to run the service itself.`,
  },
  {
    title: "Termination",
    body: `An account may be deleted by its owner or by an administrator. Deletion is a soft delete: the account is deactivated immediately and its data is permanently removed after a grace period.`,
  },
  {
    title: "Changes to These Terms",
    body: `These terms may change as the service changes. Material changes will be reflected on this page.`,
  },
  {
    title: "Contact",
    body: `Questions about these terms can be sent through the Feedback button in the app.`,
  },
];

export default async function TermsPage() {
  const { logoUrl, appName } = await getAppSettings();
  const sections = sectionsFor(appName);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center border-b border-border">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-4 px-4 sm:px-0">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <AppLogo className="h-[18px] w-auto" src={logoUrl} />
            <span className="truncate text-[13px] font-medium text-foreground">
              {appName}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-16 sm:px-0">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[28px] font-semibold tracking-[-0.7px] text-foreground">
              Terms of Service
            </h1>
            <p className="text-[13px] font-medium text-danger">
              Placeholder text — this page has not been reviewed by a lawyer
              and should not be treated as a real legal agreement until it
              has been.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <h2 className="font-display text-[17px] font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-[14px] font-medium leading-relaxed text-foreground-secondary">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, ListChecks, ShieldCheck, Users } from "lucide-react";
import { AppLogo } from "@/components/dashboard/AppLogo";
import { appName } from "@/lib/app-config";
import { getAppSettings } from "@/lib/queries/settings";

export const metadata: Metadata = {
  // Sits at the root, so it opts out of the `%s · appName` template.
  title: `${appName} — user management`,
  description:
    "Accounts, roles and access for a single application. Invite people, set what they can do, and keep a record of every change.",
};

// Public: `/` is listed in auth.config's PUBLIC_EXACT, so the proxy lets
// anonymous visitors through. Deliberately reads no session — that keeps this
// page static, and the signed-in home is `/users`.

const FEATURES = [
  {
    icon: Users,
    title: "Accounts and roles",
    body: "Create accounts, change roles, suspend or reactivate, and reset passwords from one table with search, filters and paging.",
  },
  {
    icon: ShieldCheck,
    title: "Guardrails that hold",
    body: "Admins outrank managers, managers act only on lower ranks, and the last active admin can never be demoted, suspended or deleted.",
  },
  {
    icon: KeyRound,
    title: "Sessions you can revoke",
    body: "Every sign-in is labelled by device and listed in the account area. Revoking one — or changing a password — takes effect on the next request.",
  },
  {
    icon: ListChecks,
    title: "An audit trail",
    body: "Administrative actions are recorded with actor, target and time, filterable per account or across the whole application.",
  },
];

export default async function LandingPage() {
  const { logoUrl } = await getAppSettings();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center border-b border-border">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-10">
          <div className="flex min-w-0 items-center gap-2">
            <AppLogo className="h-[18px] w-auto" src={logoUrl} />
            <span className="truncate text-[13px] font-medium text-foreground">
              {appName}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/signin"
              className="flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium text-foreground-secondary hover:bg-hover"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex h-8 items-center justify-center rounded-full border border-[#16b674]/75 bg-[#72e3ad] px-3 text-xs font-medium text-[#030303] hover:bg-[#62d79f]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pb-16 pt-16 sm:px-10 sm:pb-24 sm:pt-24">
          <span className="w-fit rounded-full border border-border-strong bg-surface px-[7px] py-[3px] font-mono text-[9px] uppercase tracking-[0.63px] text-foreground-secondary">
            User management
          </span>
          <h1 className="max-w-[720px] pt-5 font-display text-[34px] font-semibold leading-[1.15] tracking-[-1px] text-foreground sm:text-[46px]">
            Accounts, roles and access — without the spreadsheet.
          </h1>
          <p className="max-w-[560px] pt-4 text-[15px] font-medium leading-relaxed text-foreground-secondary">
            {appName} does one job. It manages who has an account, what each
            person is allowed to do, and leaves a record of every change an
            administrator makes.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-8">
            <Link
              href="/signup"
              className="flex h-[38px] items-center justify-center gap-1.5 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-4 text-[13px] font-medium text-[#030303] hover:bg-[#62d79f]"
            >
              Create an account
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/signin"
              className="flex h-[38px] items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-[13px] font-medium text-foreground hover:bg-hover"
            >
              Sign in
            </Link>
          </div>
          <p className="pt-4 text-xs font-medium text-foreground-muted">
            The first account created becomes the administrator.
          </p>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-4 px-4 py-12 sm:grid-cols-2 sm:px-10 sm:py-16 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5"
              >
                <Icon className="size-4 text-foreground-secondary" />
                <h2 className="pt-1 font-display text-[15px] font-semibold tracking-[-0.2px] text-foreground">
                  {title}
                </h2>
                <p className="text-[13px] font-medium leading-relaxed text-foreground-secondary">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-4 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-20">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
              Ready when you are.
            </h2>
            <p className="text-[15px] font-medium text-foreground-secondary">
              Sign up, and the users table is the first thing you see.
            </p>
          </div>
          <Link
            href="/signup"
            className="flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-4 text-[13px] font-medium text-[#030303] hover:bg-[#62d79f]"
          >
            Get started
            <ArrowRight className="size-3.5" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-10">
          <span className="text-xs font-medium text-foreground-muted">
            © {new Date().getFullYear()} {appName}
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-xs font-medium text-foreground-muted hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-xs font-medium text-foreground-muted hover:text-foreground"
            >
              Create an account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

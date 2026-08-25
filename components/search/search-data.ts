export type SearchItem = {
  label: string;
  group: string;
  href: string;
};

export const SEARCH_ITEMS: SearchItem[] = [
  { label: "Dashboard", group: "Navigate", href: "/" },
  { label: "Project Settings", group: "Navigate", href: "/project/settings" },
  { label: "Account Preferences", group: "Navigate", href: "/account/preferences" },
  { label: "Access Tokens", group: "Navigate", href: "/account/access-tokens" },
  { label: "Security", group: "Navigate", href: "/account/security" },
  { label: "Audit Logs", group: "Navigate", href: "/account/audit-logs" },
];

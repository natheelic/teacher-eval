/**
 * The single source of truth for `ApiToken.scopes` — a controlled vocabulary
 * rather than free-form strings, so the column doesn't accumulate ad-hoc
 * values as more machine routes are added. Add an entry here (and the check
 * in the route it guards) before a new scope means anything.
 */
export const API_TOKEN_SCOPES = [
  {
    value: "identity:read",
    label: "Read your identity",
    description: "Used by GET /api/me.",
  },
] as const;

export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number]["value"];

const VALID_SCOPES = new Set<string>(
  API_TOKEN_SCOPES.map((scope) => scope.value),
);

export function isApiTokenScope(value: string): value is ApiTokenScope {
  return VALID_SCOPES.has(value);
}

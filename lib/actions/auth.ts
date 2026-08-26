"use server";

import { AuthError } from "next-auth";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { DEFAULT_SIGNED_IN_PATH } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/auth/password";
import { bootstrapUser } from "@/lib/bootstrap";
import { logAudit } from "@/lib/audit";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().max(100).optional(),
    email: z.email("Enter a valid email address"),
    password: passwordSchema,
  })
  .strip();

/** Safe relative redirect target — never allow an absolute URL from the query. */
function safeCallbackUrl(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/") && !value.startsWith("//")
    ? value
    : DEFAULT_SIGNED_IN_PATH;
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    // A *successful* signIn throws a redirect. Let it through untouched;
    // swallowing it would make every good login look like a failure.
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw error;
  }

  return {};
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { firstName, lastName, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const { user, isFirstUser } = await bootstrapUser({
    email,
    firstName,
    lastName,
    password,
  });

  await logAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: isFirstUser
      ? "Created the first account (admin)"
      : "Created an account",
    actionCode: "account.created",
    method: "POST",
    statusCode: 201,
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try signing in." };
    }
    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}

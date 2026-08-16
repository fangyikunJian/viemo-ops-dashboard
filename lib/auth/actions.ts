"use server";

import { redirect } from "next/navigation";
import { signIn, signOut, pruneExpiredSessions } from "./session";

export type LoginState = { error?: string };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  await pruneExpiredSessions();
  const result = await signIn(email, password);

  if (!result.ok) return { error: result.error };

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}

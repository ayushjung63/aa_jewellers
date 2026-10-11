"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-serif text-lg font-semibold">Change password</h2>
      <input className="input" name="current_password" type="password" placeholder="Current password" autoComplete="current-password" required />
      <input className="input" name="new_password" type="password" placeholder="New password (8+ characters)" autoComplete="new-password" minLength={8} required />
      <input className="input" name="confirm" type="password" placeholder="Repeat new password" autoComplete="new-password" minLength={8} required />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
      <button className="btn-gold w-full" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}

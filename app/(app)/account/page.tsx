import Link from "next/link";
import { PasswordForm } from "./password-form";
import { logout } from "@/app/actions";
import { currentUser } from "@/lib/auth";

export default async function Account() {
  const u = await currentUser();
  return (
    <div className="space-y-5">
      <header>
        <Link href="/" className="text-sm text-muted">← Home</Link>
        <h1 className="h1 mt-1">Account</h1>
        <p className="text-sm text-muted">Signed in as <span className="font-medium text-ink">{u?.username}</span></p>
      </header>
      <Link href="/account/activity" className="card flex items-center justify-between px-4 py-3">
        <span>Activity log</span>
        <span className="text-muted">→</span>
      </Link>
      <PasswordForm />
      <form action={logout}>
        <button className="btn-ghost w-full">Sign out</button>
      </form>
    </div>
  );
}

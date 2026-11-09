import Link from "next/link";
import { redirect } from "next/navigation";
import { updateRecoveryPassword } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login?message=Open the password reset link from your email first.");
  const params = await searchParams;
  return <main className="auth-page"><section className="auth-card">
    <Link className="auth-brand" href="/"><span className="brand-icon">◉</span>Tennis Tracker</Link>
    <div className="auth-heading"><span className="profile-overline">ACCOUNT RECOVERY</span><h1>Choose a new password</h1><p>Use at least 8 characters.</p></div>
    {params.updated && <p className="auth-message">Your password has been updated. You can sign in with it now.</p>}
    {params.error && <p className="auth-message error">{params.error === "invalid" ? "The passwords must match and contain at least 8 characters." : "We could not update the password. Request a new reset link and try again."}</p>}
    {!params.updated && <form action={updateRecoveryPassword} className="auth-form">
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label>Confirm new password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="action-button primary auth-submit" type="submit">Update password</button>
    </form>}
    <p className="auth-switch"><Link href={params.updated ? "/login" : "/"}>{params.updated ? "Go to sign in" : "Cancel"}</Link></p>
  </section></main>;
}

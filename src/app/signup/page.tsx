import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUp } from "@/app/auth/actions";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  const { error } = await searchParams;
  const needsConfiguration = error === "configuration";

  return <main className="auth-page">
    <section className="auth-card">
      <Link className="auth-brand" href="/"><span className="brand-icon">◉</span>Tennis Tracker</Link>
      <div className="auth-heading"><span className="profile-overline">PLAYER ACCOUNT</span><h1>Create your profile</h1><p>Your equipment and tennis history will belong to this account.</p></div>
      {needsConfiguration && <p className="auth-message error">Supabase is not configured yet. Add the project URL and publishable key to .env.local.</p>}
      {error && !needsConfiguration && <p className="auth-message error">{error}</p>}
      <form action={signUp} className="auth-form">
        <label>Player name<input name="displayName" type="text" autoComplete="name" required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /><small>Use at least 8 characters.</small></label>
        <button className="action-button primary auth-submit" type="submit">Create account</button>
      </form>
      <p className="auth-switch">Already registered? <Link href="/login">Sign in</Link></p>
      <p className="auth-footnote">A profile and private tennis data space are created automatically.</p>
    </section>
  </main>;
}

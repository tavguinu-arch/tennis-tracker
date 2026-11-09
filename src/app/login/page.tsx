import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  const { error, message } = await searchParams;
  const needsConfiguration = error === "configuration";

  return <main className="auth-page">
    <section className="auth-card">
      <Link className="auth-brand" href="/"><span className="brand-icon">◉</span>Tennis Tracker</Link>
      <div className="auth-heading"><span className="profile-overline">YOUR TENNIS, IN ONE PLACE</span><h1>Welcome back</h1><p>Sign in to your player account.</p></div>
      {needsConfiguration && <p className="auth-message error">Supabase is not configured yet. Add the project URL and publishable key to .env.local.</p>}
      {error && !needsConfiguration && <p className="auth-message error">{error}</p>}
      {message && <p className="auth-message">{message === "account-deleted" ? "Your account and tennis records have been deleted." : message}</p>}
      <form action={signIn} className="auth-form">
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="action-button primary auth-submit" type="submit">Sign in</button>
      </form>
      <p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p>
      <p className="auth-switch">New to Tennis Tracker? <Link href="/signup">Create an account</Link></p>
      <p className="auth-footnote">Your tennis records are private to your account.</p>
    </section>
  </main>;
}

import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return <main className="auth-page"><section className="auth-card">
    <Link className="auth-brand" href="/login"><span className="brand-icon">◉</span>Tennis Tracker</Link>
    <div className="auth-heading"><span className="profile-overline">ACCOUNT RECOVERY</span><h1>Reset your password</h1><p>Enter your account email and we’ll send a secure reset link.</p></div>
    {sent && <p className="auth-message">If an account uses that email, a password reset link will arrive shortly.</p>}
    <form action={requestPasswordReset} className="auth-form">
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <button className="action-button primary auth-submit" type="submit">Send reset link</button>
    </form>
    <p className="auth-switch"><Link href="/login">Return to sign in</Link></p>
  </section></main>;
}

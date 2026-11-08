"use client";

import { useState } from "react";
import type { DashboardSnapshot, RacketSummary, StringingSummary } from "@/lib/tennis/dashboard";
import { formatCurrency } from "@/lib/tennis/dashboard";
import { saveProfileSettings, signOut } from "@/app/auth/actions";

type View = "Overview" | "Rackets" | "Stringings" | "Strings" | "Profile";

const views: { name: View; icon: string }[] = [
  { name: "Overview", icon: "▦" },
  { name: "Rackets", icon: "⌁" },
  { name: "Stringings", icon: "⚒" },
  { name: "Strings", icon: "♜" },
];

const previewRackets: RacketSummary[] = [
  { name: "Raquete 1", model: "Tecnifibre TFight 300", bought: "29 Sep 2026", price: "€137.92" },
  { name: "Raquete 2", model: "Tecnifibre TFight 300", bought: "6 Oct 2026", price: "€156.66" },
  { name: "Raquete 3", model: "Tecnifibre TFight 300", bought: "6 Oct 2026", price: "€156.66" },
];

const previewStringings: StringingSummary[] = [
  { date: "7 Oct 2026", racket: "Raquete 3", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
  { date: "7 Oct 2026", racket: "Raquete 2", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
  { date: "7 Oct 2026", racket: "Raquete 3", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
  { date: "7 Oct 2026", racket: "Raquete 2", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
];

function PreviewBadge({ preview }: { preview: boolean }) {
  return <span className="preview-badge"><span />{preview ? "Glide screen preview" : "Connected to Supabase"}</span>;
}

function Header({ view, setView, preview, profileName }: { view: View; setView: (view: View) => void; preview: boolean; profileName: string }) {
  const initials = profileName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "TP";
  return (
    <header className="app-header">
      <div className="brand-lockup"><span className="brand-icon">◉</span><span>Tennis Tracker</span></div>
      <nav className="desktop-nav" aria-label="Main navigation">
        {views.map((item) => <button key={item.name} className={view === item.name ? "nav-link selected" : "nav-link"} onClick={() => setView(item.name)} type="button"><span>{item.icon}</span>{item.name}</button>)}
      </nav>
      <div className="header-right"><PreviewBadge preview={preview} /><button type="button" className={view === "Profile" ? "user-mark active" : "user-mark"} aria-label="Player profile and app settings" onClick={() => setView("Profile")}>{initials}</button></div>
    </header>
  );
}

function PageTitle({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return <div className="page-title"><h1>{title}</h1>{actions && <div className="title-actions">{actions}</div>}</div>;
}

function ActionButton({ children, secondary = false, onClick }: { children: React.ReactNode; secondary?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={secondary ? "action-button secondary" : "action-button primary"}>{children}</button>;
}

function PreviewNotice({ preview, loadError }: { preview: boolean; loadError: string | null }) {
  const message = loadError ?? (preview
    ? "These screens mirror your Glide app. Values shown are from the screenshots; changes are not saved yet."
    : "Your equipment and restringing history are loaded from your player account.");
  return <div className={loadError ? "preview-notice error-notice" : "preview-notice"}><span className="notice-symbol">i</span><span>{message}</span></div>;
}

function Overview({ data, currencyCode, onViewAll }: { data: DashboardSnapshot; currencyCode: string; onViewAll: () => void }) {
  const totalSpent = data.racketSpend + data.stringSpend + data.serviceSpend;
  return <>
    <PageTitle title="Overview" />
    <div className="stat-grid">
      <article className="stat-card"><div className="stat-heading"><span>Active rackets</span><span className="stat-icon">⌁</span></div><strong>{data.activeRackets}</strong></article>
      <article className="stat-card"><div className="stat-heading"><span>Stringings</span><span className="stat-icon">⚒</span></div><strong>{data.stringingsCount}</strong></article>
      <article className="stat-card spend-card"><div className="stat-heading"><span>Total spent</span><span className="stat-icon">▣</span></div><strong>{formatCurrency(totalSpent, currencyCode)}</strong><p>Rackets {formatCurrency(data.racketSpend, currencyCode)} <i>·</i> Strings {formatCurrency(data.stringSpend, currencyCode)} <i>·</i> Service {formatCurrency(data.serviceSpend, currencyCode)}</p></article>
    </div>
    <section className="data-section overview-latest">
      <div className="section-heading"><div><h2>Latest stringings</h2><p>Your most recent restringing sessions.</p></div><button className="text-link" type="button" onClick={onViewAll}>View all <span>→</span></button></div>
      <StringingTable rows={data.stringings.slice(0, 3)} compact />
    </section>
  </>;
}

function RacketsView({ data, onAction }: { data: DashboardSnapshot; onAction: (label: string) => void }) {
  return <>
    <PageTitle title="Rackets" actions={<><ActionButton secondary onClick={() => onAction("New model")}>New model</ActionButton><ActionButton onClick={() => onAction("New racket")}>＋ New racket</ActionButton></>} />
    <section className="data-section"><DataTable headers={["Racket", "Model", "Bought", "Price"]} rows={data.rackets.map((r) => [r.name, r.model, r.bought, r.price])} /></section>
    <div className="footnote">{data.rackets.length} rackets <span>·</span> Your current racket lineup</div>
  </>;
}

function StringingsView({ data, onAction }: { data: DashboardSnapshot; onAction: (label: string) => void }) {
  return <>
    <PageTitle title="Stringings" actions={<><ActionButton secondary onClick={() => onAction("New stringer")}>New stringer</ActionButton><ActionButton onClick={() => onAction("New stringing")}>＋ New stringing</ActionButton></>} />
    <section className="data-section"><StringingTable rows={data.stringings} /></section>
    <div className="footnote">Showing recent sessions <span>·</span> {data.stringingsCount} stringings total</div>
  </>;
}

function StringsView({ data, onAction }: { data: DashboardSnapshot; onAction: (label: string) => void }) {
  return <>
    <PageTitle title="Strings" actions={<><ActionButton secondary onClick={() => onAction("New string")}>New string</ActionButton><ActionButton onClick={() => onAction("New reel")}>＋ New reel</ActionButton></>} />
    <section className="strings-section">
      <div className="section-heading"><div><h2>Reels</h2><p>A reel holds about 17 stringings (16 to 18). Each stringing uses 0.5 of the reel for mains and 0.5 for crosses, so a full bed from one reel uses 1. Select a row to edit it.</p></div></div>
      <div className="data-section"><DataTable headers={["Reel", "Bought", "Price", "Used for mains"]} rows={data.reels.map((reel) => [reel.name, reel.bought, reel.price, reel.usedForMains])} /></div>
    </section>
    <section className="strings-section type-section">
      <div className="section-heading"><div><h2>String types</h2></div></div>
      <div className="data-section"><DataTable headers={["Brand", "String", "Type", "Gauge"]} rows={data.strings.map((item) => [item.brand, item.name, item.type, item.gauge])} /></div>
    </section>
  </>;
}

type ProfilePreferences = { locale: string; currency_code: string; timezone: string; preferred_tension_unit: string; theme: string };

function ProfileView({ profileName, email, preferences, preview, saved }: { profileName: string; email: string; preferences: ProfilePreferences; preview: boolean; saved: boolean }) {
  return <>
    <form id="profile-settings-form" action={saveProfileSettings} />
    <PageTitle title="Player profile & app settings" actions={<button form="profile-settings-form" type="submit" className="action-button primary">Save settings</button>} />
    {saved && <div className="settings-saved" role="status">Your preferences have been saved.</div>}
    <div className="profile-grid">
      <section className="profile-card profile-identity">
        <div className="profile-avatar-large">{profileName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "TP"}</div>
        <div><span className="profile-overline">PLAYER PROFILE</span><h2>{profileName}</h2><p>One profile keeps this player’s equipment and tennis history together.</p></div>
        <div className="profile-state"><span />{preview ? "Test account preview" : "Signed in"}</div>
      </section>
      <section className="profile-card">
        <div className="section-heading"><div><h2>Player details</h2><p>Created automatically when the player registers.</p></div></div>
        <div className="settings-list profile-controls"><div><label htmlFor="profile-display-name">Display name</label><input id="profile-display-name" name="display_name" form="profile-settings-form" defaultValue={profileName} maxLength={80} required /></div><div><span>Account email</span><strong>{email || "—"}</strong></div></div>
      </section>
      <section className="profile-card">
        <div className="section-heading"><div><h2>App preferences</h2><p>Defaults for this player’s tracking screens.</p></div></div>
        <div className="settings-list profile-controls">
          <div><label htmlFor="profile-locale">Language</label><select id="profile-locale" name="locale" form="profile-settings-form" defaultValue={preferences.locale}><option value="en-GB">English (UK)</option><option value="pt-PT">Português</option></select></div>
          <div><label htmlFor="profile-currency">Currency</label><select id="profile-currency" name="currency_code" form="profile-settings-form" defaultValue={preferences.currency_code}><option value="EUR">Euro (€)</option><option value="GBP">Pound (£)</option><option value="USD">US dollar ($)</option></select></div>
          <div><label htmlFor="profile-timezone">Time zone</label><select id="profile-timezone" name="timezone" form="profile-settings-form" defaultValue={preferences.timezone}><option value="Europe/Lisbon">Europe/Lisbon</option><option value="Europe/London">Europe/London</option><option value="Europe/Paris">Europe/Paris</option><option value="UTC">UTC</option></select></div>
          <div><label htmlFor="profile-tension">Preferred tension unit</label><select id="profile-tension" name="preferred_tension_unit" form="profile-settings-form" defaultValue={preferences.preferred_tension_unit}><option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option></select></div>
          <div><label htmlFor="profile-theme">Appearance</label><select id="profile-theme" name="theme" form="profile-settings-form" defaultValue={preferences.theme}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
        </div>
      </section>
      <section className="profile-card privacy-card">
        <span className="privacy-icon">◇</span><div><h2>Private player data</h2><p>Equipment, stringings and future training or tournament records are scoped to this profile and protected by Supabase Auth and RLS.</p><form action={signOut}><button type="submit" className="text-link sign-out-link">Sign out</button></form></div>
      </section>
    </div>
  </>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}<span className="sort-mark">↕</span></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function StringingTable({ rows, compact = false }: { rows: StringingSummary[]; compact?: boolean }) {
  return <div className="table-scroll"><table className={compact ? "stringing-table compact" : "stringing-table"}><thead><tr>{["Date", "Racket", "String", "Tension (main / cross)", "Stringer"].map((header) => <th key={header}>{header}<span className="sort-mark">↕</span></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row.racket}-${rowIndex}`}><td>{row.date}</td><td>{row.racket}</td><td>{row.string}</td><td>{row.tension}</td><td>{row.stringer}</td></tr>)}</tbody></table></div>;
}

export default function DashboardClient({ data, profileName, email = "", preferences, saved = false, profileError = null, loadError = null }: { data: DashboardSnapshot | null; profileName: string; email?: string; preferences?: ProfilePreferences; saved?: boolean; profileError?: string | null; loadError?: string | null }) {
  const [view, setView] = useState<View>("Overview");
  const [actionMessage, setActionMessage] = useState("");
  const preview = data === null;
  const currentData: DashboardSnapshot = data ?? {
    activeRackets: 3,
    stringingsCount: 15,
    racketSpend: 451.24,
    stringSpend: 95,
    serviceSpend: 75,
    rackets: previewRackets,
    stringings: previewStringings,
    reels: [{ name: "Solinco Hyper-G Soft 1.20", bought: "21 Sep 2026", price: "€95.00", usedForMains: "15" }],
    strings: [{ brand: "Solinco", name: "Hyper-G Soft", type: "Polyester", gauge: "1.20" }],
  };
  const currentPreferences = preferences ?? { locale: "en-GB", currency_code: "EUR", timezone: "Europe/Lisbon", preferred_tension_unit: "kg", theme: "system" };
  const handleAction = (label: string) => setActionMessage(`${label} form is not connected yet. This screen preview does not save records.`);
  return <main className="app-shell">
    <Header view={view} setView={setView} preview={preview} profileName={profileName} />
    <div className="main-content"><PreviewNotice preview={preview} loadError={loadError} />
      {!preview && !loadError && currentData.rackets.length === 0 && currentData.stringingsCount === 0 && <div className="empty-account-note">Your account is ready. No tennis records are assigned to it yet.</div>}
      {profileError && <div className="action-feedback" role="alert">{profileError === "invalid-settings" ? "One or more preferences are not valid." : "Your preferences could not be saved."}</div>}
      {actionMessage && <div className="action-feedback" role="status">{actionMessage}<button type="button" aria-label="Dismiss" onClick={() => setActionMessage("")}>×</button></div>}
      {view === "Overview" && <Overview data={currentData} currencyCode={currentPreferences.currency_code} onViewAll={() => setView("Stringings")} />}
      {view === "Rackets" && <RacketsView data={currentData} onAction={handleAction} />}
      {view === "Stringings" && <StringingsView data={currentData} onAction={handleAction} />}
      {view === "Strings" && <StringsView data={currentData} onAction={handleAction} />}
      {view === "Profile" && <ProfileView profileName={profileName} email={email} preferences={currentPreferences} preview={preview} saved={saved} />}
      <footer className="app-footer">Tennis Tracker <span>·</span> Equipment, strings and restringing history</footer>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation">
      {views.map((item) => <button type="button" key={item.name} className={view === item.name ? "mobile-nav-item selected" : "mobile-nav-item"} onClick={() => setView(item.name)}><span className="mobile-nav-icon">{item.icon}</span><span>{item.name}</span></button>)}
    </nav>
  </main>;
}

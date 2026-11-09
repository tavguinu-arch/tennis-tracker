"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardSnapshot, RacketSummary, StringingSummary } from "@/lib/tennis/dashboard";
import { formatCurrency } from "@/lib/tennis/dashboard";
import { saveProfileSettings, signOut } from "@/app/auth/actions";
import { createTennisRecord, type RecordActionState } from "@/app/tennis/actions";

type View = "Overview" | "Rackets" | "Stringings" | "Strings" | "Profile";

const views: { name: View; icon: string }[] = [
  { name: "Overview", icon: "▦" },
  { name: "Rackets", icon: "⌁" },
  { name: "Stringings", icon: "⚒" },
  { name: "Strings", icon: "♜" },
];

const previewRackets: RacketSummary[] = [
  { id: 1, modelId: 1, purchaseDate: "2026-09-29", priceValue: 137.92, isActive: true, notes: null, name: "Raquete 1", model: "Tecnifibre TFight 300", bought: "29 Sep 2026", price: "€137.92" },
  { id: 2, modelId: 1, purchaseDate: "2026-10-06", priceValue: 156.66, isActive: true, notes: null, name: "Raquete 2", model: "Tecnifibre TFight 300", bought: "6 Oct 2026", price: "€156.66" },
  { id: 3, modelId: 1, purchaseDate: "2026-10-06", priceValue: 156.66, isActive: true, notes: null, name: "Raquete 3", model: "Tecnifibre TFight 300", bought: "6 Oct 2026", price: "€156.66" },
];

const previewStringings: StringingSummary[] = [
  { id: 1, racketId: 3, mainReelId: 1, crossReelId: 1, stringerId: null, stringingDate: "2026-10-07", mainTension: 23, crossTension: 23, mainUnit: "kg", crossUnit: "kg", serviceCost: null, hoursPlayed: null, replacementReason: null, notes: null, date: "7 Oct 2026", racket: "Raquete 3", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
  { id: 2, racketId: 2, mainReelId: 1, crossReelId: 1, stringerId: null, stringingDate: "2026-10-07", mainTension: 23, crossTension: 23, mainUnit: "kg", crossUnit: "kg", serviceCost: null, hoursPlayed: null, replacementReason: null, notes: null, date: "7 Oct 2026", racket: "Raquete 2", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
  { id: 3, racketId: 3, mainReelId: 1, crossReelId: 1, stringerId: null, stringingDate: "2026-10-07", mainTension: 23, crossTension: 23, mainUnit: "kg", crossUnit: "kg", serviceCost: null, hoursPlayed: null, replacementReason: null, notes: null, date: "7 Oct 2026", racket: "Raquete 3", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
  { id: 4, racketId: 2, mainReelId: 1, crossReelId: 1, stringerId: null, stringingDate: "2026-10-07", mainTension: 23, crossTension: 23, mainUnit: "kg", crossUnit: "kg", serviceCost: null, hoursPlayed: null, replacementReason: null, notes: null, date: "7 Oct 2026", racket: "Raquete 2", string: "Solinco Hyper-G Soft 1.20", tension: "23 kg / 23 kg", stringer: "—" },
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

type EditableRecord = { kind: RecordKind; id: number; values: Record<string, string | number | boolean | null> };

function RacketsView({ data, onAction, onEdit }: { data: DashboardSnapshot; onAction: (label: string) => void; onEdit: (record: EditableRecord) => void }) {
  const editModel = (id: number) => { const row = data.racketModels.find((item) => item.id === id)!; onEdit({ kind: "model", id, values: { brand: row.brand, model_name: row.name, head_size: row.headSize, weight_grams: row.weightGrams, string_pattern: row.stringPattern, notes: row.notes } }); };
  return <>
    <PageTitle title="Rackets" actions={<><ActionButton secondary onClick={() => onAction("New model")}>New model</ActionButton><ActionButton onClick={() => onAction("New racket")}>＋ New racket</ActionButton></>} />
    <section className="data-section"><DataTable headers={["Racket", "Model", "Bought", "Price"]} rows={data.rackets.map((r) => [r.name, r.model, r.bought, r.price])} onEdit={(i) => { const r = data.rackets[i]; onEdit({ kind: "racket", id: r.id, values: { identifier: r.name, model_id: r.modelId, purchase_date: r.purchaseDate, price: r.priceValue, is_active: r.isActive, notes: r.notes } }); }} /></section>
    <section className="strings-section type-section"><div className="section-heading"><div><h2>Racket models</h2></div></div><div className="data-section"><DataTable headers={["Brand", "Model", "Head size", "Weight", "Pattern"]} rows={data.racketModels.map((m) => [m.brand, m.name, m.headSize === null ? "—" : String(m.headSize), m.weightGrams === null ? "—" : String(m.weightGrams), m.stringPattern])} onEdit={(i) => editModel(data.racketModels[i].id)} /></div></section>
    <div className="footnote">{data.rackets.length} rackets <span>·</span> Your current racket lineup</div>
  </>;
}

function StringingsView({ data, onAction, onEdit, onEditStringer }: { data: DashboardSnapshot; onAction: (label: string) => void; onEdit: (row: StringingSummary) => void; onEditStringer: (record: EditableRecord) => void }) {
  return <>
    <PageTitle title="Stringings" actions={<><ActionButton secondary onClick={() => onAction("New stringer")}>New stringer</ActionButton><ActionButton onClick={() => onAction("New stringing")}>＋ New stringing</ActionButton></>} />
    <section className="data-section"><StringingTable rows={data.stringings} onEdit={onEdit} /></section>
    <section className="strings-section type-section"><div className="section-heading"><div><h2>Stringers</h2></div></div><div className="data-section"><DataTable headers={["Name"]} rows={data.stringers.map((s) => [s.name])} onEdit={(i) => { const s = data.stringers[i]; onEditStringer({ kind: "stringer", id: s.id, values: { name: s.name, notes: s.notes } }); }} /></div></section>
    <div className="footnote">Showing recent sessions <span>·</span> {data.stringingsCount} stringings total</div>
  </>;
}

function StringsView({ data, onAction, onEdit }: { data: DashboardSnapshot; onAction: (label: string) => void; onEdit: (record: EditableRecord) => void }) {
  return <>
    <PageTitle title="Strings" actions={<><ActionButton secondary onClick={() => onAction("New string")}>New string</ActionButton><ActionButton onClick={() => onAction("New reel")}>＋ New reel</ActionButton></>} />
    <section className="strings-section">
      <div className="section-heading"><div><h2>Reels</h2><p>A reel holds about 17 stringings (16 to 18). Each stringing uses 0.5 of the reel for mains and 0.5 for crosses, so a full bed from one reel uses 1. Select a row to edit it.</p></div></div>
      <div className="data-section"><DataTable headers={["Reel", "Bought", "Price", "Used for mains"]} rows={data.reels.map((reel) => [reel.name, reel.bought, reel.price, reel.usedForMains])} onEdit={(i) => { const r = data.reels[i]; onEdit({ kind: "reel", id: r.id, values: { string_id: r.stringId, purchase_date: r.purchaseDate, price: r.priceValue, total_stringings: r.totalStringingsValue, notes: r.notes } }); }} /></div>
    </section>
    <section className="strings-section type-section">
      <div className="section-heading"><div><h2>String types</h2></div></div>
      <div className="data-section"><DataTable headers={["Brand", "String", "Type", "Gauge"]} rows={data.strings.map((item) => [item.brand, item.name, item.type, item.gauge])} onEdit={(i) => { const s = data.strings[i]; onEdit({ kind: "string", id: s.id, values: { brand: s.brand, name: s.name, type: s.type, gauge: s.gauge } }); }} /></div>
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

function DataTable({ headers, rows, onEdit }: { headers: string[]; rows: (string | null)[][]; onEdit?: (index: number) => void }) {
  return <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}<span className="sort-mark">↕</span> </th>)}{onEdit && <th>Actions</th>}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}{onEdit && <td><button type="button" className="text-link" onClick={() => onEdit(rowIndex)}>Edit</button></td>}</tr>)}</tbody></table></div>;
}

function StringingTable({ rows, compact = false, onEdit }: { rows: StringingSummary[]; compact?: boolean; onEdit?: (row: StringingSummary) => void }) {
  return <div className="table-scroll"><table className={compact ? "stringing-table compact" : "stringing-table"}><thead><tr>{["Date", "Racket", "String", "Tension (main / cross)", "Stringer", ...(onEdit ? ["Actions"] : [])].map((header) => <th key={header}>{header}{header !== "Actions" && <span className="sort-mark">↕</span>}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row.id}-${rowIndex}`}><td>{row.date}</td><td>{row.racket}</td><td>{row.string}</td><td>{row.tension}</td><td>{row.stringer}</td>{onEdit && <td><button type="button" className="text-link" onClick={() => onEdit(row)}>Edit</button></td>}</tr>)}</tbody></table></div>;
}

type RecordKind = "model" | "racket" | "stringer" | "stringing" | "string" | "reel";

const recordLabels: Record<RecordKind, string> = {
  model: "New racket model",
  racket: "New racket",
  stringer: "New stringer",
  stringing: "New stringing",
  string: "New string",
  reel: "New reel",
};

function RecordDialog({ kind, data, onClose, editing }: { kind: RecordKind; data: DashboardSnapshot; onClose: () => void; editing?: EditableRecord }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<RecordActionState, FormData>(createTennisRecord, {});
  useEffect(() => {
    if (state.success) {
      onClose();
      router.refresh();
    }
  }, [state.success, onClose, router]);
  const value = (key: string, fallback: string | number = ""): string | number => {
    const current = editing?.values[key];
    return current === null || typeof current === "boolean" || current === undefined ? fallback : current;
  };

  return <div className="record-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
      <div className="record-dialog-heading"><div><span>PLAYER RECORD</span><h2 id="record-dialog-title">{editing ? `Edit ${kind}` : recordLabels[kind]}</h2></div><button type="button" className="record-dialog-close" aria-label="Close" onClick={onClose}>×</button></div>
      <form action={formAction} className="record-form">
        <input type="hidden" name="kind" value={kind} />
        {editing && <input type="hidden" name="record_id" value={editing.id} />}
        {kind === "model" && <>
          <label>Brand<input name="brand" required maxLength={100} placeholder="e.g. Tecnifibre" defaultValue={value("brand")} /></label>
          <label>Model name<input name="model_name" required maxLength={120} placeholder="e.g. TFight 300" defaultValue={value("model_name")} /></label>
          <div className="record-form-row"><label>Head size (in²)<input name="head_size" type="number" min="0" step="any" defaultValue={value("head_size")} /></label><label>Weight (g)<input name="weight_grams" type="number" min="0" step="any" defaultValue={value("weight_grams")} /></label></div>
          <label>String pattern<input name="string_pattern" maxLength={30} placeholder="e.g. 16×19" defaultValue={value("string_pattern")} /></label>
          <label>Notes<textarea name="notes" maxLength={1000} rows={2} defaultValue={value("notes")} /></label>
        </>}
        {kind === "racket" && <>
          <label>Racket identifier<input name="identifier" required maxLength={80} placeholder="e.g. Racket 4" defaultValue={value("identifier")} /></label>
          <label>Model<select name="model_id" defaultValue={value("model_id")}><option value="">Choose a model</option>{data.racketModels.map((model) => <option key={model.id} value={model.id}>{model.brand} {model.name}</option>)}</select></label>
          <div className="record-form-row"><label>Purchase date<input name="purchase_date" type="date" defaultValue={value("purchase_date")} /></label><label>Price (€)<input name="price" type="number" min="0" step="0.01" defaultValue={value("price")} /></label></div>
          <label className="record-checkbox"><input type="checkbox" name="is_active" defaultChecked={editing ? editing.values.is_active === true : true} /> Active racket</label>
          <label>Notes<textarea name="notes" maxLength={1000} rows={2} defaultValue={value("notes")} /></label>
        </>}
        {kind === "stringer" && <>
          <label>Name<input name="name" required maxLength={120} placeholder="Stringer name" defaultValue={value("name")} /></label>
          <label>Notes<textarea name="notes" maxLength={1000} rows={3} defaultValue={value("notes")} /></label>
        </>}
        {kind === "string" && <>
          <div className="record-form-row"><label>Brand<input name="brand" required maxLength={100} placeholder="e.g. Solinco" defaultValue={value("brand")} /></label><label>String name<input name="name" required maxLength={120} placeholder="e.g. Hyper-G Soft" defaultValue={value("name")} /></label></div>
          <div className="record-form-row"><label>Type<input name="type" maxLength={80} placeholder="e.g. Polyester" defaultValue={value("type")} /></label><label>Gauge<input name="gauge" maxLength={30} placeholder="e.g. 1.20" defaultValue={value("gauge")} /></label></div>
        </>}
        {kind === "reel" && <>
          <label>String<select name="string_id" required defaultValue={value("string_id")}><option value="">Choose a string</option>{data.strings.map((string) => <option key={string.id} value={string.id}>{string.brand} {string.name} {string.gauge}</option>)}</select></label>
          <div className="record-form-row"><label>Purchase date<input name="purchase_date" type="date" defaultValue={value("purchase_date")} /></label><label>Price (€)<input name="price" type="number" min="0" step="0.01" defaultValue={value("price")} /></label></div>
          <label>Capacity (full stringings)<input name="total_stringings" type="number" required min="1" step="1" defaultValue={value("total_stringings", 17)} /></label>
          <label>Notes<textarea name="notes" maxLength={1000} rows={2} defaultValue={value("notes")} /></label>
        </>}
        {kind === "stringing" && <>
          <label>Racket<select name="racket_id" required defaultValue={value("racket_id")}><option value="">Choose a racket</option>{data.rackets.map((racket) => <option key={racket.id} value={racket.id}>{racket.name} · {racket.model}</option>)}</select></label>
          <div className="record-form-row"><label>Main reel<select name="main_reel_id" required defaultValue={value("main_reel_id")}><option value="">Choose a reel</option>{data.reels.map((reel) => <option key={reel.id} value={reel.id}>{reel.name}</option>)}</select></label><label>Cross reel<select name="cross_reel_id" required defaultValue={value("cross_reel_id")}><option value="">Choose a reel</option>{data.reels.map((reel) => <option key={reel.id} value={reel.id}>{reel.name}</option>)}</select></label></div>
          <div className="record-form-row"><label>Main tension<input name="main_tension_kg" type="number" required min="1" step="0.1" defaultValue={value("main_tension_kg", 23)} /></label><label>Unit<select name="main_tension_unit" defaultValue={value("main_tension_unit", "kg")}><option value="kg">kg</option><option value="lb">lb</option></select></label></div>
          <div className="record-form-row"><label>Cross tension<input name="cross_tension_kg" type="number" required min="1" step="0.1" defaultValue={value("cross_tension_kg", 23)} /></label><label>Unit<select name="cross_tension_unit" defaultValue={value("cross_tension_unit", "kg")}><option value="kg">kg</option><option value="lb">lb</option></select></label></div>
          <div className="record-form-row"><label>Stringer<select name="stringer_id" defaultValue={value("stringer_id")}><option value="">Not specified</option>{data.stringers.map((stringer) => <option key={stringer.id} value={stringer.id}>{stringer.name}</option>)}</select></label><label>Date<input name="stringing_date" type="date" defaultValue={value("stringing_date")} /></label></div>
          <div className="record-form-row"><label>Service cost (€)<input name="service_cost" type="number" min="0" step="0.01" defaultValue={value("service_cost")} /></label><label>Hours played<input name="hours_played" type="number" min="0" step="0.5" defaultValue={value("hours_played")} /></label></div>
          <label>Replacement reason<input name="replacement_reason" maxLength={120} placeholder="Optional" defaultValue={value("replacement_reason")} /></label>
          <label>Notes<textarea name="notes" maxLength={1000} rows={2} defaultValue={value("notes")} /></label>
        </>}
        {state.error && <p className="record-form-error" role="alert">{state.error}</p>}
        <div className="record-form-actions"><button type="button" className="action-button secondary" onClick={onClose}>Cancel</button><button type="submit" className="action-button primary" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Save record"}</button></div>
      </form>
    </section>
  </div>;
}

export default function DashboardClient({ data, profileName, email = "", preferences, saved = false, profileError = null, loadError = null }: { data: DashboardSnapshot | null; profileName: string; email?: string; preferences?: ProfilePreferences; saved?: boolean; profileError?: string | null; loadError?: string | null }) {
  const [view, setView] = useState<View>("Overview");
  const [recordKind, setRecordKind] = useState<RecordKind | null>(null);
  const [editingRecord, setEditingRecord] = useState<EditableRecord | undefined>();
  const preview = data === null;
  const currentData: DashboardSnapshot = data ?? {
    activeRackets: 3,
    stringingsCount: 15,
    racketSpend: 451.24,
    stringSpend: 95,
    serviceSpend: 75,
    rackets: previewRackets,
    stringings: previewStringings,
    reels: [{ id: 1, stringId: 1, purchaseDate: "2026-09-21", priceValue: 95, totalStringingsValue: 17, notes: null, name: "Solinco Hyper-G Soft 1.20", bought: "21 Sep 2026", price: "€95.00", usedForMains: "15" }],
    strings: [{ id: 1, brand: "Solinco", name: "Hyper-G Soft", type: "Polyester", gauge: "1.20" }],
    racketModels: [{ id: 1, brand: "Tecnifibre", name: "TFight 300", headSize: 100, weightGrams: 300, stringPattern: "16x19", notes: null }],
    stringers: [],
  };
  const currentPreferences = preferences ?? { locale: "en-GB", currency_code: "EUR", timezone: "Europe/Lisbon", preferred_tension_unit: "kg", theme: "system" };
  const handleAction = (label: string) => {
    const kindByLabel: Record<string, RecordKind> = { "New model": "model", "New racket": "racket", "New stringer": "stringer", "New stringing": "stringing", "New string": "string", "New reel": "reel" };
    const kind = kindByLabel[label];
    if (kind) setRecordKind(kind);
  };
  return <main className="app-shell">
    <Header view={view} setView={setView} preview={preview} profileName={profileName} />
    <div className="main-content"><PreviewNotice preview={preview} loadError={loadError} />
      {!preview && !loadError && currentData.rackets.length === 0 && currentData.stringingsCount === 0 && <div className="empty-account-note">Your account is ready. No tennis records are assigned to it yet.</div>}
      {profileError && <div className="action-feedback" role="alert">{profileError === "invalid-settings" ? "One or more preferences are not valid." : "Your preferences could not be saved."}</div>}
      {view === "Overview" && <Overview data={currentData} currencyCode={currentPreferences.currency_code} onViewAll={() => setView("Stringings")} />}
      {view === "Rackets" && <RacketsView data={currentData} onAction={handleAction} onEdit={(record) => { setEditingRecord(record); setRecordKind(record.kind); }} />}
      {view === "Stringings" && <StringingsView data={currentData} onAction={handleAction} onEdit={(row) => { setEditingRecord({ kind: "stringing", id: row.id, values: { racket_id: row.racketId, main_reel_id: row.mainReelId, cross_reel_id: row.crossReelId, stringer_id: row.stringerId, main_tension_kg: row.mainTension, cross_tension_kg: row.crossTension, main_tension_unit: row.mainUnit, cross_tension_unit: row.crossUnit, service_cost: row.serviceCost, hours_played: row.hoursPlayed, stringing_date: row.stringingDate, replacement_reason: row.replacementReason, notes: row.notes } }); setRecordKind("stringing"); }} onEditStringer={(record) => { setEditingRecord(record); setRecordKind(record.kind); }} />}
      {view === "Strings" && <StringsView data={currentData} onAction={handleAction} onEdit={(record) => { setEditingRecord(record); setRecordKind(record.kind); }} />}
      {view === "Profile" && <ProfileView profileName={profileName} email={email} preferences={currentPreferences} preview={preview} saved={saved} />}
      <footer className="app-footer">Tennis Tracker <span>·</span> Equipment, strings and restringing history</footer>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation">
      {views.map((item) => <button type="button" key={item.name} className={view === item.name ? "mobile-nav-item selected" : "mobile-nav-item"} onClick={() => setView(item.name)}><span className="mobile-nav-icon">{item.icon}</span><span>{item.name}</span></button>)}
    </nav>
    {recordKind && <RecordDialog kind={recordKind} data={currentData} editing={editingRecord} onClose={() => { setRecordKind(null); setEditingRecord(undefined); }} />}
  </main>;
}

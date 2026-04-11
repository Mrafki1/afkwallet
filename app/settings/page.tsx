"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase";

export default function SettingsPage() {
  const router  = useRouter();
  const supabase = createClient();

  const [loading, setLoading]       = useState(true);
  const [userEmail, setUserEmail]   = useState("");
  const [userId, setUserId]         = useState("");

  // Email update
  const [newEmail, setNewEmail]         = useState("");
  const [emailSaving, setEmailSaving]   = useState(false);
  const [emailMsg, setEmailMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  // Password update
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving]               = useState(false);
  const [pwMsg, setPwMsg]                     = useState<{ ok: boolean; text: string } | null>(null);

  // Notification prefs
  const [notifPrefs, setNotifPrefs]   = useState({ msr_reminder: true, fee_reminder: true });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg]       = useState<string | null>(null);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting]           = useState(false);
  const [deleteMsg, setDeleteMsg]         = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserEmail(user.email ?? "");
      setNewEmail(user.email ?? "");
      setUserId(user.id);
      const { data: prefs } = await supabase
        .from("user_notification_prefs")
        .select("msr_reminder, fee_reminder")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prefs) setNotifPrefs({ msr_reminder: prefs.msr_reminder, fee_reminder: prefs.fee_reminder });
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    if (newEmail === userEmail) { setEmailMsg({ ok: false, text: "That's already your email." }); return; }
    setEmailSaving(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailMsg({ ok: false, text: error.message });
    } else {
      setEmailMsg({ ok: true, text: "Confirmation email sent to your new address. Check your inbox." });
    }
    setEmailSaving(false);
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMsg({ ok: false, text: "Passwords don't match." }); return; }
    if (newPassword.length < 8) { setPwMsg({ ok: false, text: "Password must be at least 8 characters." }); return; }
    setPwSaving(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMsg({ ok: false, text: error.message });
    } else {
      setPwMsg({ ok: true, text: "Password updated." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setPwSaving(false);
  }

  async function handleNotifToggle(key: "msr_reminder" | "fee_reminder") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    setNotifSaving(true);
    setNotifMsg(null);
    await supabase.from("user_notification_prefs").upsert({
      user_id: user.id, ...updated, updated_at: new Date().toISOString(),
    });
    setNotifSaving(false);
    setNotifMsg("Saved");
    setTimeout(() => setNotifMsg(null), 2000);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "delete my account") return;
    setDeleting(true);
    setDeleteMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDeleteMsg("Not logged in."); setDeleting(false); return; }
    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setDeleteMsg(json.error ?? "Something went wrong. Try again.");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/?deleted=1");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <p className="text-sm" style={{ color: "#94a3b8" }}>Loading…</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
        <nav className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>P</div>
            <span className="font-bold text-sm text-white">PointsBinder</span>
          </Link>
          <Link href="/dashboard" className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Dashboard
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pt-2 pb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            {userEmail}
          </p>
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>Account Settings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Email ── */}
        <section className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <h2 className="text-base font-bold mb-1" style={{ color: "#0f172a" }}>Email address</h2>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
            Changing your email will send a confirmation link to the new address.
          </p>
          <form onSubmit={handleEmailSave} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailMsg(null); }}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
            />
            {emailMsg && (
              <p className="text-xs font-medium" style={{ color: emailMsg.ok ? "#16a34a" : "#dc2626" }}>
                {emailMsg.text}
              </p>
            )}
            <div>
              <button
                type="submit"
                disabled={emailSaving || newEmail === userEmail}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#2563eb" }}
              >
                {emailSaving ? "Saving…" : "Update email"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Password ── */}
        <section className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <h2 className="text-base font-bold mb-1" style={{ color: "#0f172a" }}>Change password</h2>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>Must be at least 8 characters.</p>
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPwMsg(null); }}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setPwMsg(null); }}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
                />
              </div>
            </div>
            {pwMsg && (
              <p className="text-xs font-medium" style={{ color: pwMsg.ok ? "#16a34a" : "#dc2626" }}>
                {pwMsg.text}
              </p>
            )}
            <div>
              <button
                type="submit"
                disabled={pwSaving || !newPassword}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#2563eb" }}
              >
                {pwSaving ? "Saving…" : "Update password"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Notifications ── */}
        <section className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Email notifications</h2>
            {notifSaving
              ? <span className="text-xs" style={{ color: "#94a3b8" }}>Saving…</span>
              : notifMsg
              ? <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>{notifMsg}</span>
              : null}
          </div>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
            Choose which reminder emails you want to receive.
          </p>
          <div className="flex flex-col gap-1">
            {([
              { key: "msr_reminder" as const, label: "MSR deadline reminder", desc: "Email 7 days before a minimum spend deadline is due" },
              { key: "fee_reminder" as const, label: "Annual fee reminder",    desc: "Email 30 days before an annual fee is charged" },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-4"
                style={{ borderTop: "1px solid #f1f5f9" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotifToggle(key)}
                  className="relative shrink-0 rounded-full transition-colors duration-200"
                  style={{ width: 44, height: 24, background: notifPrefs[key] ? "#2563eb" : "#e2e8f0" }}
                  aria-label={notifPrefs[key] ? `Disable ${label}` : `Enable ${label}`}
                >
                  <span
                    className="absolute top-0.5 rounded-full transition-all duration-200"
                    style={{
                      width: 20, height: 20,
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      left: notifPrefs[key] ? 22 : 2,
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: "#cbd5e1" }}>
            You can also unsubscribe from any reminder email via the unsubscribe link at the bottom of each email.
          </p>
        </section>

        {/* ── Danger zone ── */}
        <section className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #fecaca" }}>
          <h2 className="text-base font-bold mb-1" style={{ color: "#b91c1c" }}>Delete account</h2>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
            Permanently deletes your account and all tracked card data. This cannot be undone.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>
                Type <span className="font-mono font-bold" style={{ color: "#0f172a" }}>delete my account</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => { setDeleteConfirm(e.target.value); setDeleteMsg(null); }}
                placeholder="delete my account"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: "1px solid #fecaca", background: "#fff5f5" }}
              />
            </div>
            {deleteMsg && (
              <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{deleteMsg}</p>
            )}
            <div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== "delete my account"}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#dc2626" }}
              >
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

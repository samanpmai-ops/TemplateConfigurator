import React, { useState, useRef, useMemo, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Mail, MessageSquare, Bell, Phone, Search, Plus, Check, X, AlertTriangle,
  Send, History, Lock, Power, Zap, Droplet, Flame, Sun, Car, Users, Layers,
  RotateCcw, Clock, Shield, Filter, Braces, FileText, Info, Play, CheckCircle2,
  ArrowLeft, Pencil, ChevronRight, Copy,
} from "lucide-react";

/* ----------------------------------------------------------------------------
   SmartBX — Notification Template Studio (prototype)
   Single-file demo. State held in memory only (no browser storage).
---------------------------------------------------------------------------- */

const CHANNELS = {
  email: { label: "Email", icon: Mail, tint: "text-sky-600", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
  sms: { label: "SMS", icon: MessageSquare, tint: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  push: { label: "Push", icon: Bell, tint: "text-violet-600", chip: "bg-violet-50 text-violet-700 ring-violet-200" },
  voice: { label: "Robocall", icon: Phone, tint: "text-amber-600", chip: "bg-amber-50 text-amber-700 ring-amber-200" },
};

const UTILITIES = {
  power: { label: "Power", icon: Zap }, water: { label: "Water", icon: Droplet },
  gas: { label: "Gas", icon: Flame }, solar: { label: "Solar", icon: Sun }, ev: { label: "EV", icon: Car },
};

const PERSONAS = ["Residential", "Commercial", "Landlord"];
const CATEGORIES = ["Billing", "Payment", "Outage", "Service", "Onboarding", "Usage"];

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  inactive: { label: "Inactive", cls: "bg-slate-200 text-slate-600 ring-slate-300" },
  draft: { label: "Draft", cls: "bg-amber-100 text-amber-800 ring-amber-300" },
};

const INHERIT = {
  base: { label: "Base template", note: "System default. Every persona inherits from this unless overridden." },
  shared: { label: "Shared variant", note: "One source of truth linked to several personas. Edit once, applies everywhere." },
  override: { label: "Persona override", note: "Branches from the base for this persona only. Other personas are untouched." },
};

/* ---- Variable registry (the catalog clients pick from) --------------------- */
const ALL = ["email", "sms", "push", "voice"];
const REGISTRY = [
  { key: "customer.firstName", label: "Customer first name", sample: "Maria", group: "Customer", channels: ALL, categories: ["*"] },
  { key: "customer.lastName", label: "Customer last name", sample: "Alvarez", group: "Customer", channels: ALL, categories: ["*"] },
  { key: "account.number", label: "Account number", sample: "AC‑4480912", group: "Account", channels: ALL, categories: ["*"] },
  { key: "account.serviceAddress", label: "Service address", sample: "1420 Cedar Ln", group: "Account", channels: ["email", "push"], categories: ["*"] },
  { key: "bill.amount", label: "Bill amount", sample: "$142.38", group: "Billing", channels: ALL, categories: ["Billing", "Payment"] },
  { key: "bill.dueDate", label: "Bill due date", sample: "Jun 28, 2026", group: "Billing", channels: ALL, categories: ["Billing", "Payment"] },
  { key: "invoice.link", label: "Invoice link", sample: "swgas.com/i/9921", group: "Billing", channels: ["email", "push"], categories: ["Billing"] },
  { key: "payment.amount", label: "Payment amount", sample: "$142.38", group: "Payment", channels: ALL, categories: ["Payment", "Billing"] },
  { key: "payment.confirmation", label: "Confirmation #", sample: "PMT‑99214", group: "Payment", channels: ALL, categories: ["Payment"] },
  { key: "payment.method", label: "Payment method", sample: "Visa •4821", group: "Payment", channels: ["email", "push"], categories: ["Payment"] },
  { key: "outage.area", label: "Affected area", sample: "Cedar Heights", group: "Outage", channels: ALL, categories: ["Outage"] },
  { key: "outage.eta", label: "Restoration ETA", sample: "4:30 PM", group: "Outage", channels: ALL, categories: ["Outage"] },
  { key: "outage.cause", label: "Cause", sample: "equipment fault", group: "Outage", channels: ["email", "push"], categories: ["Outage"] },
  { key: "service.requestId", label: "Request ID", sample: "SR‑20817", group: "Service", channels: ALL, categories: ["Service"] },
  { key: "service.window", label: "Appointment window", sample: "8 AM – 12 PM", group: "Service", channels: ALL, categories: ["Service"] },
  { key: "service.technician", label: "Technician", sample: "Devon R.", group: "Service", channels: ["email", "push", "voice"], categories: ["Service"] },
  { key: "brand.companyName", label: "Company name", sample: "Utility", group: "Branding", channels: ALL, categories: ["*"] },
  { key: "brand.supportPhone", label: "Support phone", sample: "1‑877‑860‑6020", group: "Branding", channels: ALL, categories: ["*"] },
  { key: "regulatory.unsubscribe", label: "Unsubscribe link", sample: "Unsubscribe", group: "Regulatory", channels: ["email"], categories: ["*"] },
  { key: "regulatory.optOut", label: "Opt‑out notice", sample: "Reply STOP to opt out", group: "Regulatory", channels: ["sms", "voice"], categories: ["*"] },
];
const REG_MAP = Object.fromEntries(REGISTRY.map((v) => [v.key, v]));

/* ---- Seed templates -------------------------------------------------------- */
const seed = [
  {
    id: "t1", name: "Payment confirmation", category: "Payment", channel: "email",
    personas: ["Residential", "Commercial"], utilities: ["power", "gas"], status: "active",
    inheritance: "shared", locked: false, requiredVars: ["payment.amount", "payment.confirmation"],
    subject: "Payment received — {{payment.confirmation}}",
    content: "Hi {{customer.firstName}},\n\nWe've received your payment of {{payment.amount}} on account {{account.number}}. Your confirmation number is {{payment.confirmation}}.\n\nThanks for choosing {{brand.companyName}}.\n\n{{regulatory.unsubscribe}}",
    version: 7,
    versions: [
      { v: 7, status: "active", by: "client.admin@swgas", at: "Jun 14, 2026 · 9:12 AM", note: "Added confirmation # to subject" },
      { v: 6, status: "archived", by: "client.admin@swgas", at: "May 30, 2026 · 2:40 PM", note: "Reworded greeting" },
      { v: 5, status: "archived", by: "vendor.pm@sew", at: "May 2, 2026 · 11:05 AM", note: "Base rollout" },
    ],
  },
  {
    id: "t2", name: "Payment confirmation", category: "Payment", channel: "sms",
    personas: ["Residential"], utilities: ["power", "gas"], status: "active",
    inheritance: "shared", locked: false, requiredVars: ["payment.amount", "regulatory.optOut"],
    subject: "", senderId: "SWGAS",
    content: "{{brand.companyName}}: Payment of {{payment.amount}} received. Conf {{payment.confirmation}}. {{regulatory.optOut}}",
    version: 4,
    versions: [
      { v: 4, status: "active", by: "client.admin@swgas", at: "Jun 10, 2026 · 4:01 PM", note: "Tightened to 1 segment" },
      { v: 3, status: "archived", by: "vendor.pm@sew", at: "May 2, 2026 · 11:05 AM", note: "Base rollout" },
    ],
  },
  {
    id: "t3", name: "Outage alert", category: "Outage", channel: "sms",
    personas: ["Residential", "Commercial", "Landlord"], utilities: ["power"], status: "active",
    inheritance: "base", locked: true, requiredVars: ["outage.area", "outage.eta", "regulatory.optOut"],
    subject: "", senderId: "SWPWR",
    content: "{{brand.companyName}} outage in {{outage.area}}. Crews are responding. Estimated restoration {{outage.eta}}. {{regulatory.optOut}}",
    version: 11,
    versions: [
      { v: 11, status: "active", by: "vendor.pm@sew", at: "Jun 1, 2026 · 8:00 AM", note: "Locked — regulatory critical" },
      { v: 10, status: "archived", by: "vendor.pm@sew", at: "Apr 18, 2026 · 9:30 AM", note: "ETA wording" },
    ],
  },
  {
    id: "t4", name: "Outage restored", category: "Outage", channel: "push",
    personas: ["Residential"], utilities: ["power"], status: "active",
    inheritance: "override", locked: false, requiredVars: ["outage.area"],
    pushTitle: "Power restored", subject: "",
    content: "Service in {{outage.area}} is back on. Thanks for your patience, {{customer.firstName}}.",
    version: 3,
    versions: [
      { v: 3, status: "active", by: "client.admin@swgas", at: "Jun 8, 2026 · 1:22 PM", note: "Friendlier copy" },
      { v: 2, status: "archived", by: "vendor.pm@sew", at: "Apr 18, 2026 · 9:35 AM", note: "Base rollout" },
    ],
  },
  {
    id: "t5", name: "Bill ready", category: "Billing", channel: "email",
    personas: ["Residential"], utilities: ["power", "water", "gas"], status: "draft",
    inheritance: "override", locked: false, requiredVars: ["bill.amount", "bill.dueDate"],
    subject: "Your {{brand.companyName}} bill is ready",
    content: "Hi {{customer.firstName}},\n\nYour bill of {{bill.amount}} is due {{bill.dueDate}}. View it here: {{invoice.link}}\n\nQuestions? Call {{brand.supportPhone}}.\n\n{{regulatory.unsubscribe}}",
    version: 2,
    versions: [
      { v: 2, status: "draft", by: "client.admin@swgas", at: "Jun 18, 2026 · 10:14 AM", note: "Draft — pending review" },
      { v: 1, status: "archived", by: "vendor.pm@sew", at: "May 2, 2026 · 11:05 AM", note: "Base rollout" },
    ],
  },
  {
    id: "t6", name: "Appointment reminder", category: "Service", channel: "voice",
    personas: ["Residential"], utilities: ["water"], status: "active",
    inheritance: "shared", locked: false, requiredVars: ["service.window", "regulatory.optOut"],
    subject: "", voice: "Joanna (en‑US)", dtmf: ["1 — Confirm", "2 — Reschedule", "9 — Repeat"],
    content: "Hello {{customer.firstName}}. This is a reminder from {{brand.companyName}} about your service appointment on request {{service.requestId}}, scheduled for {{service.window}}. Press 1 to confirm, 2 to reschedule. {{regulatory.optOut}}",
    version: 5,
    versions: [
      { v: 5, status: "active", by: "client.admin@swgas", at: "Jun 12, 2026 · 3:50 PM", note: "Added DTMF reschedule" },
    ],
  },
  {
    id: "t7", name: "Welcome", category: "Onboarding", channel: "email",
    personas: ["Residential"], utilities: ["power"], status: "inactive",
    inheritance: "base", locked: false, requiredVars: ["brand.companyName"],
    subject: "Welcome to {{brand.companyName}}",
    content: "Welcome aboard, {{customer.firstName}}! Your account {{account.number}} is ready.\n\n{{regulatory.unsubscribe}}",
    version: 1,
    versions: [{ v: 1, status: "inactive", by: "vendor.pm@sew", at: "Mar 9, 2026 · 9:00 AM", note: "Base rollout" }],
  },
];

/* ---- helpers --------------------------------------------------------------- */
const TOKEN_RE = /\{\{\s*([\w.]+)\s*\}\}/g;
const tokensIn = (s = "") => [...s.matchAll(TOKEN_RE)].map((m) => m[1]);

function resolveParts(text = "") {
  const parts = [];
  let last = 0;
  text.replace(TOKEN_RE, (full, key, idx) => {
    if (idx > last) parts.push({ t: "text", v: text.slice(last, idx) });
    const reg = REG_MAP[key];
    parts.push({ t: "var", key, v: reg ? reg.sample : `[unknown: ${key}]`, ok: !!reg });
    last = idx + full.length;
    return full;
  });
  if (last < text.length) parts.push({ t: "text", v: text.slice(last) });
  return parts;
}
const resolvePlain = (t = "") => resolveParts(t).map((p) => p.v).join("");

function validate(tpl, draft) {
  const errors = [], warnings = [];
  const channel = tpl.channel;
  const allowed = new Set(REGISTRY.filter((v) => v.channels.includes(channel)).map((v) => v.key));
  const used = tokensIn(draft.content).concat(tokensIn(draft.subject || ""));

  used.forEach((k) => {
    if (!REG_MAP[k]) errors.push(`Unknown variable {{${k}}} — not in the catalog.`);
    else if (!allowed.has(k)) errors.push(`{{${k}}} isn't allowed on ${CHANNELS[channel].label}.`);
  });
  (tpl.requiredVars || []).forEach((k) => {
    if (!used.includes(k)) errors.push(`Missing required variable: ${REG_MAP[k]?.label || k}.`);
  });
  if (!draft.content.trim()) errors.push("Message body is empty.");
  if (channel === "email" && !(draft.subject || "").trim()) errors.push("Email subject is required.");

  if (channel === "sms") {
    const len = resolvePlain(draft.content).length;
    const seg = len <= 160 ? 1 : Math.ceil(len / 153);
    if (seg > 1) warnings.push(`SMS expands to ${len} chars (${seg} segments). Each segment is billed separately.`);
  }
  return { errors, warnings };
}

/* ---- new-template defaults ------------------------------------------------ */
function requiredFor(channel, category) {
  const base = {
    Payment: ["payment.amount"], Billing: ["bill.amount", "bill.dueDate"],
    Outage: ["outage.area", "outage.eta"], Service: ["service.window"],
    Onboarding: ["brand.companyName"], Usage: [],
  }[category] || [];
  const optOut = channel === "sms" || channel === "voice" ? ["regulatory.optOut"] : [];
  return [...base, ...optOut];
}

function starterFor(channel, category) {
  const map = {
    Payment: { subject: "Payment received — {{payment.confirmation}}", title: "Payment received",
      long: "Hi {{customer.firstName}},\n\nWe've received your payment of {{payment.amount}} on account {{account.number}}.\n\nThanks for choosing {{brand.companyName}}.",
      short: "{{brand.companyName}}: payment of {{payment.amount}} received." },
    Billing: { subject: "Your {{brand.companyName}} bill is ready", title: "Bill ready",
      long: "Hi {{customer.firstName}},\n\nYour bill of {{bill.amount}} is due {{bill.dueDate}}.",
      short: "{{brand.companyName}}: bill of {{bill.amount}} due {{bill.dueDate}}." },
    Outage: { subject: "Service update for {{outage.area}}", title: "Outage update",
      long: "We're aware of an outage affecting {{outage.area}}. Estimated restoration is {{outage.eta}}.",
      short: "{{brand.companyName}}: outage in {{outage.area}}. ETA {{outage.eta}}." },
    Service: { subject: "Your appointment is confirmed", title: "Appointment reminder",
      long: "Hi {{customer.firstName}}, your appointment is scheduled for {{service.window}}.",
      short: "{{brand.companyName}}: appointment {{service.window}}." },
    Onboarding: { subject: "Welcome to {{brand.companyName}}", title: "Welcome",
      long: "Welcome, {{customer.firstName}}! Your account {{account.number}} is ready.",
      short: "Welcome to {{brand.companyName}}, {{customer.firstName}}!" },
    Usage: { subject: "A note about your usage", title: "Usage alert",
      long: "Hi {{customer.firstName}}, here's an update on account {{account.number}}.",
      short: "{{brand.companyName}}: usage update for {{account.number}}." },
  }[category] || { subject: "", title: "", long: "", short: "" };
  const isShort = channel !== "email";
  const footer = channel === "email" ? "\n\n{{regulatory.unsubscribe}}"
    : channel === "sms" || channel === "voice" ? " {{regulatory.optOut}}" : "";
  return {
    subject: channel === "email" ? map.subject : "",
    pushTitle: channel === "push" ? map.title : "",
    content: (isShort ? map.short : map.long) + footer,
  };
}

/* =========================================================================== */
export default function App() {
  const [templates, setTemplates] = useState(seed);
  const [view, setView] = useState("list");
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);

  const open = (id) => { setOpenId(id); setView("editor"); };
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const createTemplate = (tpl) => {
    setTemplates((ts) => [tpl, ...ts]);
    setCreating(false);
    setOpenId(tpl.id);
    setView("editor");
    flash("Draft created. Compose it, then publish when ready.");
  };

  const saveTemplate = (next) => setTemplates((ts) => ts.map((t) => (t.id === next.id ? next : t)));
  const toggleStatus = (id) =>
    setTemplates((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const status = t.status === "active" ? "inactive" : "active";
      return { ...t, status };
    }));

  const current = templates.find((t) => t.id === openId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      {/* top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-cyan-700 text-white shadow-sm">
          <Layers size={17} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight text-slate-900">SmartBX · Template Studio</div>
          <div className="text-[11px] text-slate-400">Notifications &nbsp;›&nbsp; Self‑service templates</div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500 ring-1 ring-slate-200">Tenant: Utility Gas</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
            <Shield size={12} /> Production‑safe mode
          </span>
        </div>
      </header>

      {view === "list" ? (
        <ListView templates={templates} onOpen={open} onToggle={toggleStatus} onNew={() => setCreating(true)} />
      ) : (
        <Editor key={current.id} tpl={current} onBack={() => setView("list")} onSave={saveTemplate} flash={flash} />
      )}

      {creating && <CreateWizard existing={templates} onCancel={() => setCreating(false)} onCreate={createTemplate} />}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg ring-1 ring-black/10">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-400" />{toast}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- LIST ---------------------------------- */
function ListView({ templates, onOpen, onToggle, onNew }) {
  const [q, setQ] = useState("");
  const [chan, setChan] = useState("all");
  const [stat, setStat] = useState("all");

  const rows = templates.filter((t) => {
    if (chan !== "all" && t.channel !== chan) return false;
    if (stat !== "all" && t.status !== stat) return false;
    if (q && !`${t.name} ${t.category} ${t.personas.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Templates</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Configure customer notifications across every channel. Drafts never touch production until you publish.</p>
        </div>
        <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-slate-800">
          <Plus size={15} /> New template
        </button>
      </div>

      {/* filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…"
            className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-[13px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
        </div>
        <Segmented value={chan} onChange={setChan}
          options={[["all", "All channels"], ...Object.entries(CHANNELS).map(([k, c]) => [k, c.label])]} />
        <Segmented value={stat} onChange={setStat}
          options={[["all", "Any status"], ["active", "Active"], ["draft", "Draft"], ["inactive", "Inactive"]]} />
        <span className="ml-auto text-[12px] text-slate-400">{rows.length} of {templates.length}</span>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Template</th>
              <th className="px-4 py-2.5 font-semibold">Channel</th>
              <th className="px-4 py-2.5 font-semibold">Personas</th>
              <th className="px-4 py-2.5 font-semibold">Utilities</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const C = CHANNELS[t.channel];
              return (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <button onClick={() => onOpen(t.id)} className="group flex items-start gap-2 text-left">
                      <div className="mt-0.5">
                        {t.locked
                          ? <Lock size={14} className="text-slate-400" />
                          : <FileText size={14} className="text-slate-300" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-teal-700">{t.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">{t.category}</span>
                          <span>·</span><span>v{t.version}</span>
                          <span>·</span><span className="italic">{INHERIT[t.inheritance].label}</span>
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ring-1 ${C.chip}`}>
                      <C.icon size={13} /> {C.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                      <Users size={12} className="text-slate-400" />
                      {t.personas.length > 1 ? `${t.personas.length} personas` : t.personas[0]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {t.utilities.map((u) => {
                        const U = UTILITIES[u];
                        return <span key={u} title={U.label} className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-500"><U.icon size={12} /></span>;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status !== "draft" && (
                        <button onClick={() => onToggle(t.id)} disabled={t.locked}
                          title={t.locked ? "Critical template — can't be deactivated" : t.status === "active" ? "Deactivate" : "Activate"}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ${
                            t.locked ? "cursor-not-allowed text-slate-300 ring-slate-200"
                            : t.status === "active" ? "text-slate-600 ring-slate-200 hover:bg-slate-100"
                            : "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"}`}>
                          <Power size={12} /> {t.status === "active" ? "On" : "Off"}
                        </button>
                      )}
                      <button onClick={() => onOpen(t.id)} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800">
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-400">
        Prototype · variable picker, validation, live preview, versioning &amp; activation are all interactive.
      </p>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[12px]">
      {options.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)}
          className={`rounded-md px-2.5 py-1 font-medium transition ${value === k ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ CHIP EDITOR ------------------------------- */
/* Variables are inserted as atomic, non-editable pills. Free text is typeable
   around them; a chip can only be removed as a whole unit (backspace/delete). */
const ChipEditor = forwardRef(function ChipEditor(
  { initial, onChange, disabled, singleLine, onFocusField },
  ref
) {
  const elRef = useRef(null);
  const inited = useRef(false);

  const makeChip = (key, label) => {
    const span = document.createElement("span");
    span.setAttribute("data-var", key);
    span.setAttribute("contenteditable", "false");
    Object.assign(span.style, {
      display: "inline-flex", alignItems: "center", gap: "3px",
      background: "#ccfbf1", color: "#0f766e", border: "1px solid #5eead4",
      borderRadius: "5px", padding: "0 6px", margin: "0 1px",
      fontSize: "12px", fontWeight: "500", lineHeight: "1.55",
      userSelect: "none", whiteSpace: "nowrap", verticalAlign: "baseline", cursor: "default",
    });
    const mark = document.createElement("span");
    mark.textContent = "{}";
    Object.assign(mark.style, { fontFamily: "ui-monospace, monospace", fontSize: "9px", opacity: "0.55" });
    const text = document.createElement("span");
    text.textContent = label;
    span.append(mark, text);
    return span;
  };

  const serialize = useCallback(() => {
    const root = elRef.current;
    if (!root) return "";
    const walk = (n) => {
      let s = "";
      n.childNodes.forEach((c) => {
        if (c.nodeType === 3) s += c.textContent;
        else if (c.nodeType === 1) {
          if (c.getAttribute && c.getAttribute("data-var")) s += `{{${c.getAttribute("data-var")}}}`;
          else if (c.tagName === "BR") s += "\n";
          else {
            if (c.tagName === "DIV" && s && !s.endsWith("\n")) s += "\n";
            s += walk(c);
          }
        }
      });
      return s;
    };
    return walk(root).replace(/\u200B/g, "");
  }, []);

  const emit = useCallback(() => onChange(serialize()), [onChange, serialize]);

  const buildInitial = useCallback(() => {
    const root = elRef.current;
    if (!root) return;
    root.innerHTML = "";
    const text = initial || "";
    let last = 0;
    text.replace(TOKEN_RE, (full, key, idx) => {
      if (idx > last) root.appendChild(document.createTextNode(text.slice(last, idx)));
      root.appendChild(makeChip(key, REG_MAP[key] ? REG_MAP[key].label : key));
      last = idx + full.length;
      return full;
    });
    if (last < text.length) root.appendChild(document.createTextNode(text.slice(last)));
  }, [initial]);

  useEffect(() => { if (!inited.current) { buildInitial(); inited.current = true; } }, [buildInitial]);

  useImperativeHandle(ref, () => ({
    insertVariable(key, label) {
      const root = elRef.current;
      if (!root || disabled) return;
      root.focus();
      const sel = window.getSelection();
      let range;
      if (sel && sel.rangeCount && root.contains(sel.anchorNode)) range = sel.getRangeAt(0);
      else { range = document.createRange(); range.selectNodeContents(root); range.collapse(false); }
      range.deleteContents();
      const chip = makeChip(key, label);
      range.insertNode(chip);
      const zw = document.createTextNode("\u200B");
      chip.after(zw);
      const after = document.createRange();
      after.setStartAfter(zw); after.collapse(true);
      sel.removeAllRanges(); sel.addRange(after);
      emit();
    },
  }));

  const onKeyDown = (e) => {
    if (disabled) { e.preventDefault(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      if (singleLine) return;
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      r.deleteContents();
      const nl = document.createTextNode("\n");
      r.insertNode(nl);
      const r2 = document.createRange(); r2.setStartAfter(nl); r2.collapse(true);
      sel.removeAllRanges(); sel.addRange(r2);
      emit();
      return;
    }
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (!sel.isCollapsed || !sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      const node = r.startContainer, off = r.startOffset;
      const removeChip = (chip, zw) => { if (zw) zw.remove(); chip.remove(); e.preventDefault(); emit(); };
      if (node.nodeType === 3 && off === 0) {
        let prev = node.previousSibling, zw = null;
        if (prev && prev.nodeType === 3 && prev.textContent === "\u200B") { zw = prev; prev = prev.previousSibling; }
        if (prev && prev.nodeType === 1 && prev.getAttribute && prev.getAttribute("data-var")) removeChip(prev, zw);
      } else if (node.nodeType === 1) {
        let prev = node.childNodes[off - 1], zw = null;
        if (prev && prev.nodeType === 3 && prev.textContent === "\u200B") { zw = prev; prev = prev.previousSibling; }
        if (prev && prev.nodeType === 1 && prev.getAttribute && prev.getAttribute("data-var")) removeChip(prev, zw);
      }
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    r.deleteContents();
    const tn = document.createTextNode(text);
    r.insertNode(tn);
    r.setStartAfter(tn); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
    emit();
  };

  return (
    <div
      ref={elRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={singleLine ? "Subject…" : "Type your message…"}
      onInput={emit}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={onFocusField}
      className={`w-full rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:ring-2 focus:ring-teal-100 ${
        disabled ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 focus:border-teal-400"
      } ${singleLine ? "" : "min-h-[150px]"}`}
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    />
  );
});

/* --------------------------------- EDITOR --------------------------------- */
function Editor({ tpl, onBack, onSave, flash }) {
  const [draft, setDraft] = useState({ subject: tpl.subject || "", content: tpl.content, pushTitle: tpl.pushTitle || "" });
  const [showHistory, setShowHistory] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [persona, setPersona] = useState(tpl.personas[0]);
  const bodyRef = useRef(null);
  const subjectRef = useRef(null);
  const titleRef = useRef(null);
  const [activeField, setActiveField] = useState("body");

  const C = CHANNELS[tpl.channel];
  const { errors, warnings } = useMemo(() => validate(tpl, draft), [tpl, draft]);
  const dirty = draft.content !== tpl.content || draft.subject !== (tpl.subject || "");

  const pickable = REGISTRY.filter(
    (v) => v.channels.includes(tpl.channel) && (v.categories.includes("*") || v.categories.includes(tpl.category))
  );
  const grouped = pickable.reduce((acc, v) => { (acc[v.group] ||= []).push(v); return acc; }, {});
  const usedKeys = tokensIn(draft.content).concat(tokensIn(draft.subject || ""));

  const activeEditor = () =>
    activeField === "subject" ? subjectRef : activeField === "title" ? titleRef : bodyRef;
  const insertVar = (key, label) => activeEditor().current?.insertVariable(key, label);

  const doSave = () => {
    onSave({ ...tpl, subject: draft.subject, content: draft.content, status: tpl.status === "active" ? "active" : "draft" });
    flash("Draft saved. Production is still on the published version.");
  };
  const doPublish = () => {
    const nv = tpl.version + 1;
    const versions = [
      { v: nv, status: "active", by: "client.admin@swgas", at: "Jun 19, 2026 · now", note: "Published from Studio" },
      ...tpl.versions.map((x) => ({ ...x, status: x.status === "active" ? "archived" : x.status })),
    ];
    onSave({ ...tpl, subject: draft.subject, content: draft.content, status: "active", version: nv, versions });
    setPublishOpen(false);
    flash(`Published v${nv}. It's now live for ${tpl.personas.length} persona(s).`);
  };
  const restore = (vsnContent) => { flash("Restored as a new draft."); };

  return (
    <div className="mx-auto max-w-7xl px-5 py-5">
      <style>{`[data-ph]:empty:before{content:attr(data-ph);color:#94a3b8;pointer-events:none;}`}</style>
      {/* breadcrumb / header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-200/60 hover:text-slate-800">
          <ArrowLeft size={15} /> Templates
        </button>
        <ChevronRight size={14} className="text-slate-300" />
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ring-1 ${C.chip}`}><C.icon size={13} /> {C.label}</span>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">{tpl.name}</h1>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS[tpl.status].cls}`}>{STATUS[tpl.status].label}</span>
          {tpl.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
              <Lock size={11} /> Locked · regulatory
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowHistory(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
            <History size={14} /> v{tpl.version} · History
          </button>
          <button onClick={doSave} disabled={!dirty || tpl.locked}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            Save draft
          </button>
          <button onClick={() => setPublishOpen(true)} disabled={errors.length > 0 || tpl.locked}
            title={tpl.locked ? "Locked template" : errors.length ? "Fix validation errors first" : "Publish to production"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40">
            <Send size={14} /> Publish
          </button>
        </div>
      </div>

      {/* inheritance banner */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[12px]">
        <Layers size={15} className="mt-0.5 text-teal-600" />
        <div>
          <span className="font-semibold text-slate-700">{INHERIT[tpl.inheritance].label}</span>
          <span className="text-slate-500"> — {INHERIT[tpl.inheritance].note}</span>
          {tpl.personas.length > 1 && (
            <span className="text-slate-500"> Applies to: <span className="font-medium text-slate-700">{tpl.personas.join(", ")}</span>.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT: composer */}
        <div className="space-y-4">
          {/* validation strip */}
          <ValidationStrip errors={errors} warnings={warnings} />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {tpl.channel === "email" && (
              <Field label="Subject line">
                <ChipEditor ref={subjectRef} initial={tpl.subject || ""} disabled={tpl.locked} singleLine
                  onFocusField={() => setActiveField("subject")}
                  onChange={(s) => setDraft((d) => ({ ...d, subject: s }))} />
              </Field>
            )}
            {tpl.channel === "push" && (
              <Field label="Notification title">
                <ChipEditor ref={titleRef} initial={tpl.pushTitle || ""} disabled={tpl.locked} singleLine
                  onFocusField={() => setActiveField("title")}
                  onChange={(s) => setDraft((d) => ({ ...d, pushTitle: s }))} />
              </Field>
            )}

            <Field label={tpl.channel === "voice" ? "Spoken script" : "Message body"}
              hint={tpl.locked ? "Locked — edit requires a vendor change request." : "Click a variable below to drop it in as a locked chip. Type your copy around it."}>
              <ChipEditor ref={bodyRef} initial={tpl.content} disabled={tpl.locked}
                onFocusField={() => setActiveField("body")}
                onChange={(s) => setDraft((d) => ({ ...d, content: s }))} />
            </Field>

            {/* token chips */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400">Variables in use:</span>
              {usedKeys.length === 0 && <span className="text-[11px] text-slate-400">none yet</span>}
              {[...new Set(usedKeys)].map((k) => {
                const ok = !!REG_MAP[k] && REG_MAP[k].channels.includes(tpl.channel);
                return (
                  <span key={k} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] ring-1 ${
                    ok ? "bg-teal-50 text-teal-700 ring-teal-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                    {ok ? <Braces size={10} /> : <AlertTriangle size={10} />} {k}
                  </span>
                );
              })}
            </div>

            {tpl.channel === "sms" && <SmsMeter content={draft.content} />}
            {tpl.channel === "voice" && <VoiceMeta tpl={tpl} />}
          </div>

          {/* variable picker */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Braces size={15} className="text-teal-600" />
                <span className="text-[13px] font-semibold text-slate-800">Variable picker</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">scoped to {C.label} · {tpl.category}</span>
              </div>
              <button onClick={() => setShowLibrary(true)} className="text-[11.5px] font-medium text-teal-600 hover:underline">View full catalog</button>
            </div>
            <p className="mb-3 text-[11.5px] text-slate-400">Only variables valid for this channel and category appear — so clients can't insert one that breaks the send.</p>
            <div className="space-y-3">
              {Object.entries(grouped).map(([group, vars]) => (
                <div key={group}>
                  <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{group}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {vars.map((v) => (
                      <button key={v.key}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertVar(v.key, v.label)} disabled={tpl.locked}
                        title={`${v.label} · e.g. ${v.sample}`}
                        className="group inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                        <Plus size={11} className="text-slate-300 group-hover:text-teal-500" />
                        <span className="font-medium">{v.label}</span>
                        {tpl.requiredVars?.includes(v.key) && <span className="ml-0.5 text-[9px] font-bold text-amber-500">REQ</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600"><Play size={13} className="text-teal-600" /> Live preview</span>
            <select value={persona} onChange={(e) => setPersona(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] text-slate-600 outline-none">
              {tpl.personas.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <Preview tpl={tpl} draft={draft} />
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-500">
            <Info size={12} className="mr-1 inline text-slate-400" />
            Sample values come from the catalog. At send time these resolve from the customer's live account data.
          </div>
        </div>
      </div>

      {showHistory && <HistoryDrawer tpl={tpl} onClose={() => setShowHistory(false)} onRestore={restore} />}
      {showLibrary && <LibraryDrawer onClose={() => setShowLibrary(false)} channel={tpl.channel} />}
      {publishOpen && <PublishModal tpl={tpl} warnings={warnings} onClose={() => setPublishOpen(false)} onPublish={doPublish} flash={flash} />}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[12px] font-medium text-slate-600">{label}</label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ValidationStrip({ errors, warnings }) {
  if (errors.length === 0 && warnings.length === 0)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] text-emerald-800">
        <CheckCircle2 size={15} /> <span className="font-medium">All checks passed.</span> Safe to publish.
      </div>
    );
  return (
    <div className="space-y-1.5">
      {errors.map((e, i) => (
        <div key={`e${i}`} className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12.5px] text-rose-800">
          <X size={14} className="mt-0.5 shrink-0" /> <span>{e}</span>
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={`w${i}`} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[12.5px] text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> <span>{w}</span>
        </div>
      ))}
    </div>
  );
}

function SmsMeter({ content }) {
  const len = resolvePlain(content).length;
  const seg = len === 0 ? 0 : len <= 160 ? 1 : Math.ceil(len / 153);
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px]">
      <span className="font-mono text-slate-600">{len} chars (resolved)</span>
      <span className="h-3 w-px bg-slate-200" />
      <span className={`font-medium ${seg > 1 ? "text-amber-600" : "text-emerald-600"}`}>{seg} segment{seg !== 1 ? "s" : ""}</span>
      <span className="ml-auto text-slate-400">160 / segment · 153 when split</span>
    </div>
  );
}

function VoiceMeta({ tpl }) {
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11.5px]">
      <div className="flex items-center gap-2 text-slate-600"><span className="font-medium">Voice:</span> {tpl.voice}</div>
      <div className="flex flex-wrap gap-1.5">
        {tpl.dtmf?.map((d) => (
          <span key={d} className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{d}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- PREVIEW ---------------------------------- */
function RichText({ text, className = "" }) {
  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {resolveParts(text).map((p, i) =>
        p.t === "text" ? <span key={i}>{p.v}</span> : (
          <span key={i} className={`rounded px-0.5 ${p.ok ? "bg-teal-100/70 text-teal-900" : "bg-rose-100 text-rose-700"}`}>{p.v}</span>
        )
      )}
    </span>
  );
}

function Preview({ tpl, draft }) {
  if (tpl.channel === "email")
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Subject</div>
          <div className="text-[13px] font-semibold text-slate-800"><RichText text={draft.subject} /></div>
        </div>
        <div className="px-4 py-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-700 text-[11px] font-bold text-white">SW</div>
            <div className="text-[11px] leading-tight">
              <div className="font-semibold text-slate-700">Utility Gas</div>
              <div className="text-slate-400">no‑reply@swgas.com · to Maria Alvarez</div>
            </div>
          </div>
          <div className="text-[13px] leading-relaxed text-slate-700"><RichText text={draft.content} /></div>
        </div>
      </div>
    );

  if (tpl.channel === "sms")
    return (
      <PhoneFrame label="Messages">
        <div className="mb-1 text-center text-[10px] text-slate-400">{tpl.senderId || "SWGAS"}</div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-200 px-3 py-2 text-[12.5px] leading-snug text-slate-800">
          <RichText text={draft.content} />
        </div>
      </PhoneFrame>
    );

  if (tpl.channel === "push")
    return (
      <PhoneFrame label="9:41" lock>
        <div className="rounded-2xl bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-teal-500 to-cyan-700 text-[9px] font-bold text-white">SW</div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Utility Gas</span>
            <span className="ml-auto text-[10px] text-slate-400">now</span>
          </div>
          <div className="text-[12.5px] font-semibold text-slate-900">{draft.pushTitle || "Notification"}</div>
          <div className="text-[12px] leading-snug text-slate-700"><RichText text={draft.content} /></div>
        </div>
      </PhoneFrame>
    );

  // voice
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-amber-50 px-4 py-2.5 text-[12px] font-medium text-amber-800">
        <Phone size={14} /> Outbound robocall · {tpl.voice}
      </div>
      <div className="px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm"><Play size={15} /></button>
          <div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className="h-1.5 w-1/3 rounded-full bg-amber-400" /></div>
          <span className="font-mono text-[11px] text-slate-400">0:00</span>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] italic leading-relaxed text-slate-700">
          “<RichText text={draft.content} />”
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tpl.dtmf?.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-600">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ children, label, lock }) {
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[2rem] border-[6px] border-slate-800 bg-slate-800 p-1.5 shadow-lg">
      <div className={`min-h-[300px] rounded-[1.5rem] p-3 ${lock ? "bg-gradient-to-b from-slate-700 to-slate-900" : "bg-slate-50"}`}>
        <div className={`mb-3 text-center text-[11px] font-semibold ${lock ? "text-white/80" : "text-slate-400"}`}>{label}</div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- HISTORY ---------------------------------- */
function HistoryDrawer({ tpl, onClose, onRestore }) {
  return (
    <Drawer title="Version history" subtitle={tpl.name} onClose={onClose} icon={History}>
      <ol className="relative ml-2 border-l border-slate-200">
        {tpl.versions.map((vsn) => (
          <li key={vsn.v} className="mb-5 ml-5">
            <span className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-white ${
              vsn.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-800">v{vsn.v}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                vsn.status === "active" ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                : vsn.status === "draft" ? "bg-amber-100 text-amber-800 ring-amber-300"
                : "bg-slate-100 text-slate-500 ring-slate-200"}`}>{vsn.status}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-slate-600">{vsn.note}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock size={11} /> {vsn.at} · {vsn.by}
            </div>
            {vsn.status !== "active" && (
              <button onClick={() => { onRestore(vsn); onClose(); }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                <RotateCcw size={11} /> Restore as draft
              </button>
            )}
          </li>
        ))}
      </ol>
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[11.5px] text-slate-500">
        Publishing creates an immutable snapshot. Production always reads the active version, so editing here never affects live sends.
      </div>
    </Drawer>
  );
}

/* ------------------------------- LIBRARY ---------------------------------- */
function LibraryDrawer({ onClose, channel }) {
  const groups = REGISTRY.reduce((acc, v) => { (acc[v.group] ||= []).push(v); return acc; }, {});
  return (
    <Drawer title="Variable catalog" subtitle="Governed by the vendor · clients can only insert, never invent" onClose={onClose} icon={Braces}>
      <div className="space-y-4">
        {Object.entries(groups).map(([g, vars]) => (
          <div key={g}>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{g}</div>
            <div className="space-y-1">
              {vars.map((v) => {
                const ok = v.channels.includes(channel);
                return (
                  <div key={v.key} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5">
                    <code className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${ok ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"}`}>{v.key}</code>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] text-slate-700">{v.label}</div>
                      <div className="truncate text-[11px] text-slate-400">e.g. {v.sample}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {Object.keys(CHANNELS).map((ch) => {
                        const Ic = CHANNELS[ch].icon;
                        const on = v.channels.includes(ch);
                        return <span key={ch} title={`${CHANNELS[ch].label}: ${on ? "allowed" : "not allowed"}`}
                          className={`flex h-5 w-5 items-center justify-center rounded ${on ? "text-slate-500" : "text-slate-200"}`}><Ic size={11} /></span>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function Drawer({ title, subtitle, onClose, icon: Icon, children }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Icon size={16} /></div>
          <div>
            <div className="text-[14px] font-semibold text-slate-900">{title}</div>
            <div className="text-[11.5px] text-slate-400">{subtitle}</div>
          </div>
          <button onClick={onClose} className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X size={17} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- PUBLISH ---------------------------------- */
function PublishModal({ tpl, warnings, onClose, onPublish, flash }) {
  const [tested, setTested] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Send size={17} /></div>
          <div>
            <div className="text-[15px] font-semibold text-slate-900">Publish to production</div>
            <div className="text-[12px] text-slate-400">{tpl.name} · {CHANNELS[tpl.channel].label}</div>
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-lg bg-slate-50 p-3 text-[12.5px]">
          <Row ok label="Variables validated against the catalog" />
          <Row ok label="Required variables present" />
          <Row ok={warnings.length === 0} label={warnings.length ? `${warnings.length} non‑blocking warning(s)` : "No warnings"} warn={warnings.length > 0} />
          <Row ok={tested} label="Test send to yourself" warn={!tested} />
        </div>

        <button onClick={() => { setTested(true); flash("Test sent to client.admin@swgas."); }}
          className="mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
          <Send size={14} /> Send test to me first
        </button>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
          This becomes v{tpl.version + 1} and goes live for {tpl.personas.join(", ")}. The current version is archived but stays restorable.
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onPublish}
            className="flex-1 rounded-lg bg-teal-600 py-2 text-[13px] font-semibold text-white hover:bg-teal-700">Publish v{tpl.version + 1}</button>
        </div>
      </div>
    </div>
  );
}

function Row({ ok, warn, label }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 size={15} className="text-emerald-500" />
        : warn ? <AlertTriangle size={15} className="text-amber-500" />
        : <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />}
      <span className={ok ? "text-slate-700" : "text-slate-500"}>{label}</span>
    </div>
  );
}

/* ------------------------------ CREATE WIZARD ----------------------------- */
function CreateWizard({ existing, onCancel, onCreate }) {
  const STEPS = ["Channel & type", "Audience", "Starting point"];
  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState(null);
  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");
  const [personas, setPersonas] = useState([]);
  const [utils, setUtils] = useState([]);
  const [mode, setMode] = useState("base"); // base | blank | clone
  const [cloneId, setCloneId] = useState("");

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const cloneOptions = existing.filter((t) => !channel || t.channel === channel);

  const canNext =
    step === 0 ? channel && category
    : step === 1 ? name.trim() && personas.length > 0 && utils.length > 0
    : mode !== "clone" || cloneId;

  const build = () => {
    const clone = existing.find((t) => t.id === cloneId);
    let subject = "", pushTitle = "", content = "";
    let requiredVars = requiredFor(channel, category);
    if (mode === "base") { const s = starterFor(channel, category); subject = s.subject; pushTitle = s.pushTitle; content = s.content; }
    if (mode === "clone" && clone) { subject = clone.subject || ""; pushTitle = clone.pushTitle || ""; content = clone.content || ""; requiredVars = clone.requiredVars || requiredVars; }
    const inheritance = mode === "blank" && personas.length > 1 ? "shared" : "override";
    return {
      id: "t" + Date.now(), name: name.trim(), category, channel,
      personas, utilities: utils, status: "draft", inheritance, locked: false,
      requiredVars, subject, pushTitle, content,
      senderId: channel === "sms" ? "SWGAS" : undefined,
      voice: channel === "voice" ? "Joanna (en‑US)" : undefined,
      dtmf: channel === "voice" ? ["1 — Confirm", "2 — Reschedule", "9 — Repeat"] : undefined,
      version: 1,
      versions: [{ v: 1, status: "draft", by: "client.admin@swgas", at: "Jun 19, 2026 · now", note: mode === "clone" ? "Cloned in Studio" : "Created in Studio" }],
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header + steps */}
        <div className="border-b border-slate-100 px-6 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Plus size={17} /></div>
            <div>
              <div className="text-[15px] font-semibold text-slate-900">New template</div>
              <div className="text-[12px] text-slate-400">Draft only — nothing sends until you publish.</div>
            </div>
            <button onClick={onCancel} className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-[12px] font-medium ${i === step ? "text-teal-700" : i < step ? "text-slate-500" : "text-slate-300"}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {i < step ? <Check size={11} /> : i + 1}
                  </span>
                  {s}
                </div>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-100" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-[12px] font-semibold text-slate-700">Channel</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(CHANNELS).map(([k, c]) => (
                    <button key={k} onClick={() => setChannel(k)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[12px] font-medium transition ${
                        channel === k ? "border-teal-400 bg-teal-50 text-teal-700 ring-2 ring-teal-100" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      <c.icon size={20} className={channel === k ? "text-teal-600" : "text-slate-400"} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[12px] font-semibold text-slate-700">Category</div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition ${
                        category === c ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11.5px] text-slate-400">Category scopes which variables appear in the picker and sets required-variable defaults.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">Template name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
                  placeholder="e.g. Final disconnection notice"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <div className="mb-2 text-[12px] font-semibold text-slate-700">Personas <span className="font-normal text-slate-400">— who receives it</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONAS.map((p) => (
                    <button key={p} onClick={() => toggle(personas, setPersonas, p)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition ${
                        personas.includes(p) ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      {personas.includes(p) ? <Check size={13} /> : <Users size={13} className="text-slate-400" />} {p}
                    </button>
                  ))}
                </div>
                {personas.length > 1 && (
                  <p className="mt-2 flex items-center gap-1 text-[11.5px] text-teal-600"><Layers size={12} /> Multiple personas → this becomes one shared template they all inherit.</p>
                )}
              </div>
              <div>
                <div className="mb-2 text-[12px] font-semibold text-slate-700">Utilities</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(UTILITIES).map(([k, u]) => (
                    <button key={k} onClick={() => toggle(utils, setUtils, k)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition ${
                        utils.includes(k) ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      <u.icon size={13} className={utils.includes(k) ? "text-teal-600" : "text-slate-400"} /> {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { k: "base", icon: Layers, t: "Start from base", d: `A ready ${category || "category"} starter with the right variables already placed.` },
                  { k: "clone", icon: Copy, t: "Clone an existing template", d: "Copy the content of one you already have, then tweak." },
                  { k: "blank", icon: FileText, t: "Start blank", d: "An empty body — compose from scratch." },
                ].map((o) => (
                  <button key={o.k} onClick={() => setMode(o.k)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      mode === o.k ? "border-teal-400 bg-teal-50 ring-2 ring-teal-100" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mode === o.k ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}>
                      <o.icon size={16} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">{o.t}</div>
                      <div className="text-[11.5px] text-slate-500">{o.d}</div>
                    </div>
                    <div className={`ml-auto mt-1 h-4 w-4 rounded-full border-2 ${mode === o.k ? "border-teal-500 bg-teal-500" : "border-slate-300"}`}>
                      {mode === o.k && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {mode === "clone" && (
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">Clone from</label>
                  <select value={cloneId} onChange={(e) => setCloneId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-teal-400">
                    <option value="">Select a {channel ? CHANNELS[channel].label : ""} template…</option>
                    {cloneOptions.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.category} (v{t.version})</option>)}
                  </select>
                  {cloneOptions.length === 0 && <p className="mt-1.5 text-[11.5px] text-amber-600">No {channel ? CHANNELS[channel].label : ""} templates to clone yet — try base or blank.</p>}
                </div>
              )}

              {/* summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[12px]">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">You're creating</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-slate-600">
                  <span className="font-semibold text-slate-800">{name || "Untitled"}</span>
                  {channel && <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ${CHANNELS[channel].chip}`}>{React.createElement(CHANNELS[channel].icon, { size: 11 })} {CHANNELS[channel].label}</span>}
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{category}</span>
                  <span>·</span>
                  <span>{personas.join(", ") || "no personas"}</span>
                  <span>·</span>
                  <span>{utils.map((u) => UTILITIES[u].label).join(", ") || "no utilities"}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Shield size={12} /> Starts as a <span className="font-semibold text-amber-600">Draft</span> at v1. Required variables: {requiredFor(channel, category).length ? requiredFor(channel, category).map((k) => REG_MAP[k]?.label || k).join(", ") : "none"}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button onClick={onCancel} className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-slate-600">Cancel</button>
          <div className="ml-auto">
            {step < 2 ? (
              <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={() => canNext && onCreate(build())} disabled={!canNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Pencil size={14} /> Create &amp; compose
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client"; //    GAP: <span style={{ color: Gap >= 0 ? '#15803d' : '#dc2626' }}>{fmt(Gap)}</span>

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = { headerBg: '#BDD7EE', yellowBg: '#FFFF00', lightYellowBg: '#FFFACD' };

// ── Liabilities types ─────────────────────────────────────────────────────────
type FieldType = "text" | "textarea" | "number" | "date" | "time" | "bool" | "select";
type FieldDef = {
  key: string; label: string; type: FieldType;
  options?: string[]; placeholder?: string; widthClass?: string;
};
type LiabRow = { id: string; fna_id: string } & Record<string, any>;

const LIABILITY_TYPES = [
  "",
  "Credit Card",
  "Auto Loan",
  "Student Loan",
  "Personal Loan",
  "Mortgage Loan",
  "Insurance",
  "Family Support",
  "Other",
];

function coerceFieldValue(type: FieldType, raw: any) {
  if (raw === "" || raw === undefined) return null;
  if (type === "number") { const n = Number(raw); return Number.isFinite(n) ? n : null; }
  if (type === "bool") return !!raw;
  return raw;
}
function tmpLiabId() {
  return `tmp_liab_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface Client {
  id: string; first_name: string; last_name: string;
  phone: string; email: string; spouse_name: string;
  city: string; state: string; date_of_birth: string;
}

interface FNAData {
  fnaId?: string;
  clientId: string; clientName: string; clientPhone: string; clientEmail: string;
  spouseName: string; spouseDob: string; city: string; state: string; clientDob: string; analysisDate: string;
  dob: string; notes: string; plannedRetirementAge: number; calculatedInterestPercentage: number;
  child1CollegeName: string; child1CollegeNotes: string; child1CollegeAmount: number;
  child2CollegeName: string; child2CollegeNotes: string; child2CollegeAmount: number;
  child1WeddingNotes: string; child1WeddingAmount: number;
  child2WeddingNotes: string; child2WeddingAmount: number;
  currentAge: number; yearsToRetirement: number; retirementYears: number;
  monthlyIncomeNeeded: number; monthlyRetirementIncome: number;
  annualRetirementIncome: number; totalRetirementIncome: number;
  retirementNote1: string; retirementNote2: string; retirementNote3: string;
  healthcareExpenses: number; longTermCare: number;
  healthcareNote1: string; healthcareNote2: string;
  travelBudget: number; travelNotes: string;
  vacationHome: number; vacationNotes: string;
  charity: number; charityNotes: string;
  otherGoals: number; otherGoalsNotes: string;
  headstartFund: number; headstartNotes: string;
  familyLegacy: number; legacyNotes: string;
  familySupport: number; supportNotes: string;
  totalRequirement: number;
}

// Full asset state — all sections from the Excel sheet
interface AssetsData {
  // ── RETIREMENT PLANNING (USA) ───────────────────────────────────────────
  r1_him: boolean; r1_her: boolean; r1_notes: string; r1_present: number; r1_proj: number; // 401K/403B – calc+edit
  r2_him: boolean; r2_her: boolean; r2_notes: string; r2_present: number; // Company Match – N/A proj
  r3_him: boolean; r3_her: boolean; r3_notes: string; r3_present: number; r3_proj: number; // Max Funding – editable proj
  r4_him: boolean; r4_her: boolean; r4_notes: string; r4_present: number; r4_proj: number; // Previous 401K – calc+edit
  r5_him: boolean; r5_her: boolean; r5_notes: string; r5_present: number; // Traditional IRA – auto
  r6_him: boolean; r6_her: boolean; r6_notes: string; r6_present: number; // Roth IRA – auto
  r7_him: boolean; r7_her: boolean; r7_notes: string; r7_present: number; r7_proj: number; // ESPP/RSU – calc+edit
  // ── REAL ESTATE (USA) – manual projected ───────────────────────────────
  e1_him: boolean; e1_her: boolean; e1_notes: string; e1_present: number; e1_proj: number;
  e2_him: boolean; e2_her: boolean; e2_notes: string; e2_present: number; e2_proj: number;
  e3_him: boolean; e3_her: boolean; e3_notes: string; e3_present: number; e3_proj: number;
  e4_him: boolean; e4_her: boolean; e4_notes: string; e4_present: number; e4_proj: number;
  // ── STOCKS | BUSINESS | INCOME (USA) ───────────────────────────────────
  s1_him: boolean; s1_her: boolean; s1_notes: string; s1_present: number; s1_proj: number; // Stocks/MFs – calc+edit
  s2_him: boolean; s2_her: boolean; s2_notes: string; s2_present: number; s2_proj: number; // Business – manual
  s3_him: boolean; s3_her: boolean; s3_notes: string; s3_present: number; s3_proj: number; // Alt Investments – calc+edit
  s4_him: boolean; s4_her: boolean; s4_notes: string; s4_present: number; // CDs – auto
  s5_him: boolean; s5_her: boolean; s5_notes: string; s5_present: number; s5_proj: number; // Cash in Bank – calc+edit
  s6_him: boolean; s6_her: boolean; s6_notes: string; s6_present: number; s6_proj: number; // Annual Income – editable proj
  s7_him: boolean; s7_her: boolean; s7_notes: string; s7_present: number; s7_proj: number; // Annual Savings – manual
  // ── FAMILY PROTECTION & INSURANCE ──────────────────────────────────────
  f1_him: boolean; f1_her: boolean; f1_notes: string; f1_present: number; // Life Ins Work – N/A proj
  f2_him: boolean; f2_her: boolean; f2_notes: string; f2_present: number; f2_proj: number; // Life Ins Outside – manual
  f3_him: boolean; f3_her: boolean; f3_notes: string; f3_present: number; f3_proj: number; // Cash Value LI – manual
  f4_him: boolean; f4_her: boolean; f4_notes: string; // Which Company – N/A both
  f5_him: boolean; f5_her: boolean; f5_notes: string; // STD/LTD – N/A
  f6_him: boolean; f6_her: boolean; f6_notes: string; // LTC Outside – N/A
  f7_him: boolean; f7_her: boolean; f7_notes: string; f7_present: number; f7_proj: number; // HSA – calc+edit
  f8_him: boolean; f8_her: boolean; f8_notes: string; // Mortgage Prot – N/A
  // ── COLLEGE PLANNING / ESTATE PLANNING ─────────────────────────────────
  c1_c1: boolean; c1_c2: boolean; c1_notes: string; c1_present: number; c1_proj: number; // 529 Plans – calc+edit
  c2_c1: boolean; c2_c2: boolean; c2_notes: string; // Will & Trust – N/A
  // ── FOREIGN ASSETS ─────────────────────────────────────────────────────
  x1_him: boolean; x1_her: boolean; x1_notes: string; x1_present: number; x1_proj: number; // Foreign RE – calc+edit
  x2_him: boolean; x2_her: boolean; x2_notes: string; x2_present: number; x2_proj: number; // Foreign Non-RE – calc+edit
}

interface CardVisibility {
  clientInfo: boolean; college: boolean; wedding: boolean; retirement: boolean;
  healthcare: boolean; lifeGoals: boolean; legacy: boolean; totalReq: boolean;
  assetsRetirement: boolean; assetsRealEstate: boolean; assetsStocks: boolean;
  assetsInsurance: boolean; assetsCollege: boolean; assetsForeign: boolean; totalAssets: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────
const initialData: FNAData = {
  clientId: "", clientName: "", clientPhone: "", clientEmail: "",
  spouseName: "", spouseDob: "", city: "", state: "", clientDob: "",
  analysisDate: new Date().toISOString().split('T')[0],
  dob: "", notes: "", plannedRetirementAge: 65, calculatedInterestPercentage: 6,
  child1CollegeName: "", child1CollegeNotes: "", child1CollegeAmount: 0,
  child2CollegeName: "", child2CollegeNotes: "", child2CollegeAmount: 0,
  child1WeddingNotes: "", child1WeddingAmount: 0,
  child2WeddingNotes: "", child2WeddingAmount: 0,
  currentAge: 0, yearsToRetirement: 0, retirementYears: 0,
  monthlyIncomeNeeded: 0, monthlyRetirementIncome: 0, annualRetirementIncome: 0, totalRetirementIncome: 0,
  retirementNote1: "", retirementNote2: "", retirementNote3: "",
  healthcareExpenses: 315000, longTermCare: 0,
  healthcareNote1: "~$315K For Couple In Today's Dollars", healthcareNote2: "",
  travelBudget: 0, travelNotes: "", vacationHome: 0, vacationNotes: "",
  charity: 0, charityNotes: "", otherGoals: 0, otherGoalsNotes: "",
  headstartFund: 0, headstartNotes: "", familyLegacy: 0, legacyNotes: "",
  familySupport: 0, supportNotes: "", totalRequirement: 0,
};

const initialAssets: AssetsData = {
  r1_him:false, r1_her:false, r1_notes:"", r1_present:0, r1_proj:0,
  r2_him:false, r2_her:false, r2_notes:"", r2_present:0,
  r3_him:false, r3_her:false, r3_notes:"", r3_present:0, r3_proj:0,
  r4_him:false, r4_her:false, r4_notes:"", r4_present:0, r4_proj:0,
  r5_him:false, r5_her:false, r5_notes:"", r5_present:0,
  r6_him:false, r6_her:false, r6_notes:"", r6_present:0,
  r7_him:false, r7_her:false, r7_notes:"", r7_present:0, r7_proj:0,
  e1_him:false, e1_her:false, e1_notes:"", e1_present:0, e1_proj:0,
  e2_him:false, e2_her:false, e2_notes:"", e2_present:0, e2_proj:0,
  e3_him:false, e3_her:false, e3_notes:"", e3_present:0, e3_proj:0,
  e4_him:false, e4_her:false, e4_notes:"", e4_present:0, e4_proj:0,
  s1_him:false, s1_her:false, s1_notes:"", s1_present:0, s1_proj:0,
  s2_him:false, s2_her:false, s2_notes:"", s2_present:0, s2_proj:0,
  s3_him:false, s3_her:false, s3_notes:"", s3_present:0, s3_proj:0,
  s4_him:false, s4_her:false, s4_notes:"", s4_present:0,
  s5_him:false, s5_her:false, s5_notes:"", s5_present:0, s5_proj:0,
  s6_him:false, s6_her:false, s6_notes:"", s6_present:0, s6_proj:0,
  s7_him:false, s7_her:false, s7_notes:"", s7_present:0, s7_proj:0,
  f1_him:false, f1_her:false, f1_notes:"", f1_present:0,
  f2_him:false, f2_her:false, f2_notes:"", f2_present:0, f2_proj:0,
  f3_him:false, f3_her:false, f3_notes:"", f3_present:0, f3_proj:0,
  f4_him:false, f4_her:false, f4_notes:"",
  f5_him:false, f5_her:false, f5_notes:"",
  f6_him:false, f6_her:false, f6_notes:"",
  f7_him:false, f7_her:false, f7_notes:"", f7_present:0, f7_proj:0,
  f8_him:false, f8_her:false, f8_notes:"",
  c1_c1:false, c1_c2:false, c1_notes:"", c1_present:0, c1_proj:0,
  c2_c1:false, c2_c2:false, c2_notes:"",
  x1_him:false, x1_her:false, x1_notes:"", x1_present:0, x1_proj:0,
  x2_him:false, x2_her:false, x2_notes:"", x2_present:0, x2_proj:0,
};

const allCardsOpen: CardVisibility = {
  clientInfo:true, college:true, wedding:true, retirement:true, healthcare:true,
  lifeGoals:true, legacy:true, totalReq:true,
  assetsRetirement:true, assetsRealEstate:true, assetsStocks:true,
  assetsInsurance:true, assetsCollege:true, assetsForeign:true, totalAssets:true,
};
const allCardsClosed: CardVisibility = {
  clientInfo:true, college:false, wedding:false, retirement:false, healthcare:false,
  lifeGoals:false, legacy:false, totalReq:false,
  assetsRetirement:false, assetsRealEstate:false, assetsStocks:false,
  assetsInsurance:false, assetsCollege:false, assetsForeign:false, totalAssets:false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  v === 0 ? "" : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

/** Always shows $0.00 even for zero — used in asset table cells */
const formatCurrencyZero = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

const CurrencyInput: React.FC<{ value: number; onChange: (v: number) => void; placeholder?: string; className?: string; showZero?: boolean }> =
  ({ value, onChange, placeholder = "$0.00", className = "", showZero = false }) => {
    const [disp, setDisp] = useState("");
    const [focus, setFocus] = useState(false);
    useEffect(() => {
      if (!focus) setDisp(showZero ? formatCurrencyZero(value) : (value > 0 ? formatCurrency(value) : ""));
    }, [value, focus, showZero]);
    return (
      <input type="text" value={disp} placeholder={placeholder} className={className}
        onChange={e => setDisp(e.target.value.replace(/[^0-9.-]/g, ''))}
        onFocus={e => { setFocus(true); setDisp(value > 0 ? value.toString() : ""); setTimeout(() => e.target.select(), 0); }}
        onBlur={() => { setFocus(false); onChange(parseFloat(disp.replace(/[^0-9.-]/g, '')) || 0); }}
        onKeyDown={e => { if (!['Backspace','Delete','Tab','Escape','Enter','.','-','ArrowLeft','ArrowRight'].includes(e.key) && !(e.key >= '0' && e.key <= '9') && !e.ctrlKey && !e.metaKey) e.preventDefault(); }} />
    );
  };

// Button style constants
const btnGhost = "px-2.5 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors";
const btnSave  = "px-3 py-1.5 text-xs font-semibold rounded border border-gray-400 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

// ── PageHeader (inlined — no external import needed) ─────────────────────────
function PageHeader({
  title, subtitle = "Build your career. Protect their future", onLogout, actions,
}: {
  title: string; subtitle?: string; onLogout?: () => void; actions?: React.ReactNode;
}) {
  return (
    <header className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <Image
              src="/anunathan-logo.png"
              alt="AnuNathan Financial Group"
              width={64} height={64}
              className="object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold leading-tight whitespace-nowrap" style={{ color: "#1d4ed8" }}>
              {title}
            </div>
            {subtitle && (
              <div className="text-sm font-semibold whitespace-nowrap mt-0.5" style={{ color: "#808000" }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          {onLogout && (
            <button onClick={onLogout}
              className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap">
              Logout ➜
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Liabilities sub-components (top-level to avoid remount) ────────────────

function LiabTopButton({ onClick, children, variant = "primary", disabled }: {
  onClick: () => void; children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger"; disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold border transition-colors";
  const styles =
    variant === "danger" ? "bg-red-600 hover:bg-red-700 text-white border-red-700"
    : variant === "secondary" ? "bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
    : "bg-gray-900 hover:bg-gray-800 text-white border-gray-900";
  return (
    <button className={`${base} ${styles} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Currency display helpers for liabilities
const LIAB_CURRENCY_KEYS = new Set(["balance", "min_payment", "current_payment"]);

/** Format a stored number as "$1,234.56" for display in the input */
function fmtCurrencyInput(raw: any): string {
  if (raw === null || raw === undefined || raw === "") return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parse "$1,234.56" back to a plain number string "1234.56" for state storage */
function parseCurrencyInput(display: string): string {
  const stripped = display.replace(/[$,\s]/g, "");
  if (stripped === "" || stripped === "-") return stripped;
  const n = parseFloat(stripped);
  return Number.isFinite(n) ? String(n) : stripped;
}

function LiabilityEditableTable({
  rows, setRows, columns, fnaId, onSaveRow, onDeleteRow,
}: {
  rows: LiabRow[]; setRows: React.Dispatch<React.SetStateAction<LiabRow[]>>;
  columns: FieldDef[]; fnaId: string | undefined;
  onSaveRow: (row: LiabRow) => Promise<void>;
  onDeleteRow: (row: LiabRow) => Promise<void>;
}) {
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  // currency display drafts: key = `${rowId}:${colKey}` → formatted string while editing
  const [currDrafts, setCurrDrafts] = useState<Record<string, string>>({});

  const minWidth = Math.max(1100, columns.length * 145);
  const inputCls = "w-full rounded border border-gray-300 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400";

  const updateRow = (id: string, key: string, val: any) =>
    setRows(prev => prev.map(x => x.id === id ? { ...x, [key]: val } : x));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">
          {rows.length} liabilit{rows.length === 1 ? "y" : "ies"}
        </span>
        <LiabTopButton variant="secondary" onClick={() => {
          if (!fnaId) { alert("Save the FNA record first (Goals tab) before adding liabilities."); return; }
          setRows(prev => [...prev, { id: tmpLiabId(), fna_id: fnaId } as LiabRow]);
        }}>+ Add Liability</LiabTopButton>
      </div>

      <div className="overflow-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs border-collapse border border-gray-300" style={{ minWidth }}>
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-xs font-semibold text-gray-700" style={{ backgroundColor: '#BDD7EE' }}>
              {columns.map(c => (
                <th key={c.key} className="px-3 py-2 border border-gray-300 whitespace-nowrap">{c.label}</th>
              ))}
              <th className="px-3 py-2 border border-gray-300 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-gray-400 italic" colSpan={columns.length + 1}>
                No liabilities added yet. Click "+ Add Liability" to start.
              </td></tr>
            ) : rows.map(r => (
              <React.Fragment key={r.id}>
                <tr className="hover:bg-gray-50">
                  {columns.map(c => {
                    const draftKey = `${r.id}:${c.key}`;
                    const isCurrency = LIAB_CURRENCY_KEYS.has(c.key);
                    return (
                      <td key={c.key} className="px-2 py-1.5 border border-gray-300 align-top">
                        {c.type === "textarea" ? (
                          <textarea className={`${inputCls} min-h-[56px] resize-none`}
                            value={r[c.key] ?? ""}
                            onChange={e => updateRow(r.id, c.key, e.target.value)} />

                        ) : c.type === "select" ? (
                          <select className={inputCls} value={r[c.key] ?? ""}
                            onChange={e => updateRow(r.id, c.key, e.target.value)}>
                            {(c.options ?? [""]).map(o => <option key={o} value={o}>{o || "— Select —"}</option>)}
                          </select>

                        ) : isCurrency ? (
                          /* Currency input: shows "$1,234.56", stores raw number string */
                          <input
                            type="text"
                            className={`${inputCls} text-right`}
                            value={currDrafts[draftKey] !== undefined
                              ? currDrafts[draftKey]
                              : fmtCurrencyInput(r[c.key])}
                            onFocus={() => {
                              // On focus: show plain number for easy editing
                              const plain = r[c.key] !== null && r[c.key] !== undefined && r[c.key] !== ""
                                ? String(r[c.key])
                                : "";
                              setCurrDrafts(p => ({ ...p, [draftKey]: plain }));
                            }}
                            onChange={e => {
                              setCurrDrafts(p => ({ ...p, [draftKey]: e.target.value }));
                            }}
                            onBlur={e => {
                              const raw = parseCurrencyInput(e.target.value);
                              const num = raw === "" ? null : parseFloat(raw);
                              updateRow(r.id, c.key, Number.isFinite(num) ? num : null);
                              // Format for display
                              setCurrDrafts(p => {
                                const next = { ...p };
                                delete next[draftKey];
                                return next;
                              });
                            }}
                            placeholder="$0.00"
                          />

                        ) : (
                          <input
                            type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
                            className={c.type === "number" ? `${inputCls} text-right` : inputCls}
                            value={r[c.key] ?? ""}
                            onChange={e => updateRow(r.id, c.key, e.target.value)}
                            step={c.type === "number" ? "0.01" : undefined}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 border border-gray-300 whitespace-nowrap align-top">
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <LiabTopButton variant="primary" disabled={!!saving[r.id]}
                        onClick={async () => {
                          setSaving(p => ({ ...p, [r.id]: true }));
                          setRowErrors(p => { const n={...p}; delete n[r.id]; return n; });
                          try {
                            await onSaveRow(r);
                          } catch (e: any) {
                            setRowErrors(p => ({ ...p, [r.id]: e?.message ?? "Save failed" }));
                          } finally {
                            setSaving(p => ({ ...p, [r.id]: false }));
                          }
                        }}>
                        {saving[r.id] ? "Saving…" : "Save"}
                      </LiabTopButton>
                      <LiabTopButton variant="danger" disabled={!!deleting[r.id]}
                        onClick={async () => {
                          if (!confirm("Delete this liability?")) return;
                          setDeleting(p => ({ ...p, [r.id]: true }));
                          setRowErrors(p => { const n={...p}; delete n[r.id]; return n; });
                          try {
                            await onDeleteRow(r);
                          } catch (e: any) {
                            setRowErrors(p => ({ ...p, [r.id]: e?.message ?? "Delete failed" }));
                          } finally {
                            setDeleting(p => ({ ...p, [r.id]: false }));
                          }
                        }}>
                        {deleting[r.id] ? "…" : "Delete"}
                      </LiabTopButton>
                    </div>
                  </td>
                </tr>
                {/* Per-row error message */}
                {rowErrors[r.id] && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-3 py-1 bg-red-50 text-red-600 text-xs border border-red-200">
                      ❌ {rowErrors[r.id]}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Stable top-level components (defined outside FNAPage to prevent remount on every render) ──

const NAProjCell = () => (
  <td className="border border-black px-2 py-1 text-xs text-center text-gray-400 bg-gray-50">N/A</td>
);

/** Click-to-edit notes cell with full multi-line textarea, word-wrap, and Enter support */
const NoteTd = React.memo(({ value, onChange, placeholder = "Add notes...", colSpan }: {
  value: string; onChange: (v: string) => void; placeholder?: string; colSpan?: number;
}) => {
  const [editing, setEditing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && taRef.current) {
      const el = taRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.style.height = 'auto';
      el.style.height = Math.max(60, el.scrollHeight) + 'px';
    }
  }, [editing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.max(60, e.target.scrollHeight) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab closes the editor (moves to next field); Enter adds new line (default behaviour)
    if (e.key === 'Tab') { e.preventDefault(); setEditing(false); }
  };

  return (
    <td colSpan={colSpan} className="border border-black p-0 align-top" style={{ minWidth: 130 }}>
      {editing ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
          onBlur={() => setEditing(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-blue-50"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowY: 'hidden', minHeight: 60 }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          title="Click to edit"
          className="px-2 py-1 text-xs cursor-text min-h-[26px] leading-4 hover:bg-blue-50 transition-colors"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: value ? '#111827' : '#9CA3AF' }}
        >
          {value || <span className="italic">{placeholder}</span>}
        </div>
      )}
    </td>
  );
});
NoteTd.displayName = 'NoteTd';

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FNAPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  // Track manual edits to #6/#7/#13 so useEffect doesn't overwrite user input
  const ytrManualRef    = useRef(false);
  const rYearsManualRef = useRef(false);
  const ltcManualRef    = useRef(false);
  const [data, setData] = useState<FNAData>(initialData);
  const [assets, setAssets] = useState<AssetsData>(initialAssets);
  const [activeTab, setActiveTab] = useState<'goals' | 'assets' | 'liabilities'>('goals');
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [liabilityRows, setLiabilityRows] = useState<LiabRow[]>([]);
  const [liabNotice, setLiabNotice] = useState<string | null>(null);
  const [cardVisibility, setCardVisibility] = useState<CardVisibility>(allCardsClosed);

  // ── Compound interest helpers ──────────────────────────────────────────────
  const yearsToRetirement = useMemo(() => {
    const retAge = data.plannedRetirementAge;
    if (data.dob) {
      const today = new Date();
      const dob   = new Date(data.dob);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return Math.max(0, retAge - age);
    }
    if (data.currentAge > 0) return Math.max(0, retAge - data.currentAge);
    return 0;
  }, [data.dob, data.plannedRetirementAge, data.currentAge]);

  const rate = data.calculatedInterestPercentage / 100;

  /** Annual compound interest: FV = PV × (1+r)^n */
  const autoProj = useCallback((pv: number): number => {
    if (pv <= 0 || yearsToRetirement <= 0) return 0;
    return pv * Math.pow(1 + rate, yearsToRetirement);
  }, [yearsToRetirement, rate]);

  // ── Liabilities helpers ────────────────────────────────────────────────────
  const liabilityCols: FieldDef[] = useMemo(() => [
    { key: "liability_type",  label: "Liability Type",      type: "select", options: LIABILITY_TYPES },
    { key: "description",     label: "Description",         type: "text"   },
    { key: "lender",          label: "Lender",              type: "text"   },
    { key: "balance",         label: "Balance ($)",         type: "number" },
    { key: "interest_rate",   label: "Interest Rate (%)",   type: "number" },
    { key: "min_payment",     label: "Min Payment ($)",     type: "number" },
    { key: "current_payment", label: "Current Payment ($)", type: "number" },
    { key: "notes",           label: "Notes",               type: "textarea" },
  ], []);

  async function upsertLiabilityRow(row: LiabRow): Promise<void> {
    if (!data.fnaId) throw new Error("Save the FNA record first (Goals tab), then add liabilities.");

    // Validate NOT NULL column
    const liabType = String(row.liability_type ?? "").trim();
    if (!liabType) throw new Error("Liability Type is required — please select a type before saving.");

    const isTmp = String(row.id).startsWith("tmp_liab_");

    // Build payload mapping exactly to fna_liabilities columns
    // FK: fna_id → fna_records.fna_id  (data.fnaId holds this value)
    const toNum = (v: any): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[$,\s]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    const toText = (v: any): string | null => {
      const s = String(v ?? "").trim();
      return s === "" ? null : s;
    };

    const payload: Record<string, any> = {
      fna_id:           data.fnaId,          // FK → fna_records.fna_id (NOT NULL)
      liability_type:   liabType,             // text NOT NULL
      description:      toText(row.description),
      lender:           toText(row.lender),
      balance:          toNum(row.balance),         // numeric
      interest_rate:    toNum(row.interest_rate),   // numeric (%, not currency)
      min_payment:      toNum(row.min_payment),     // numeric
      current_payment:  toNum(row.current_payment), // numeric
      notes:            toText(row.notes),
    };

    if (!isTmp) payload.id = row.id;

    if (isTmp) {
      const { data: saved, error } = await supabase
        .from("fna_liabilities").insert(payload).select("*").limit(1);
      if (error) throw new Error(error.message);
      const s = (saved ?? [])[0];
      if (s) setLiabilityRows(prev => prev.map(r => r.id === row.id ? { ...s, fna_id: data.fnaId! } : r));
    } else {
      const { data: saved, error } = await supabase
        .from("fna_liabilities").update(payload).eq("id", row.id).select("*").limit(1);
      if (error) throw new Error(error.message);
      const s = (saved ?? [])[0];
      if (s) setLiabilityRows(prev => prev.map(r => r.id === row.id ? { ...s, fna_id: data.fnaId! } : r));
    }
    setLiabNotice("✅ Saved."); setTimeout(() => setLiabNotice(null), 2000);
  }

  async function deleteLiabilityRow(row: LiabRow): Promise<void> {
    const isTmp = String(row.id).startsWith("tmp_liab_");
    if (isTmp) { setLiabilityRows(prev => prev.filter(r => r.id !== row.id)); return; }
    const { error } = await supabase.from("fna_liabilities").delete().eq("id", row.id);
    if (error) throw error;
    setLiabilityRows(prev => prev.filter(r => r.id !== row.id));
    setLiabNotice("Deleted."); setTimeout(() => setLiabNotice(null), 2000);
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalPresent = useMemo(() => {
    const autoFields: (keyof AssetsData)[] = [
      'r1_present','r2_present','r3_present','r4_present','r5_present','r6_present','r7_present',
      'e1_present','e2_present','e3_present','e4_present',
      's1_present','s2_present','s3_present','s4_present','s5_present','s6_present','s7_present',
      'f1_present','f2_present','f3_present','f7_present',
      'c1_present','x1_present','x2_present',
    ];
    return autoFields.reduce((sum, k) => sum + ((assets[k] as number) || 0), 0);
  }, [assets]);

  const totalProjected = useMemo(() => {
    // Auto (read-only) projected rows — using autoProj formula
    const autoRows = [
      assets.r5_present, assets.r6_present,  // Traditional IRA + Roth IRA still auto
    ].reduce((s, p) => s + autoProj(p), 0);
    // Calc+edit projected rows — user may have overridden, so use stored proj value
    const calcEditRows = [
      assets.r1_proj,  // 401K/403B — calc+edit (was auto)
      assets.r3_proj,  // Max Funding — editable $0 default
      assets.r4_proj,  // Previous 401K — calc+edit (was auto)
      assets.r7_proj,  // ESPP/RSU
      assets.s1_proj,  // Stocks/MFs
      assets.s3_proj,  // Alt Investments
      assets.s4_present > 0 ? autoProj(assets.s4_present) : 0, // CDs still auto
      assets.s5_proj,  // Cash in Bank
      assets.s6_proj,  // Annual Income — editable $0 default
      assets.f7_proj,  // HSA
      assets.c1_proj,  // 529 Plans
      // Real Estate
      assets.e1_proj, assets.e2_proj, assets.e3_proj, assets.e4_proj,
      // Business + Annual Savings (manual)
      assets.s2_proj, assets.s7_proj,
      // Insurance (manual)
      assets.f2_proj, assets.f3_proj,
      // Foreign
      assets.x1_proj, assets.x2_proj,
    ].reduce((s, v) => s + (v || 0), 0);
    return autoRows + calcEditRows;
  }, [assets, autoProj]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const cookie = document.cookie.split('; ').find(r => r.startsWith('canfs_auth='));
    if (!cookie) router.push('/');
    else loadClients();
  }, [router]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data: cd, error } = await supabase
        .from('client_registrations')
        .select('id, first_name, last_name, phone, email, spouse_name, city, state, date_of_birth')
        .order('first_name', { ascending: true });
      if (error) throw error;
      setClients(cd || []);
    } catch { showMessage('Error loading clients', 'error'); }
    finally { setLoading(false); }
  };

  const handleClientSelect = async (clientId: string) => {
    if (!clientId) {
      setData(initialData);
      setAssets(initialAssets);
      setLiabilityRows([]);
      return;
    }
    const c = clients.find(x => x.id === clientId);
    if (!c) return;

    // Immediately clear all previous client data before loading new client
    setAssets(initialAssets);
    setLiabilityRows([]);
    setCardsExpanded(false);
    setCardVisibility(allCardsClosed);
    setData({
      ...initialData,
      clientId: c.id,
      clientName: `${c.first_name} ${c.last_name}`,
      clientPhone: c.phone || '', clientEmail: c.email || '',
      spouseName: c.spouse_name || '', spouseDob: '', city: c.city || '', state: c.state || '',
      clientDob: c.date_of_birth || '',
      analysisDate: new Date().toISOString().split('T')[0],
      healthcareNote1: "~$315K For Couple In Today's Dollars",
      plannedRetirementAge: 65, calculatedInterestPercentage: 6,
    });

    // Now load this client's saved FNA data from database
    await loadFNAData(clientId);
  };

  const loadFNAData = async (clientId: string) => {
    setLoading(true);
    try {
      const { data: rec, error: re } = await supabase
        .from('fna_records')
        .select('fna_id, analysis_date, spouse_name, dob, notes, planned_retirement_age, calculated_interest_percentage, updated_at')
        .eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (re) throw re;
      if (!rec) {
        // No DB record yet – check localStorage for unsaved session data
        try {
          const local = localStorage.getItem(`fna_assets_${clientId}`);
          if (local) setAssets({ ...initialAssets, ...JSON.parse(local) });
        } catch {}
        showMessage('No saved FNA found – enter data and save', 'error');
        return;
      }

      const fnaId = rec.fna_id;
      const [
        { data: college }, { data: wedding }, { data: retirement },
        { data: healthcare }, { data: lifeGoals }, { data: legacy },
        { data: astRet }
      ] = await Promise.all([
        supabase.from('fna_college').select('*').eq('fna_id', fnaId),
        supabase.from('fna_wedding').select('*').eq('fna_id', fnaId),
        supabase.from('fna_retirement').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_healthcare').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_life_goals').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_legacy').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_ast_retirement').select('*').eq('fna_id', fnaId).maybeSingle(),
      ]);

      const c1c = college?.find((x: any) => x.child_number === 1);
      const c2c = college?.find((x: any) => x.child_number === 2);
      const c1w = wedding?.find((x: any) => x.child_number === 1);
      const c2w = wedding?.find((x: any) => x.child_number === 2);

      setData(prev => ({
        ...prev, fnaId,
        spouseName: rec.spouse_name || prev.spouseName,
        analysisDate: rec.analysis_date || prev.analysisDate,
        dob: rec.dob || '', notes: rec.notes || '',
        plannedRetirementAge: rec.planned_retirement_age || 65,
        calculatedInterestPercentage: rec.calculated_interest_percentage || 6,
        child1CollegeName: c1c?.child_name || '', child1CollegeNotes: c1c?.notes || '', child1CollegeAmount: c1c?.amount || 0,
        child2CollegeName: c2c?.child_name || '', child2CollegeNotes: c2c?.notes || '', child2CollegeAmount: c2c?.amount || 0,
        child1WeddingNotes: c1w?.notes || '', child1WeddingAmount: c1w?.amount || 0,
        child2WeddingNotes: c2w?.notes || '', child2WeddingAmount: c2w?.amount || 0,
        currentAge: retirement?.current_age || 0,
        monthlyIncomeNeeded: retirement?.monthly_income_needed || 0,
        healthcareExpenses: healthcare?.healthcare_expenses || 315000,
        travelBudget: lifeGoals?.travel_budget || 0, vacationHome: lifeGoals?.vacation_home || 0,
        charity: lifeGoals?.charity || 0, otherGoals: lifeGoals?.other_goals || 0,
        headstartFund: legacy?.headstart_fund || 0, familyLegacy: legacy?.family_legacy || 0,
        familySupport: legacy?.family_support || 0,
      }));

      // ── ASSETS LOAD ──────────────────────────────────────────────────────
      // Priority 1: fna_records.notes __ASSETS__: JSON (most reliable DB path)
      let assetsLoaded = false;
      const recNotes: string = rec.notes || '';
      if (recNotes.startsWith('__ASSETS__:')) {
        try {
          const wrapper = JSON.parse(recNotes.slice('__ASSETS__:'.length));
          if (wrapper._assets) {
            setAssets({ ...initialAssets, ...wrapper._assets });
            assetsLoaded = true;
          }
          // Restore user note field if it was embedded
          if (wrapper._fna_note !== undefined) {
            setData(prev => ({ ...prev, notes: wrapper._fna_note }));
          }
          // Restore Spouse DOB
          if (wrapper._spouseDob !== undefined) {
            setData(prev => ({ ...prev, spouseDob: wrapper._spouseDob || '' }));
          }
          // Restore manually-edited #6/#7 values
          if (wrapper._ytrManual && wrapper._ytr !== undefined) {
            ytrManualRef.current = true;
            setData(prev => ({ ...prev, yearsToRetirement: wrapper._ytr }));
          }
          if (wrapper._rYearsManual && wrapper._rYears !== undefined) {
            rYearsManualRef.current = true;
            setData(prev => ({ ...prev, retirementYears: wrapper._rYears }));
          }
          // Restore manually-edited #13 Long-Term Care
          if (wrapper._ltcManual && wrapper._ltc !== undefined) {
            ltcManualRef.current = true;
            setData(prev => ({ ...prev, longTermCare: wrapper._ltc }));
          }
        } catch {}
      }

      // Priority 2: fna_ast_retirement current_401k_notes JSON
      if (!assetsLoaded && astRet) {
        const notesVal: string = astRet.current_401k_notes || '';
        if (notesVal.startsWith('__FNA_ASSETS_JSON__:')) {
          try {
            const parsed = JSON.parse(notesVal.slice('__FNA_ASSETS_JSON__:'.length));
            setAssets({ ...initialAssets, ...parsed });
            assetsLoaded = true;
          } catch {}
        } else if ((astRet as any).assets_data) {
          setAssets({ ...initialAssets, ...(astRet as any).assets_data });
          assetsLoaded = true;
        }
      }

      // Priority 3: localStorage (same-browser session backup)
      if (!assetsLoaded) {
        try {
          const local = localStorage.getItem(`fna_assets_${clientId}`);
          if (local) {
            setAssets({ ...initialAssets, ...JSON.parse(local) });
            assetsLoaded = true;
          }
        } catch {}
      }
      // Load liabilities for this fna_id
      const { data: liabData } = await supabase
        .from("fna_liabilities").select("*").eq("fna_id", fnaId).order("liability_type", { ascending: true });
      setLiabilityRows((liabData ?? []).map((x: any) => ({ ...x, fna_id: fnaId })) as LiabRow[]);

      showMessage('FNA data loaded!', 'success');
    } catch (err: any) {
      showMessage(`Error loading data: ${err.message}`, 'error');
    } finally { setLoading(false); }
  };

  // Reset manual overrides when the primary base values change
  useEffect(() => {
    ytrManualRef.current    = false;
    rYearsManualRef.current = false;
  }, [data.currentAge, data.plannedRetirementAge]);

  // Reset ltc manual override when healthcare base values change
  useEffect(() => {
    ltcManualRef.current = false;
  }, [data.healthcareExpenses, data.plannedRetirementAge]);

  // ── Goals recalculation — uses plannedRetirementAge (dynamic, not hardcoded 65) ──
  useEffect(() => {
    const retAge = data.plannedRetirementAge || 65;
    const autoYtr  = data.currentAge > 0 ? Math.max(0, retAge - data.currentAge) : 0;
    const autoRYrs = retAge < 85 ? 85 - retAge : 0;
    // Use manual value if user overrode; otherwise auto-calculate
    const ytr  = ytrManualRef.current    ? data.yearsToRetirement  : autoYtr;
    const rYrs = rYearsManualRef.current ? data.retirementYears     : autoRYrs;
    const mri  = data.monthlyIncomeNeeded > 0 && ytr > 0
      ? data.monthlyIncomeNeeded * Math.pow(1.03, ytr) : 0;
    const ari  = mri * 12;
    const tri  = ari * (rYrs > 0 ? rYrs : 1);
    const autoLtc = data.healthcareExpenses * 0.03 * ((85 - retAge) * 2);
    const ltc = ltcManualRef.current ? data.longTermCare : autoLtc;
    const total =
      data.child1CollegeAmount + data.child2CollegeAmount +
      data.child1WeddingAmount + data.child2WeddingAmount +
      tri + data.healthcareExpenses + ltc +
      data.travelBudget + data.vacationHome + data.charity + data.otherGoals +
      data.headstartFund + data.familyLegacy + data.familySupport;
    setData(prev => ({
      ...prev,
      ...(ytrManualRef.current    ? {} : { yearsToRetirement: autoYtr }),
      ...(rYearsManualRef.current ? {} : { retirementYears:   autoRYrs }),
      ...(ltcManualRef.current    ? {} : { longTermCare: autoLtc }),
      monthlyRetirementIncome: mri, annualRetirementIncome: ari,
      totalRetirementIncome: tri, totalRequirement: total,
    }));
  }, [
    data.currentAge, data.plannedRetirementAge, data.monthlyIncomeNeeded, data.healthcareExpenses,
    data.yearsToRetirement, data.retirementYears, data.longTermCare,
    data.child1CollegeAmount, data.child2CollegeAmount,
    data.child1WeddingAmount, data.child2WeddingAmount,
    data.travelBudget, data.vacationHome, data.charity, data.otherGoals,
    data.headstartFund, data.familyLegacy, data.familySupport,
  ]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!data.clientId) { showMessage("Please select a client first", 'error'); return; }
    setSaving(true);
    try {
      let fnaId = data.fnaId;
      if (!fnaId) {
        const { data: fr, error: fe } = await supabase.from('fna_records').insert([{
          client_id: data.clientId, analysis_date: data.analysisDate,
          spouse_name: data.spouseName, dob: data.dob || null, notes: data.notes || null,
          planned_retirement_age: data.plannedRetirementAge,
          calculated_interest_percentage: data.calculatedInterestPercentage,
        }]).select().single();
        if (fe) throw fe;
        fnaId = fr.fna_id;
        setData(prev => ({ ...prev, fnaId }));
      } else {
        const { error: ue } = await supabase.from('fna_records').update({
          analysis_date: data.analysisDate, spouse_name: data.spouseName,
          dob: data.dob || null, notes: data.notes || null,
          planned_retirement_age: data.plannedRetirementAge,
          calculated_interest_percentage: data.calculatedInterestPercentage,
          updated_at: new Date().toISOString(),
        }).eq('fna_id', fnaId);
        if (ue) throw ue;
      }

      await Promise.all([
        supabase.from('fna_college').delete().eq('fna_id', fnaId),
        supabase.from('fna_wedding').delete().eq('fna_id', fnaId),
        supabase.from('fna_retirement').delete().eq('fna_id', fnaId),
        supabase.from('fna_healthcare').delete().eq('fna_id', fnaId),
        supabase.from('fna_life_goals').delete().eq('fna_id', fnaId),
        supabase.from('fna_legacy').delete().eq('fna_id', fnaId),
        supabase.from('fna_ast_retirement').delete().eq('fna_id', fnaId),
      ]);

      const ins: any[] = [];
      if (data.child1CollegeName || data.child1CollegeAmount > 0)
        ins.push(supabase.from('fna_college').insert({ fna_id: fnaId, child_number:1, child_name: data.child1CollegeName, notes: data.child1CollegeNotes, amount: data.child1CollegeAmount }));
      if (data.child2CollegeName || data.child2CollegeAmount > 0)
        ins.push(supabase.from('fna_college').insert({ fna_id: fnaId, child_number:2, child_name: data.child2CollegeName, notes: data.child2CollegeNotes, amount: data.child2CollegeAmount }));
      if (data.child1WeddingAmount > 0)
        ins.push(supabase.from('fna_wedding').insert({ fna_id: fnaId, child_number:1, child_name: data.child1CollegeName, notes: data.child1WeddingNotes, amount: data.child1WeddingAmount }));
      if (data.child2WeddingAmount > 0)
        ins.push(supabase.from('fna_wedding').insert({ fna_id: fnaId, child_number:2, child_name: data.child2CollegeName, notes: data.child2WeddingNotes, amount: data.child2WeddingAmount }));
      ins.push(supabase.from('fna_retirement').insert({ fna_id: fnaId, current_age: data.currentAge, monthly_income_needed: data.monthlyIncomeNeeded }));
      ins.push(supabase.from('fna_healthcare').insert({ fna_id: fnaId, healthcare_expenses: data.healthcareExpenses }));
      ins.push(supabase.from('fna_life_goals').insert({ fna_id: fnaId, travel_budget: data.travelBudget, vacation_home: data.vacationHome, charity: data.charity, other_goals: data.otherGoals }));
      ins.push(supabase.from('fna_legacy').insert({ fna_id: fnaId, headstart_fund: data.headstartFund, family_legacy: data.familyLegacy, family_support: data.familySupport }));
      // Save Goals data
      const results = await Promise.all(ins);
      const errs = results.filter((r: any) => r.error);
      if (errs.length > 0) throw new Error(`Failed to save ${errs.length} goal record(s)`);

      // ── ASSETS SAVE ──────────────────────────────────────────────────────
      // Strategy 1: localStorage – always works, same-browser recovery
      const assetsJson = JSON.stringify(assets);
      try { localStorage.setItem(`fna_assets_${data.clientId}`, assetsJson); } catch {}

      // Strategy 2: Save to fna_records.notes as __ASSETS__:{json}
      // Embeds user note + full assets in one field (guaranteed text column, no schema risk)
      const notesPayload = JSON.stringify({ _fna_note: data.notes, _assets: assets, _spouseDob: data.spouseDob, _ytr: data.yearsToRetirement, _rYears: data.retirementYears, _ytrManual: ytrManualRef.current, _rYearsManual: rYearsManualRef.current, _ltc: data.longTermCare, _ltcManual: ltcManualRef.current });
      const notesWithAssets = `__ASSETS__:${notesPayload}`;
      const { error: notesErr } = await supabase.from('fna_records')
        .update({ notes: notesWithAssets, updated_at: new Date().toISOString() })
        .eq('fna_id', fnaId!);
      if (notesErr) {
        console.warn('Assets notes-column save failed:', notesErr.message);
      }

      // Strategy 3: Also try fna_ast_retirement with minimal payload
      try {
        await supabase.from('fna_ast_retirement').upsert({
          fna_id: fnaId,
          current_401k_him: assets.r1_him,
          current_401k_her: assets.r1_her,
          current_401k_notes: `__FNA_ASSETS_JSON__:${assetsJson}`,
          current_401k_present_value: assets.r1_present,
          current_401k_projected_value: assets.r1_proj || autoProj(assets.r1_present),
        }, { onConflict: 'fna_id' });
      } catch { /* silent — strategies 1+2 cover this */ }

      showMessage('✅ FNA saved successfully!', 'success');
    } catch (err: any) {
      showMessage(`❌ Save failed: ${err.message}`, 'error');
    } finally { setSaving(false); }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleLogout = () => {
    document.cookie = "canfs_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  const handleClear = async () => {
    // Preserve current client identity; wipe all financial data then reload from DB
    const cId    = data.clientId;
    const cName  = data.clientName;
    const cPhone = data.clientPhone;
    const cEmail = data.clientEmail;
    const cSpou  = data.spouseName;
    const cCity  = data.city;
    const cSt    = data.state;
    const cDob    = data.clientDob;
    const cSpDob  = data.spouseDob;

    // Clear goals / assets / liabilities to defaults
    setAssets(initialAssets);
    setLiabilityRows([]);
    setData({ ...initialData, clientId: cId, clientName: cName, clientPhone: cPhone,
      clientEmail: cEmail, spouseName: cSpou, spouseDob: cSpDob, city: cCity, state: cSt, clientDob: cDob });
    setCardsExpanded(false);
    setCardVisibility(allCardsClosed);

    if (cId) {
      showMessage('🔄 Refreshing data from database…', 'success');
      await loadFNAData(cId);   // reload saved FNA data for selected client
    } else {
      showMessage('Form cleared — select a client to load data', 'success');
    }
  };

  const handleToggleAllCards = async () => {
    const newExpanded = !cardsExpanded;
    setCardsExpanded(newExpanded);
    setCardVisibility(newExpanded ? allCardsOpen : allCardsClosed);
    if (newExpanded && data.clientId) await loadFNAData(data.clientId);
  };

  const toggleCard = (card: keyof CardVisibility) =>
    setCardVisibility(prev => ({ ...prev, [card]: !prev[card] }));

  // ── UI helpers ────────────────────────────────────────────────────────────
  const upd = (key: keyof AssetsData, val: any) =>
    setAssets(prev => ({ ...prev, [key]: val }));

  // Auto-persist assets to localStorage on every change (immediate backup)
  useEffect(() => {
    if (data.clientId) {
      try { localStorage.setItem(`fna_assets_${data.clientId}`, JSON.stringify(assets)); } catch {}
    }
  }, [assets, data.clientId]);

  // Projected cell: blue tint, auto-calculated, read-only display
  const AutoProjCell = ({ present }: { present: number }) => {
    const v = autoProj(present);
    return (
      <td className="border border-black px-2 py-1 text-xs text-right font-medium" style={{ backgroundColor: '#EBF5FB' }}>
        {formatCurrencyZero(v)}
      </td>
    );
  };

  // manualProjCell – plain function (NOT JSX component) to prevent remount on re-render
  const manualProjCell = (field: keyof AssetsData) => (
    <td className="border border-black p-0">
      <CurrencyInput value={assets[field] as number} showZero
        onChange={val => upd(field, val)}
        className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
    </td>
  );

  // stdCells – plain function, NOT a JSX component, to prevent React remount on every render
  const stdCells = (
    himKey: keyof AssetsData, herKey: keyof AssetsData,
    notesKey: keyof AssetsData, presentKey: keyof AssetsData
  ) => (
    <>
      <td className="border border-black text-center py-1 w-12">
        <input type="checkbox" checked={!!assets[himKey]} className="w-4 h-4"
          onChange={e => upd(himKey, e.target.checked)} />
      </td>
      <td className="border border-black text-center py-1 w-12">
        <input type="checkbox" checked={!!assets[herKey]} className="w-4 h-4"
          onChange={e => upd(herKey, e.target.checked)} />
      </td>
      <NoteTd value={assets[notesKey] as string} onChange={v => upd(notesKey, v)} />
      <td className="border border-black p-0 w-36">
        <CurrencyInput value={assets[presentKey] as number} showZero
          onChange={val => upd(presentKey, val)}
          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
      </td>
    </>
  );

  // stdCellsCalc – called as a function (not JSX component) to avoid remount issues.
  // Auto-calculates projected from present on blur; projected cell stays editable.
  const stdCellsCalc = (
    himKey: keyof AssetsData, herKey: keyof AssetsData,
    notesKey: keyof AssetsData, presentKey: keyof AssetsData, projKey: keyof AssetsData
  ) => {
    const calcAndSet = (val: number) => {
      const proj = yearsToRetirement > 0 ? Math.round(val * Math.pow(1 + rate, yearsToRetirement) * 100) / 100 : 0;
      setAssets(prev => ({ ...prev, [presentKey]: val, [projKey]: proj }));
    };
    return (
      <>
        <td className="border border-black text-center py-1 w-12">
          <input type="checkbox" checked={!!assets[himKey]} className="w-4 h-4"
            onChange={e => upd(himKey, e.target.checked)} />
        </td>
        <td className="border border-black text-center py-1 w-12">
          <input type="checkbox" checked={!!assets[herKey]} className="w-4 h-4"
            onChange={e => upd(herKey, e.target.checked)} />
        </td>
        <NoteTd value={assets[notesKey] as string} onChange={v => upd(notesKey, v)} />
        <td className="border border-black p-0 w-36">
          <CurrencyInput value={assets[presentKey] as number} showZero onChange={calcAndSet}
            className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
        </td>
        <td className="border border-black p-0 w-44" style={{ backgroundColor: '#EBF5FB' }}>
          <CurrencyInput value={assets[projKey] as number} showZero onChange={val => upd(projKey, val)}
            className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-transparent" />
        </td>
      </>
    );
  };

  // calcPresentCell / calcEditProjCell – function helpers for non-StdCells rows (College 529)
  const calcPresentCell = (presentKey: keyof AssetsData, projKey: keyof AssetsData) => (
    <td className="border border-black p-0 w-36">
      <CurrencyInput value={assets[presentKey] as number} showZero
        onChange={val => {
          const proj = yearsToRetirement > 0 ? Math.round(val * Math.pow(1 + rate, yearsToRetirement) * 100) / 100 : 0;
          setAssets(prev => ({ ...prev, [presentKey]: val, [projKey]: proj }));
        }}
        className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
    </td>
  );
  const calcEditProjCell = (projKey: keyof AssetsData) => (
    <td className="border border-black p-0 w-44" style={{ backgroundColor: '#EBF5FB' }}>
      <CurrencyInput value={assets[projKey] as number} showZero onChange={val => upd(projKey, val)}
        className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-transparent" />
    </td>
  );

  // CardHeader helper
  const CardHeader = ({ emoji, title, cardKey, extra }: {
    emoji: string; title: string; cardKey: keyof CardVisibility; extra?: React.ReactNode
  }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.headerBg }}>
          {emoji} {title}
        </h3>
        <button onClick={() => toggleCard(cardKey)} className={btnGhost}>
          {cardVisibility[cardKey] ? 'Hide' : 'Show'}
        </button>
      </div>
      {extra}
    </div>
  );

  // Common asset table header (HIM | HER version)
  const AssetTHead = ({ projLabel = "Projected Value" }: { projLabel?: string }) => (
    <thead>
      <tr style={{ backgroundColor: COLORS.headerBg }}>
        <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
        <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-12">Him</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-12">Her</th>
        <th className="border border-black px-2 py-1 text-xs font-bold">Notes</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-36">Present Value</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-44 whitespace-nowrap">
          {projLabel} @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%){yearsToRetirement > 0 ? ` for ${yearsToRetirement} yrs` : ''}
        </th>
      </tr>
    </thead>
  );

  // ── PDF Report Generation ─────────────────────────────────────────────────
  const [reportGenerating, setReportGenerating] = useState(false);

  // Load logo, draw on canvas to capture proper transparency, return PNG base64
  const loadLogoBase64 = (): Promise<string | null> =>
    new Promise(resolve => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width  = img.naturalWidth  || 200;
          cv.height = img.naturalHeight || 80;
          const ctx = cv.getContext('2d');
          if (!ctx) { resolve(null); return; }
          // Do NOT fill background — keeps PNG transparency
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0);
          resolve(cv.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = '/anunathan-logo.png?' + Date.now(); // cache-bust
    });

  // Financial suggestions based on client data
  const buildSuggestions = (
    totAssets: number, totLiab: number, totReq: number,
    totProj: number, gapVal: number, ytr: number, intRate: number
  ): { text: string; kind: 'warn' | 'good' | 'info' }[] => {
    const $ = (n: number) => n.toLocaleString('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0 });
    const out: { text: string; kind: 'warn' | 'good' | 'info' }[] = [];
    const nw = totAssets - totLiab;

    out.push(gapVal > 0
      ? { kind:'warn', text:`SHORTFALL ALERT: A funding gap of ${$(gapVal)} exists at retirement age ${data.plannedRetirementAge}. Increase monthly contributions, improve investment returns, or consider a later retirement date.` }
      : { kind:'good', text:`ON TRACK: Projected assets of ${$(totProj)} exceed the total planning requirement of ${$(totReq)}. Maintain savings discipline and consider increasing legacy goals with the surplus.` });

    if (totLiab > 0) {
      const pct = ((totLiab / Math.max(totAssets,1))*100).toFixed(0);
      out.push(totLiab > totAssets*0.5
        ? { kind:'warn', text:`HIGH DEBT-TO-ASSET RATIO (${pct}%): Liabilities exceed half of total assets. Use the debt avalanche method to systematically reduce high-interest balances and improve net worth of ${$(nw)}.` }
        : { kind:'info', text:`DEBT MANAGEMENT: Debt-to-asset ratio is a manageable ${pct}% with net worth of ${$(nw)}. Continue structured repayments and avoid new high-interest debt.` });
    }

    if (data.monthlyIncomeNeeded > 0)
      out.push({ kind:'info', text:`RETIREMENT INCOME: You will need ${$(data.monthlyRetirementIncome)}/month at retirement - today's ${$(data.monthlyIncomeNeeded)}/month adjusted for 3% inflation over ${ytr} years. Build diversified income streams across Social Security, IRA/401K, and dividends.` });

    if (!assets.r1_present && !assets.r5_present && !assets.r6_present)
      out.push({ kind:'warn', text:`NO RETIREMENT ACCOUNTS RECORDED: Open a 401(K) immediately - especially if your employer matches contributions. Also open a Roth IRA for tax-free growth. 2024 limits: 401K $23,000; Roth IRA $7,000.` });
    else if (!assets.r6_present)
      out.push({ kind:'info', text:`ROTH IRA OPPORTUNITY: No Roth IRA recorded. Tax-free growth is powerful if you expect higher income at retirement. 2024 limit: $7,000/year ($8,000 if age 50+).` });

    if (!assets.f1_present && !assets.f2_present && !assets.f3_present)
      out.push({ kind:'warn', text:`LIFE INSURANCE GAP: No coverage recorded. Income replacement of 10-12x annual income protects your family. With ${ytr} years to retirement, consider Term insurance now and a Permanent policy for estate transfer.` });

    const mInc = (assets.s6_present||0) / 12;
    if (mInc > 0 && (assets.s5_present||0) < mInc*3)
      out.push({ kind:'warn', text:`EMERGENCY FUND LOW: Cash savings appear below the 3-6 month income threshold (target: ${$(mInc*6)}). Build this in a high-yield savings account before directing funds to higher-risk investments.` });

    const r72 = Math.round(72/intRate);
    out.push({ kind:'info', text:`RULE OF 72: At your ${intRate}% projection rate, investments double every ${r72} years. Starting or increasing contributions today has an exponential effect on retirement wealth.` });

    if (data.child1CollegeAmount > 0 || data.child2CollegeAmount > 0)
      out.push({ kind:'info', text:`COLLEGE SAVINGS: Goals total ${$(data.child1CollegeAmount+data.child2CollegeAmount)}. Consider 529 Plans - contributions grow and withdraw tax-free for qualified education expenses. Many states offer additional state income tax deductions.` });

    if (!assets.c2_c1 && !assets.c2_c2)
      out.push({ kind:'warn', text:`ESTATE PLANNING NEEDED: No Will or Trust on record. Without these, state intestacy laws control asset distribution. Consult an estate attorney for a Will, Living Will, and Healthcare Power of Attorney.` });

    if (totProj > totReq && gapVal <= 0)
      out.push({ kind:'good', text:`SURPLUS STRATEGY: Assets projected to cover ${((totProj/Math.max(totReq,1))*100).toFixed(0)}% of requirements. Consider accelerating charitable giving, increasing life insurance death benefit, or reviewing tax diversification across Traditional and Roth accounts.` });

    return out;
  };

  const handleGenerateReport = async () => {
    if (!data.clientId || !data.clientName) { alert('Please select a client first.'); return; }
    setReportGenerating(true);
    try {
      // ── Load jsPDF from CDN (no npm install, no TypeScript errors) ─────────
      const doc: any = await new Promise((resolve, reject) => {
        if ((window as any).jspdf?.jsPDF) {
          resolve(new (window as any).jspdf.jsPDF({ orientation:'portrait', unit:'pt', format:'letter' }));
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = () => {
          try { resolve(new (window as any).jspdf.jsPDF({ orientation:'portrait', unit:'pt', format:'letter' })); }
          catch(e) { reject(e); }
        };
        s.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
        document.head.appendChild(s);
      });

      // ── Constants ──────────────────────────────────────────────────────────
      const PW = 612, PH = 792, M = 50, TW = PW - M*2;

      // Consistent colour palette (used throughout all pages)
      const NAVY:  [number,number,number] = [26, 44, 94];
      const LBLUE: [number,number,number] = [189, 215, 238];
      const WHITE: [number,number,number] = [255, 255, 255];
      const BLACK: [number,number,number] = [0, 0, 0];
      const LGRAY: [number,number,number] = [247, 249, 251];
      const MGRAY: [number,number,number] = [230, 234, 238];
      const DGRAY: [number,number,number] = [100, 100, 100];
      const RED:   [number,number,number] = [180, 30, 30];
      const GRN:   [number,number,number] = [21, 128, 61];

      // Consistent row heights
      const HDR_H = 22;   // page header band
      const BAN_H = 20;   // section banner height
      const TBL_H = 18;   // table row height
      const KV_H  = 20;   // key/value row height

      const FONT = 'helvetica';  // ONE font used throughout

      const today    = new Date();
      const mmddyyyy = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}-${today.getFullYear()}`;

      // Currency formatter
      const $f = (n: number) => (n||0).toLocaleString('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 });

      // Y / N indicator
      const yn = (v: boolean) => v ? 'Y' : 'N';

      // CRITICAL: sanitise text — strip/replace all characters outside latin-1
      // that jsPDF Helvetica cannot render (they cause letter-spacing corruption)
      const S = (t: any): string => String(t ?? '')
        .replace(/\u2212/g, '-')       // minus sign  −
        .replace(/\u00D7/g, 'x')       // multiplication  ×
        .replace(/\u2014/g, ' - ')     // em dash  —
        .replace(/\u2013/g, '-')       // en dash  –
        .replace(/\u201C|\u201D/g, '"')// curly double quotes
        .replace(/\u2018|\u2019/g, "'")// curly apostrophes
        .replace(/\u25B2/g, '>>')      // ▲
        .replace(/\u25BC/g, '<<')      // ▼
        .replace(/[^\x00-\xFF]/g, ''); // strip any other non-latin1

      // ── Compute totals ─────────────────────────────────────────────────────
      const totalLiabilities = liabilityRows.reduce((s, r) => {
        const n = parseFloat(String(r.balance ?? '').replace(/[$,\s]/g, ''));
        return s + (Number.isFinite(n) ? n : 0);
      }, 0);
      const netWorth = totalPresent - totalLiabilities;
      const Gap      = data.totalRequirement - totalProjected - totalLiabilities;
      const logoData = await loadLogoBase64();
      let _pg = 0;

      // ══════════════════════════════════════════════════════════════════════
      // HELPER: page header band (logo + FLS title)
      // returns Y position below the header
      // ══════════════════════════════════════════════════════════════════════
      const topBar = (subtitle = ''): number => {
        doc.setFillColor(...LBLUE);
        doc.rect(0, 0, PW, HDR_H + 10, 'F');

        // Logo (transparent PNG drawn onto white-free canvas)
        if (logoData) {
          try { doc.addImage(logoData, 'PNG', M, 3, 60, HDR_H + 4); } catch {}
        } else {
          doc.setFont(FONT,'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
          doc.text('AnuNathan', M, HDR_H - 2);
        }

        // Centre title
        doc.setFont(FONT,'bold'); doc.setFontSize(12); doc.setTextColor(...NAVY);
        doc.text('FLS Document', PW/2, HDR_H - 2, { align:'center' });

        // FLS badge (right)
        doc.setFillColor(...NAVY); doc.rect(PW-M-64, 4, 64, HDR_H + 4, 'F');
        doc.setFont(FONT,'bold'); doc.setFontSize(5.5); doc.setTextColor(...WHITE);
        doc.text('FINANCIAL',  PW-M-60, 13);
        doc.text('LIFESTYLE',  PW-M-60, 20);
        doc.text('STRATEGY',   PW-M-60, 27);
        doc.setTextColor(...BLACK);

        // Optional subtitle (right-aligned below header)
        if (subtitle) {
          doc.setFont(FONT,'normal'); doc.setFontSize(7.5); doc.setTextColor(...DGRAY);
          doc.text(S(subtitle), PW-M, HDR_H + 22, { align:'right' });
          doc.setTextColor(...BLACK);
          return HDR_H + 28;
        }
        return HDR_H + 18;
      };

      // ── Page footer ────────────────────────────────────────────────────────
      const pgFoot = () => {
        _pg++;
        doc.setFont(FONT,'normal'); doc.setFontSize(7); doc.setTextColor(...DGRAY);
        doc.text(`Page ${_pg}`, PW/2, PH-18, { align:'center' });
        doc.text('For Education Purpose Only. Not Legal or Tax Advice.', PW/2, PH-8, { align:'center' });
        doc.setTextColor(...BLACK);
      };

      // ── Section banner (navy bg, white bold text) ──────────────────────────
      const banner = (label: string, y: number): number => {
        doc.setFillColor(...NAVY);
        doc.rect(M, y, TW, BAN_H, 'F');
        doc.setFont(FONT,'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
        doc.text(S(label), M+8, y + BAN_H*0.68);
        doc.setTextColor(...BLACK);
        return y + BAN_H + 6;
      };

      // ── Horizontal rule ────────────────────────────────────────────────────
      const hr = (y: number) => {
        doc.setDrawColor(...MGRAY as [number,number,number]);
        doc.setLineWidth(0.4);
        doc.line(M, y, PW-M, y);
      };

      // ── Key:Value row (Confirmation of Facts layout) ───────────────────────
      // lw = fixed pixel offset from x where value starts
      const kv = (label: string, val: string, x: number, y: number, lw = 112) => {
        const baseline = y + KV_H*0.62;
        doc.setFont(FONT,'bold'); doc.setFontSize(8);
        doc.text(S(label)+':', x, baseline);
        doc.setFont(FONT,'normal'); doc.setFontSize(8);
        // Clip value to avoid overflow into the next column
        const maxW = (TW/2) - lw - 8;
        const lines = doc.splitTextToSize(S(val||'-'), Math.max(maxW, 80));
        doc.text(lines[0]||'-', x + lw, baseline);
      };

      // ── Table header row (LBLUE background) ───────────────────────────────
      const thead = (cells: string[], y: number, colW: number[]): number => {
        doc.setFillColor(...LBLUE);
        doc.rect(M, y, TW, TBL_H, 'F');
        let x = M;
        const baseline = y + TBL_H*0.7;
        cells.forEach((c, i) => {
          doc.setFont(FONT,'bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY);
          // Last column: right-aligned if it looks like a number/amount column
          const isAmt = i===cells.length-1 && /value|amount|balance|payment|project/i.test(c);
          if (isAmt) doc.text(S(c), x+colW[i]-5, baseline, { align:'right' });
          else       doc.text(S(c), x+5, baseline);
          x += colW[i];
        });
        doc.setTextColor(...BLACK);
        return y + TBL_H;
      };

      // ── Table data row ─────────────────────────────────────────────────────
      const trow = (
        cells: string[], y: number, colW: number[],
        bold = false, bg?: [number,number,number]
      ): number => {
        if (bg) { doc.setFillColor(...bg); doc.rect(M, y, TW, TBL_H, 'F'); }
        let x = M;
        const baseline = y + TBL_H*0.7;
        cells.forEach((cell, i) => {
          doc.setFont(FONT, bold?'bold':'normal'); doc.setFontSize(8);
          const txt = S(cell);
          // Detect currency value — right-align in its column
          const isAmt = /^-?\$/.test(txt.trim());
          if (isAmt) {
            doc.text(txt, x+colW[i]-5, baseline, { align:'right' });
          } else {
            const lines = doc.splitTextToSize(txt, colW[i]-9);
            doc.text(lines[0]||'', x+5, baseline);
          }
          x += colW[i];
        });
        return y + TBL_H;
      };

      // ── Totals / summary row (LBLUE bg) ───────────────────────────────────
      const totalRow = (label: string, val: string, y: number): number => {
        doc.setFillColor(...LBLUE); doc.rect(M, y, TW, TBL_H+2, 'F');
        const baseline = y + (TBL_H+2)*0.7;
        doc.setFont(FONT,'bold'); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
        doc.text(S(label), M+5, baseline);
        doc.text(S(val), M+TW-5, baseline, { align:'right' });
        doc.setTextColor(...BLACK);
        return y + TBL_H + 2;
      };

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 1 — Cover
      // ══════════════════════════════════════════════════════════════════════
      topBar(); pgFoot();

      // "Prepared For" band
      doc.setFillColor(...NAVY); doc.rect(M, 46, TW, 22, 'F');
      doc.setFont(FONT,'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
      doc.text('Prepared For', M+8, 61); doc.setTextColor(...BLACK);

      doc.setFont(FONT,'bold'); doc.setFontSize(22);
      doc.text(S(data.clientName||'-'), M, 106);

      // "Prepared By" band
      doc.setFillColor(...NAVY); doc.rect(M, 124, TW, 22, 'F');
      doc.setFont(FONT,'bold'); doc.setFontSize(9); doc.setTextColor(...WHITE);
      doc.text('Prepared By:', M+8, 139); doc.setTextColor(...BLACK);

      doc.setFont(FONT,'bold');  doc.setFontSize(16); doc.text('Chidambaranathan Alagar', M, 172);
      doc.setFont(FONT,'normal'); doc.setFontSize(10); doc.text('AnuNathan Financial Group', M, 188);

      doc.setFont(FONT,'bold');  doc.setFontSize(8.5); doc.text('Email:', M, 208);
      doc.setFont(FONT,'normal'); doc.setTextColor(26,86,219);
      doc.text('chidam.alagar@gmail.com', M+38, 208);
      doc.setTextColor(...BLACK);

      doc.setFont(FONT,'bold');  doc.setFontSize(8.5); doc.text('Analysis Date:', M, 224);
      doc.setFont(FONT,'normal'); doc.text(S(data.analysisDate||mmddyyyy), M+76, 224);

      // Disclaimer text blocks
      doc.setFont(FONT,'bold');  doc.setFontSize(8.5); doc.text('In the USA:', M, 248);
      doc.setFont(FONT,'normal'); doc.setFontSize(7.5);
      const usaL = doc.splitTextToSize('Hegemon Group International, (HGI) is a marketing company offering a vast array of products and services through a network of independent affiliates. HGI does not provide insurance products, legal or tax advice. Insurance products offered through Hegemon Financial Group (HFG); and in California, insurance products offered through Hegemon Insurance Solutions. California License #0I0198. World Headquarters: 11405 Old Roswell Rd, Alpharetta GA 30009.', TW-44);
      doc.text(usaL, M+44, 248);
      const uY = 248 + usaL.length*10;

      doc.setFont(FONT,'bold');  doc.setFontSize(8.5); doc.text('In Canada:', M, uY+14);
      doc.setFont(FONT,'normal'); doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize('Hegemon Group International of Canada ULC (HGI) is a life insurance agency and marketing company. Canada Headquarters: 2866 Portland Drive, Oakville, ON L6H5W8.', TW-44), M+44, uY+14);

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 2 — Important Disclaimer
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); let y = topBar(); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Important Disclaimer', M, y+22); y+=44;
      doc.setFont(FONT,'normal'); doc.setFontSize(8.5);
      const discParas = [
        'This analysis provides only broad, general guidelines, which may be helpful in determining your personal financial needs. It can serve as a guide for discussions with your professional advisors. Each of the recommendations in this analysis are calculated independently and are not intended to be a comprehensive financial plan.',
        'Calculations contained in this analysis are estimates only based on the information you provided, such as the value of your assets today and the rate at which the assets appreciate. The actual values, rates of growth, and tax rates may be significantly different from those illustrated. No guarantee can be made regarding values as all rates are the hypothetical rates you provided. These computations are not a guarantee of future performance of any asset, including insurance or other financial products.',
        'No legal or accounting advice is being rendered either by this report or through any other oral or written communications. Nothing in this report is intended to be used on any tax form or to support any tax deduction. State laws vary regarding the distribution of property. You should discuss all strategies, transfers, and assumptions with your legal and tax advisors.',
        'To implement a strategy, it may be necessary to restructure the ownership of property, or change designated beneficiaries before specific will or trust provisions become effective. The transfer of a life insurance policy may not result in its removal from the estate of the prior owner for three years.',
        'IMPORTANT: The projections generated by this financial needs analysis tool regarding the likelihood of various investment outcomes are hypothetical in nature, do not reflect actual investment results, and are not guarantees of future results. All investments involve risk, including the loss of principal.',
      ];
      discParas.forEach(p => {
        if (y > PH-72) { doc.addPage(); y = topBar()+24; pgFoot(); }
        const ls = doc.splitTextToSize(p, TW);
        doc.text(ls, M, y); y += ls.length*11.5+10;
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 3 — Confirmation of Facts
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = topBar(); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Confirmation of Facts', M, y+22); y+=44;

      // Two-column layout constants
      const C1 = M;
      const C2 = M + TW/2 + 10;
      const LW = 112;  // label width for kv rows

      // ── Client Information ──────────────────────────────────────────────
      y = banner('Client Information', y);
      const cliRows: [string,string,string,string][] = [
        ['Client Name',   data.clientName||'-',              'Country',    'USA'],
        ['Date of Birth', S(data.dob||data.clientDob||'-'), 'State',      data.state||'-'],
        ['Cell Phone',    data.clientPhone||'-',             'Gender',     '-'],
        ['Email',         data.clientEmail||'-',             'Height',     'N/A'],
        ['City / State',  `${data.city||''}, ${data.state||''}`.replace(/^,\s*/,'').trim()||'-', 'Weight', '-'],
        ['Analysis Date', S(data.analysisDate||mmddyyyy),   'Ret. Age',   String(data.plannedRetirementAge)],
      ];
      cliRows.forEach(([l1,v1,l2,v2]) => {
        if (y > PH-64) { doc.addPage(); y = topBar()+30; pgFoot(); }
        // Light zebra for readability
        kv(l1, v1, C1, y, LW);
        kv(l2, v2, C2, y, LW);
        y += KV_H;
        hr(y-3);
      });
      y += 14;

      // ── Spouse Information ──────────────────────────────────────────────
      y = banner('Spouse Information', y);
      const spRows: [string,string,string,string][] = [
        ['Spouse Name',  data.spouseName||'-',      'Gender', '-'],
        ['Date of Birth',S(data.spouseDob||'-'),    'Height', 'N/A'],
        ['Cell Phone',   '-',                       'Weight', '-'],
        ['Email',        '-',                       '',       ''],
      ];
      spRows.forEach(([l1,v1,l2,v2]) => {
        kv(l1, v1, C1, y, LW);
        if (l2) kv(l2, v2, C2, y, LW);
        y += KV_H;
        hr(y-3);
      });
      y += 14;

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 4 — Financial Summary
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = topBar('Financial Summary'); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Financial Summary', M, y+22); y+=44;

      // ── 6-cell summary strip (3 cols x 2 rows) ─────────────────────────
      // Each cell: label on its own line (bold), value below (normal)
      const SH = 42;
      doc.setFillColor(...LBLUE); doc.rect(M, y, TW, SH, 'F');
      const T3 = TW/3;
      const cells6: [string,string][] = [
        ['Total Assets',        $f(totalPresent)],
        ['Annual Income',       $f(assets.s6_present||0)],
        ['Planning Req.',       $f(data.totalRequirement)],
        ['Total Liabilities',   $f(totalLiabilities)],
        ['Net Worth',           $f(netWorth)],
        [`GAP @ ${data.plannedRetirementAge}`, $f(Gap)],
      ];
      cells6.forEach(([lbl, val], i) => {
        const col = i%3, row = Math.floor(i/3);
        const cx  = M + col*T3 + 7;
        const cy1 = y + 10 + row*18;   // label baseline
        const cy2 = cy1 + 10;           // value baseline
        doc.setFont(FONT,'bold');   doc.setFontSize(7.5); doc.setTextColor(...NAVY);
        doc.text(S(lbl)+':', cx, cy1);
        doc.setFont(FONT,'normal'); doc.setFontSize(8);   doc.setTextColor(50,50,50);
        doc.text(S(val), cx, cy2);
      });
      doc.setTextColor(...BLACK); y += SH + 12;

      // ── Income ─────────────────────────────────────────────────────────
      y = banner('Income', y);
      const incPairs: [string,string,string,string][] = [
        ['Client Annual Income',   $f(assets.s6_present||0), 'Client Occupation',   '-'],
        ['Spouse Annual Income',   '$0.00',                   'Spouse Occupation',   '-'],
        ['Yrs to Retirement',      String(data.yearsToRetirement||0), 'Interest Rate', `${data.calculatedInterestPercentage}%`],
      ];
      incPairs.forEach(([l1,v1,l2,v2], i) => {
        if (i%2===0) { doc.setFillColor(...LGRAY); doc.rect(M,y,TW,KV_H,'F'); }
        kv(l1,v1,C1,y,140); kv(l2,v2,C2,y,130);
        y+=KV_H; hr(y-3);
      }); y+=12;

      // ── Mortgage / Properties ──────────────────────────────────────────
      y = banner('Mortgage / Properties', y);
      const morts = liabilityRows.filter(r=>String(r.liability_type||'').toLowerCase().includes('mortgage'));
      if (!morts.length) {
        doc.setFont(FONT,'italic'); doc.setFontSize(8.5); doc.setTextColor(...DGRAY);
        doc.text('No mortgage recorded.', M, y+8); doc.setTextColor(...BLACK); y+=20;
      } else {
        const mC=[134,100,112,82,84];
        y=thead(['Lender / Type','Balance','Monthly Payment','Int. Rate','Notes'],y,mC);
        morts.forEach((r,i)=>{ y=trow([S(r.lender||r.liability_type||'-'), $f(Number(r.balance)||0), $f(Number(r.current_payment||r.min_payment)||0), r.interest_rate!=null?`${r.interest_rate}%`:'-', S(String(r.notes||'').substring(0,20))],y,mC,false,i%2===0?LGRAY:undefined); });
      }
      y+=12;

      // ── Retirement ─────────────────────────────────────────────────────
      y = banner('Retirement', y);
      const retPairs: [string,string,string,string][] = [
        ['Retirement Savings Desired', $f(data.totalRetirementIncome), 'Current Age', String(data.currentAge||'-')],
        ['Planned Retirement Age',     String(data.plannedRetirementAge), 'Years to Retirement', String(data.yearsToRetirement||0)],
        ['Annual Income Needed',       $f(data.annualRetirementIncome), 'Monthly (Today)',     $f(data.monthlyIncomeNeeded)],
        ['Monthly @ Ret. (3% infl.)', $f(data.monthlyRetirementIncome), 'Retirement Years',    String(data.retirementYears||0)],
      ];
      retPairs.forEach(([l1,v1,l2,v2],i)=>{
        if(i%2===0){doc.setFillColor(...LGRAY);doc.rect(M,y,TW,KV_H,'F');}
        kv(l1,v1,C1,y,145); kv(l2,v2,C2,y,130);
        y+=KV_H; hr(y-3);
      }); y+=12;

      // ── Monthly Expenses ───────────────────────────────────────────────
      if (y>PH-130){ doc.addPage(); y=topBar('Financial Summary (cont.)')+30; pgFoot(); }
      y = banner('Monthly Expenses', y);
      const totalMortPmt = liabilityRows.filter(r=>String(r.liability_type||'').toLowerCase().includes('mortgage')).reduce((s,r)=>s+(parseFloat(String(r.current_payment||r.min_payment||0))||0),0);
      const expPairs: [string,string,string,string][] = [
        ['All Mortgages',     $f(totalMortPmt),              'Retirement Plans', $f(data.monthlyIncomeNeeded)],
        ['Rent',              '$0.00',                        'Health Insurance', '$0.00'],
        ['Groceries',         '$0.00',                        'Cell Phone',       '$0.00'],
        ['Gasoline',          '$0.00',                        'Entertainment',    '$0.00'],
        ['Savings / Liquid',  '$0.00',                        'Other',            '$0.00'],
      ];
      expPairs.forEach(([l1,v1,l2,v2],i)=>{
        if(i%2===0){doc.setFillColor(...LGRAY);doc.rect(M,y,TW,KV_H,'F');}
        kv(l1,v1,C1,y,120); kv(l2,v2,C2,y,120);
        y+=KV_H; hr(y-3);
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 5 — Assets Summary
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y=topBar('Assets'); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Assets Summary', M, y+22); y+=44;

      const aC=[198,34,34,98,148];  // desc | him | her | present | projected
      y=thead(['Asset Description','Him','Her','Present Value',`Projected @ ${data.plannedRetirementAge} (${data.calculatedInterestPercentage}%)`],y,aC);

      const aRows:[string,boolean,boolean,number,number][]=[
        ['Current 401K / 403B',          assets.r1_him,assets.r1_her,assets.r1_present,assets.r1_proj||autoProj(assets.r1_present)],
        ['Company Match %',              assets.r2_him,assets.r2_her,assets.r2_present,0],
        ['Max Funding (~$23K)?',         assets.r3_him,assets.r3_her,assets.r3_present,assets.r3_proj||0],
        ['Previous 401K / Rollover',     assets.r4_him,assets.r4_her,assets.r4_present,assets.r4_proj||autoProj(assets.r4_present)],
        ['Traditional IRA / SEP-IRA',   assets.r5_him,assets.r5_her,assets.r5_present,autoProj(assets.r5_present)],
        ['Roth IRA / Roth 401K',         assets.r6_him,assets.r6_her,assets.r6_present,autoProj(assets.r6_present)],
        ['ESPP / RSU / Annuities',       assets.r7_him,assets.r7_her,assets.r7_present,assets.r7_proj||0],
        ['Personal Home',                assets.e1_him,assets.e1_her,assets.e1_present,assets.e1_proj||0],
        ['Real Estate / Rentals',        assets.e2_him,assets.e2_her,assets.e2_present,assets.e2_proj||0],
        ['Real Estate Land',             assets.e3_him,assets.e3_her,assets.e3_present,assets.e3_proj||0],
        ['Inheritance (USA)',            assets.e4_him,assets.e4_her,assets.e4_present,assets.e4_proj||0],
        ['Stocks / MFs / Bonds / ETFs', assets.s1_him,assets.s1_her,assets.s1_present,assets.s1_proj||0],
        ['Business Ownership',           assets.s2_him,assets.s2_her,assets.s2_present,assets.s2_proj||0],
        ['Alternative Investments',      assets.s3_him,assets.s3_her,assets.s3_present,assets.s3_proj||0],
        ['CDs (Certificate of Deposit)', assets.s4_him,assets.s4_her,assets.s4_present,autoProj(assets.s4_present)],
        ['Cash in Bank / Emergency',     assets.s5_him,assets.s5_her,assets.s5_present,assets.s5_proj||0],
        ['Annual Household Income',      assets.s6_him,assets.s6_her,assets.s6_present,assets.s6_proj||0],
        ['Annual Savings Forward',       assets.s7_him,assets.s7_her,assets.s7_present,assets.s7_proj||0],
        ['Life Insurance (Work)',        assets.f1_him,assets.f1_her,assets.f1_present,0],
        ['Life Insurance (Outside)',     assets.f2_him,assets.f2_her,assets.f2_present,assets.f2_proj||0],
        ['Cash Value Life Insurance',    assets.f3_him,assets.f3_her,assets.f3_present,assets.f3_proj||0],
        ['HSA',                          assets.f7_him,assets.f7_her,assets.f7_present,assets.f7_proj||0],
        ['529 College Plans',            assets.c1_c1, assets.c1_c2, assets.c1_present,assets.c1_proj||0],
        ['Foreign Real Estate',          assets.x1_him,assets.x1_her,assets.x1_present,assets.x1_proj||0],
        ['Foreign Non-Real Estate',      assets.x2_him,assets.x2_her,assets.x2_present,assets.x2_proj||0],
      ];
      aRows.forEach((r,i)=>{
        if(y>PH-50){doc.addPage();y=topBar('Assets (cont.)')+28;pgFoot();}
        const pv=r[3], pj=r[4];
        y=trow([S(r[0]),yn(r[1]),yn(r[2]),pv>0?$f(pv):'',pj>0?$f(pj):(pv>0?'N/A':'')],y,aC,false,i%2===0?LGRAY:undefined);
      });
      if(y>PH-44){doc.addPage();y=topBar('Assets (cont.)')+28;pgFoot();}
      // Assets totals row
      doc.setFillColor(...LBLUE); doc.rect(M,y,TW,TBL_H+2,'F');
      doc.setFont(FONT,'bold'); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
      doc.text('TOTAL ASSETS', M+5, y+(TBL_H+2)*0.7);
      // Present total under 4th col
      const pvX = M+aC[0]+aC[1]+aC[2];
      doc.text($f(totalPresent), pvX+aC[3]-5, y+(TBL_H+2)*0.7, {align:'right'});
      // Projected total under 5th col
      doc.text($f(totalProjected), M+TW-5, y+(TBL_H+2)*0.7, {align:'right'});
      doc.setTextColor(...BLACK); y+=TBL_H+2+14;

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 6 — Liabilities (always new page)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y=topBar('Liabilities'); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Liabilities', M, y+22); y+=44;

      if(!liabilityRows.length){
        doc.setFont(FONT,'italic'); doc.setFontSize(9); doc.setTextColor(...DGRAY);
        doc.text('No liabilities recorded.', M, y+8); doc.setTextColor(...BLACK); y+=22;
      } else {
        const lC=[108,88,88,90,70,68];
        y=thead(['Type','Description','Lender','Balance','Min Pmt','Cur Pmt'],y,lC);
        liabilityRows.forEach((r,i)=>{
          if(y>PH-50){doc.addPage();y=topBar('Liabilities (cont.)')+28;pgFoot();}
          y=trow([S(String(r.liability_type||'').substring(0,16)),S(String(r.description||'-').substring(0,14)),S(String(r.lender||'-').substring(0,14)),$f(Number(r.balance)||0),$f(Number(r.min_payment)||0),$f(Number(r.current_payment)||0)],y,lC,false,i%2===0?LGRAY:undefined);
        });
        if(y>PH-44){doc.addPage();y=topBar('Liabilities (cont.)')+28;pgFoot();}
        y=totalRow('TOTAL LIABILITIES', $f(totalLiabilities), y); y+=8;
      }

      // GAP analysis box
      if(y>PH-82){doc.addPage();y=topBar()+28;pgFoot();}
      const gapBg:[number,number,number]=Gap>0?[255,238,238]:[237,253,237];
      const gapBdr:[number,number,number]=Gap>0?RED:GRN;
      doc.setFillColor(...gapBg); doc.rect(M,y,TW,56,'F');
      doc.setFillColor(...gapBdr); doc.rect(M,y,5,56,'F'); // left colour bar
      doc.setFont(FONT,'bold'); doc.setFontSize(10); doc.setTextColor(...BLACK);
      doc.text(`GAP @ Retirement Age ${data.plannedRetirementAge}:`, M+12, y+16);
      doc.setTextColor(...gapBdr);
      doc.text(S($f(Gap)), PW-M-8, y+16, {align:'right'});
      doc.setTextColor(...BLACK);
      doc.setFont(FONT,'normal'); doc.setFontSize(7.5);
      doc.text(S(`= Total Planning (${$f(data.totalRequirement)}) - Projected Assets @ ${data.plannedRetirementAge} (${$f(totalProjected)}) - Liabilities (${$f(totalLiabilities)})`), M+12, y+30);
      doc.setFont(FONT,'bold'); doc.setFontSize(8.5); doc.setTextColor(...gapBdr);
      doc.text(Gap>0?'SHORTFALL - Additional planning needed to meet retirement goals':'SURPLUS - Projected assets exceed total planning requirements', M+12, y+46);
      doc.setTextColor(...BLACK); y+=64;

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 7 — Financial Goals & Planning
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y=topBar('Financial Goals & Planning'); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Financial Goals & Planning', M, y+22); y+=44;

      const gC=[32,322,158];  // # | description | amount

      // Retirement Planning
      y=banner('Retirement Planning',y);
      y=thead(['#','Description','Amount'],y,gC);
      const retGR:[string,string,string][]=[
        ['#5',  'Current Age',                                      String(data.currentAge||0)],
        ['#6',  `Years To Retirement (${data.plannedRetirementAge} - Current Age)`, String(data.yearsToRetirement||0)],
        ['#7',  'Retirement Years (85 - Planned Ret. Age)',          String(data.retirementYears||0)],
        ['#8',  "Monthly Income Needed (Today's Dollars)",           $f(data.monthlyIncomeNeeded)],
        ['#9',  'Monthly Income Needed (At Retirement @ 3%)',        $f(data.monthlyRetirementIncome)],
        ['#10', 'Annual Retirement Income Needed',                   $f(data.annualRetirementIncome)],
        ['#11', 'Total Retirement Income Needed',                    $f(data.totalRetirementIncome)],
      ];
      retGR.forEach((r,i)=>{
        const last=i===retGR.length-1;
        y=trow(r,y,gC,last,!last&&i%2===0?LGRAY:undefined);
      }); y+=12;

      // College & Wedding
      if(y>PH-110){doc.addPage();y=topBar('Goals (cont.)')+28;pgFoot();}
      y=banner('College & Wedding Planning',y);
      y=thead(['#','Description','Amount'],y,gC);
      ([
        ['#1',`Child 1 College: ${S(data.child1CollegeName||'')}`, $f(data.child1CollegeAmount)],
        ['#2',`Child 2 College: ${S(data.child2CollegeName||'')}`, $f(data.child2CollegeAmount)],
        ['#3',`Child 1 Wedding: ${S(data.child1CollegeName||'')}`, $f(data.child1WeddingAmount)],
        ['#4',`Child 2 Wedding: ${S(data.child2CollegeName||'')}`, $f(data.child2WeddingAmount)],
      ] as [string,string,string][]).forEach((r,i)=>{
        y=trow(r,y,gC,false,i%2===0?LGRAY:undefined);
      }); y+=12;

      // Healthcare
      if(y>PH-84){doc.addPage();y=topBar('Goals (cont.)')+28;pgFoot();}
      y=banner('Healthcare Planning',y);
      y=thead(['#','Description','Amount'],y,gC);
      y=trow(['#12',`Healthcare Expenses  (${S(data.healthcareNote1||'')})`, $f(data.healthcareExpenses)],y,gC,false,LGRAY);
      y=trow(['#13','Long-Term Care (3% x years x 2)',                        $f(data.longTermCare)],y,gC);
      y+=12;

      // Life Goals & Legacy
      if(y>PH-150){doc.addPage();y=topBar('Goals (cont.)')+28;pgFoot();}
      y=banner('Life Goals & Legacy Planning',y);
      y=thead(['#','Description','Amount'],y,gC);
      ([
        ['#14','Travel Budget',              $f(data.travelBudget)],
        ['#15','Vacation Home',              $f(data.vacationHome)],
        ['#16','Charity / Giving',           $f(data.charity)],
        ['#17','Other Goals',                $f(data.otherGoals)],
        ['#18','Headstart Fund (Grandkids)', $f(data.headstartFund)],
        ['#19','Family Legacy',              $f(data.familyLegacy)],
        ['#20','Family Support',             $f(data.familySupport)],
      ] as [string,string,string][]).forEach((r,i)=>{
        y=trow(r,y,gC,false,i%2===0?LGRAY:undefined);
      }); y+=12;

      // Total Requirement highlight row
      if(y>PH-38){doc.addPage();y=topBar()+28;pgFoot();}
      doc.setFillColor(255,255,130); doc.rect(M,y,TW,TBL_H+4,'F');
      doc.setFont(FONT,'bold'); doc.setFontSize(10); doc.setTextColor(30,80,30);
      doc.text('TOTAL REQUIREMENT', M+7, y+(TBL_H+4)*0.7);
      doc.text(S($f(data.totalRequirement)), M+TW-7, y+(TBL_H+4)*0.7, {align:'right'});
      doc.setTextColor(...BLACK); y+=TBL_H+16;

      // ══════════════════════════════════════════════════════════════════════
      // FINANCIAL RECOMMENDATIONS PAGE
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y=topBar('Financial Recommendations'); pgFoot();
      doc.setFont(FONT,'bold'); doc.setFontSize(15); doc.text('Financial Recommendations', M, y+22); y+=44;

      doc.setFont(FONT,'normal'); doc.setFontSize(8.5);
      const introTxt = `Based on the financial profile of ${S(data.clientName)}, the following recommendations are provided as educational guidance. Please consult a qualified financial advisor before making financial decisions.`;
      const introL = doc.splitTextToSize(introTxt, TW);
      doc.text(introL, M, y); y+=introL.length*11.5+14;

      const suggs=buildSuggestions(totalPresent,totalLiabilities,data.totalRequirement,totalProjected,Gap,data.yearsToRetirement,data.calculatedInterestPercentage);
      suggs.forEach(s=>{
        if(y>PH-72){doc.addPage();y=topBar('Recommendations (cont.)')+28;pgFoot();}
        const bdrClr:[number,number,number]=s.kind==='warn'?[200,80,30]:s.kind==='good'?[30,140,60]:[60,100,200];
        const bgClr: [number,number,number]=s.kind==='warn'?[255,244,228]:s.kind==='good'?[232,252,232]:[230,240,255];
        const sL=doc.splitTextToSize(S(s.text), TW-16);
        const boxH=sL.length*11+16;
        doc.setFillColor(...bgClr); doc.rect(M,y,TW,boxH,'F');
        doc.setFillColor(...bdrClr); doc.rect(M,y,5,boxH,'F');
        doc.setFont(FONT,'normal'); doc.setFontSize(8.5); doc.setTextColor(...BLACK);
        doc.text(sL, M+12, y+11.5);
        y+=boxH+8;
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGES 8-13 — Merge template pages via pdf-lib (with images)
      //              Requires: /public/FNA_Report_Template.pdf
      //              Fallback:  text-only standard pages
      // ══════════════════════════════════════════════════════════════════════
      let templateMerged=false;
      try {
        const PDFDocument: any = await new Promise((res,rej)=>{
          if((window as any).PDFLib?.PDFDocument){res((window as any).PDFLib.PDFDocument);return;}
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
          s.onload=()=>(window as any).PDFLib?.PDFDocument?res((window as any).PDFLib.PDFDocument):rej(new Error('pdf-lib not found'));
          s.onerror=()=>rej(new Error('pdf-lib CDN load failed'));
          document.head.appendChild(s);
        });
        const clientBytes = doc.output('arraybuffer');
        const clientPdf: any = await PDFDocument.load(clientBytes);
        const tplResp = await fetch('/FNA_Report_Template.pdf');
        if(tplResp.ok){
          const tplBytes=await tplResp.arrayBuffer();
          const tplPdf: any=await PDFDocument.load(tplBytes);
          const tplCount=tplPdf.getPageCount();
          const idxs: number[]=[];
          for(let i=5;i<Math.min(tplCount,12);i++) idxs.push(i);
          const copied=await clientPdf.copyPages(tplPdf,idxs);
          copied.forEach((p: any)=>clientPdf.addPage(p));
          const finalBytes=await clientPdf.save();
          const blob=new Blob([finalBytes],{type:'application/pdf'});
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');
          const safeName=S(data.clientName).replace(/[^a-zA-Z0-9 ]/g,'').replace(/\s+/g,'_');
          a.href=url; a.download=`${safeName}_${mmddyyyy}.pdf`; a.click();
          URL.revokeObjectURL(url);
          templateMerged=true;
        }
      } catch(_){}

      if(!templateMerged){
        // Fallback text-only standard pages
        const stdPgs=[
          {title:'Your Financial Lifestyle Strategies',secs:[
            {h:'',         b:'This analysis provides broad general guidelines to help determine your personal financial needs and serve as a guide for discussions with your professional advisors.'},
            {h:'Estate Preservation & Legal Protection', b:'Review wills, living wills, healthcare power of attorney, and legal representation for you and your spouse.'},
            {h:'Debt & Credit Management', b:`Monthly Debt Payments: ${$f(liabilityRows.reduce((s,r)=>s+(parseFloat(String(r.min_payment||0))||0),0))} | Total Liabilities: ${$f(totalLiabilities)} | Net Worth: ${$f(netWorth)}`},
          ]},
          {title:'6 Steps to Financial Security',secs:[
            {h:'',b:'As you move through these 6 Steps to Financial Security your HGI Associate will guide you to suitable products and solutions.'},
            {h:'Step 1 - Increase Cash Flow',b:'Earn additional income. Manage expenses.'},
            {h:'Step 2 - Debt Management',  b:'Consolidate high-interest debt. Eliminate debt systematically.'},
            {h:'Step 3 - Emergency Fund',   b:'Build 3-6 months of income in liquid savings.'},
            {h:'Step 4 - Proper Protection',b:'Insure against loss of income. Protect family assets.'},
            {h:'Step 5 - Build Wealth',     b:'Invest consistently. Outpace inflation.'},
            {h:'Step 6 - Preserve Wealth',  b:'Avoid probate. Reduce taxation. Create estate plan.'},
          ]},
          {title:'The Wealth Flow Formula',secs:[
            {h:'',b:'The Wealth Flow Formula shows the relationship between your responsibilities and wealth building.'},
            {h:'Theory of Decreasing Responsibility',b:'Term Life Insurance replaces wealth you have not yet accumulated. Young children, high debt and a mortgage mean loss of income would be devastating.'},
            {h:'Law of Building Equity',b:'As wealth accumulates and responsibilities decrease, Permanent Life Insurance protects against longevity, taxes, and estate transfer needs.'},
          ]},
          {title:'The Rule of 72',secs:[
            {h:'',b:'Divide 72 by your rate of return to find how many years for money to double. Make compound interest work FOR you.'},
            {h:'Doubling Times',b:`2% = 36 yrs | 4% = 18 yrs | 6% = 12 yrs | 8% = 9 yrs | 12% = 6 yrs\nAt ${data.calculatedInterestPercentage}%: doubles every ${Math.round(72/data.calculatedInterestPercentage)} years`},
          ]},
          {title:'Time & Consistency',secs:[
            {h:'',b:'Time, consistency, and compound interest are all it takes. Start now - every year of delay has an exponential cost.'},
            {h:'High Cost of Waiting ($100/month at 12%)',b:'Age 25 start = $979,307 at 65\nAge 26 start = $873,241 at 65  (Cost: $106,066)\nAge 30 start = $551,083 at 65  (Cost: $428,224)'},
          ]},
          {title:'Your HGI Associate',secs:[
            {h:'HGI Associate Details',b:'Name: Chidambaranathan Alagar\nCode: CAE4E3CF\nEmail: chidam.alagar@gmail.com\nPhone: 4029578693'},
            {h:'Advisor Notes',b:(data.notes&&!data.notes.startsWith('__ASSETS__'))?S(data.notes):'No advisor notes recorded.'},
            {h:'',b:`Report for: ${S(data.clientName)} | Generated: ${mmddyyyy}\nRet. Age: ${data.plannedRetirementAge} | Rate: ${data.calculatedInterestPercentage}%`},
          ]},
        ];
        stdPgs.forEach(pg=>{
          doc.addPage(); let py=topBar(); pgFoot();
          // Page title
          doc.setFont(FONT,'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
          doc.text(S(pg.title), M, py+18); doc.setTextColor(...BLACK); py+=32;

          pg.secs.forEach(sec=>{
            if(py>PH-70){doc.addPage();py=topBar()+18;pgFoot();}

            if(sec.h){
              // Banner — tight spacing: body text starts immediately after
              py=banner(sec.h, py);
              // No extra gap — body text follows directly below banner
            } else if(sec.b){
              // Intro paragraph (no banner) — small top margin only on first item
              py+=4;
            }

            // Body text — compact line spacing
            doc.setFont(FONT,'normal'); doc.setFontSize(8.5);
            const bodyLines = sec.b.split('\n');
            bodyLines.forEach((line, li)=>{
              if(py>PH-48){doc.addPage();py=topBar()+18;pgFoot();}
              const ll=doc.splitTextToSize(S(line), TW);
              doc.text(ll, M, py);
              // Tight line spacing: 10pt between lines within same block
              py += ll.length*10.5 + (li<bodyLines.length-1 ? 2 : 0);
            });

            // Gap BETWEEN sections — small breathing room only
            py += sec.h ? 10 : 8;
          });
        });

        // Disclaimer footer on last page
        doc.setFillColor(30,30,30); doc.rect(M,PH-52,TW,26,'F');
        doc.setFont(FONT,'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE);
        doc.text('DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE.', PW/2, PH-38, {align:'center'});
        doc.setFont(FONT,'normal'); doc.setFontSize(7);
        doc.text('All projections are hypothetical estimates. Past performance does not guarantee future results.', PW/2, PH-28, {align:'center'});
        doc.setTextColor(...BLACK);

        const safeName=S(data.clientName).replace(/[^a-zA-Z0-9 ]/g,'').replace(/\s+/g,'_');
        doc.save(`${safeName}_${mmddyyyy}.pdf`);
      }

      showMessage('Report downloaded!', 'success');
    } catch(err: any){
      console.error('PDF error:',err);
      alert(`Report failed: ${err?.message}\n\nFor template pages: place FNA_Report_Template.pdf in /public folder`);
    } finally {
      setReportGenerating(false);
    }
  };






// ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-3 pt-3 mb-3">
      <PageHeader
        title="Client Financial Need Analysis"
        subtitle="Build your career. Protect their future"
        onLogout={handleLogout}
        actions={
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={handleToggleAllCards} disabled={loading} className={btnGhost}>
              {loading ? '⏳ Loading…' : cardsExpanded ? 'Hide Cards 📦' : 'Show Cards 🗃️'}
            </button>
            <button onClick={handleClear} className={btnGhost}>Refresh</button>
          </div>
        }
      />
      </div>

      <main className="max-w-7xl mx-auto px-3 pb-6" ref={contentRef}>

        {/* Client Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
          <h3 className="text-xs font-bold text-gray-800 mb-2 pb-1 border-b">📋 Client Information</h3>

          {/* Row 1: Client Name* | Phone | Email | Client DOB */}
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '2fr 1fr 1.4fr 1fr' }}>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Client Name *</label>
              <select value={data.clientId} disabled={loading}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none">
                <option value="">-- Select Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Phone Number</label>
              <input readOnly value={data.clientPhone} className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100 truncate" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Email</label>
              <input readOnly value={data.clientEmail} className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100 truncate" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Client Date of Birth</label>
              <input type="date" value={data.dob}
                onChange={e => setData(p => ({ ...p, dob: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          {/* Row 2: Spouse Name | Spouse DOB | City | State */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Spouse Name</label>
              <input value={data.spouseName} onChange={e => setData(p => ({ ...p, spouseName: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Spouse Date of Birth</label>
              <input type="date" value={data.spouseDob}
                onChange={e => setData(p => ({ ...p, spouseDob: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">City</label>
              <input readOnly value={data.city} className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">State</label>
              <input readOnly value={data.state} className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
          </div>

          {/* Row 3: Planned Retirement Age | Interest% | Analysis Date */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Planned Retirement Age</label>
              <select value={data.plannedRetirementAge}
                onChange={e => setData(p => ({ ...p, plannedRetirementAge: parseInt(e.target.value) || 65 }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none">
                {Array.from({ length: 58 }, (_, i) => i + 50).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Interest% to calculate</label>
              <select value={data.calculatedInterestPercentage}
                onChange={e => setData(p => ({ ...p, calculatedInterestPercentage: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none">
                {[3,4,5,6,7,8,9,10,11,12,13,14,15].map(p => <option key={p} value={p}>{p}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Analysis Date</label>
              <input type="date" value={data.analysisDate}
                onChange={e => setData(p => ({ ...p, analysisDate: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          {/* Row 4: Note — full-width multi-line textarea */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-600">Note</label>
            <textarea
              value={data.notes}
              placeholder="Add notes..."
              rows={3}
              onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none resize-y leading-relaxed"
              style={{ minHeight: 56 }}
            />
          </div>
          {yearsToRetirement > 0 && (
            <p className="mt-1.5 text-xs text-blue-600 font-medium">
              📅 Investment length: <strong>{yearsToRetirement} yrs</strong> | Projection: FV = PV × (1 + {data.calculatedInterestPercentage}%)^{yearsToRetirement}
            </p>
          )}
           <div className="mt-1.5 border-t border-gray-200 pt-1.5 text-xs text-gray-700">
            {(() => {
              const totalLiabilities = liabilityRows.reduce((s, r) => {
                const n = parseFloat(String(r.balance ?? "").replace(/[$,\s]/g, ""));
                return s + (Number.isFinite(n) ? n : 0);
              }, 0);
              const netWorth = totalPresent - totalLiabilities;
              const Gap = data.totalRequirement - totalProjected - totalLiabilities;
              const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const gapTooltip = `GAP @ Planned Retirement Age ${data.plannedRetirementAge}:\n= Total Goal Planning (${fmt(data.totalRequirement)})\n− Projected Assets @ ${data.plannedRetirementAge} (${data.calculatedInterestPercentage}%) for ${yearsToRetirement} yrs (${fmt(totalProjected)})\n− Total Liabilities (${fmt(totalLiabilities)})\n= ${fmt(Gap)}`;
              return (
                <span>
                  Total Assets: {fmt(totalPresent)}&nbsp;&nbsp;|&nbsp;&nbsp;
                  Total Liabilities: {fmt(totalLiabilities)}&nbsp;&nbsp;|&nbsp;&nbsp;
                  Net Worth: <span style={{ color: netWorth >= 0 ? '#15803d' : '#dc2626' }}>{fmt(netWorth)}</span>&nbsp;&nbsp;|&nbsp;&nbsp;
                  Total Planning: {fmt(data.totalRequirement)}&nbsp;&nbsp;|&nbsp;&nbsp;
                  <span title={gapTooltip} style={{ cursor: 'help', borderBottom: '1px dotted #6b7280' }}>GAP @ {data.plannedRetirementAge}:</span>
                  {' '}<span style={{ color: Gap <= 0 ? '#15803d' : '#dc2626' }}>{fmt(Gap)}</span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* SAVE BUTTON — below Client Information */}
        <div className="flex items-center justify-end gap-2 mb-3">
          <a href="https://www.calculator.net/" target="_blank" rel="noopener noreferrer" className={btnGhost}>🧮 Calculator</a>
          <button onClick={handleGenerateReport} disabled={reportGenerating || !data.clientId} className={btnGhost}>
            {reportGenerating ? '⏳ Generating…' : '📄 Report'}
          </button>
          <button onClick={handleSave} disabled={saving || loading || !data.clientId} className={btnSave}>
            {saving ? '💾 Saving…' : '💾 Save FNA'}
          </button>
          {message && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {message}
            </span>
          )}
        </div>

        {/* TABS */}
        <div className="mb-3 flex gap-2">
          {([
            { key: 'goals',       label: '🎯 Financial Goals & Planning' },
            { key: 'assets',      label: '💰 Assets' },
            { key: 'liabilities', label: '💳 Liabilities' },
          ] as const).map(({ key: tab, label }) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-1.5 rounded font-semibold text-xs transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════ GOALS TAB ═══════════════ */}
        {activeTab === 'goals' && (
          <div className="space-y-3">

            {/* College */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🎓" title="Kids College Planning" cardKey="college"
                extra={<a href="https://educationdata.org/average-cost-of-college-by-state#tx" target="_blank" rel="noopener noreferrer" className={btnGhost}>💰 Cost of College</a>} />
              {cardVisibility.college && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">Child Name</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">Notes</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">Amount</th>
                  </tr></thead>
                  <tbody>
                    {[{n:'#1',nf:'child1CollegeName',nn:data.child1CollegeName,nts:'child1CollegeNotes',ntv:data.child1CollegeNotes,af:'child1CollegeAmount',av:data.child1CollegeAmount},
                      {n:'#2',nf:'child2CollegeName',nn:data.child2CollegeName,nts:'child2CollegeNotes',ntv:data.child2CollegeNotes,af:'child2CollegeAmount',av:data.child2CollegeAmount}].map(r => (
                      <tr key={r.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{r.n}</td>
                        <td className="border border-black p-0"><input type="text" value={r.nn} placeholder="Child's name" onChange={e => setData(p => ({ ...p, [r.nf]: e.target.value }))} className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                        <NoteTd value={r.ntv} onChange={v => setData(p => ({ ...p, [r.nts]: v }))} />
                        <td className="border border-black p-0"><CurrencyInput value={r.av} placeholder="$0.00" onChange={val => setData(p => ({ ...p, [r.af]: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Wedding */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="💒" title="Kids Wedding" cardKey="wedding"
                extra={<a href="https://www.zola.com/expert-advice/whats-the-average-cost-of-a-wedding" target="_blank" rel="noopener noreferrer" className={btnGhost}>💍 Wedding Expenses</a>} />
              {cardVisibility.wedding && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">Child Name</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">Notes</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">Amount</th>
                  </tr></thead>
                  <tbody>
                    {[{n:'#3',label:data.child1CollegeName||'(From College #1)',nts:'child1WeddingNotes',ntv:data.child1WeddingNotes,af:'child1WeddingAmount',av:data.child1WeddingAmount},
                      {n:'#4',label:data.child2CollegeName||'(From College #2)',nts:'child2WeddingNotes',ntv:data.child2WeddingNotes,af:'child2WeddingAmount',av:data.child2WeddingAmount}].map(r => (
                      <tr key={r.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{r.n}</td>
                        <td className="border border-black px-2 py-1 text-xs bg-gray-50">{r.label}</td>
                        <NoteTd value={r.ntv} onChange={v => setData(p => ({ ...p, [r.nts]: v }))} />
                        <td className="border border-black p-0"><CurrencyInput value={r.av} placeholder="$0.00" onChange={val => setData(p => ({ ...p, [r.af]: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Retirement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏖️" title="Retirement Planning" cardKey="retirement" />
              {cardVisibility.retirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">Notes</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">Amount</th>
                  </tr></thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#5</td>
                      <td className="border border-black px-2 py-1 text-xs">Current Age</td>
                      <NoteTd value={data.retirementNote1} onChange={v => setData(p => ({ ...p, retirementNote1: v }))}/>
                      <td className="border border-black p-0">
                        <select value={data.currentAge || ''} onChange={e => setData(p => ({ ...p, currentAge: parseInt(e.target.value) || 0 }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300">
                          <option value="">Select Age</option>
                          {Array.from({ length: 120 }, (_, i) => i + 1).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#6</td>
                      <td className="border border-black px-2 py-1 text-xs">Years To Retirement ({data.plannedRetirementAge} - Current Age)</td>
                      <NoteTd value={data.retirementNote2} onChange={v => setData(p => ({ ...p, retirementNote2: v }))}/>
                      <td className="border border-black p-0">
                        <input
                          type="number" min="0" max="99"
                          value={data.yearsToRetirement || 0}
                          onChange={e => { ytrManualRef.current = true; setData(p => ({ ...p, yearsToRetirement: parseInt(e.target.value) || 0 })); }}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-yellow-50"
                          title="Auto-calculated from Current Age. You may override manually."
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#7</td>
                      <td className="border border-black px-2 py-1 text-xs">Retirement Years (85 - {data.plannedRetirementAge})</td>
                      <NoteTd value={data.retirementNote3} onChange={v => setData(p => ({ ...p, retirementNote3: v }))}/>
                      <td className="border border-black p-0">
                        <input
                          type="number" min="0" max="99"
                          value={data.retirementYears || 0}
                          onChange={e => { rYearsManualRef.current = true; setData(p => ({ ...p, retirementYears: parseInt(e.target.value) || 0 })); }}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-yellow-50"
                          title="Auto-calculated from Planned Retirement Age. You may override manually."
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#8</td>
                      <td className="border border-black px-2 py-1 text-xs">Monthly Income Needed (Today's Dollars)</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Today's dollars</td>
                      <td className="border border-black p-0"><CurrencyInput value={data.monthlyIncomeNeeded} placeholder="$0.00" onChange={val => setData(p => ({ ...p, monthlyIncomeNeeded: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#9</td>
                      <td className="border border-black px-2 py-1 text-xs">Monthly Income Needed (At Retirement @ 3%)</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Auto-calculated @ 3% inflation</td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{formatCurrency(data.monthlyRetirementIncome)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#10</td>
                      <td className="border border-black px-2 py-1 text-xs">Annual Retirement Income Needed</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Monthly × 12</td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{formatCurrency(data.annualRetirementIncome)}</td>
                    </tr>
                    <tr style={{ backgroundColor: COLORS.lightYellowBg }}>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#11</td>
                      <td className="border border-black px-2 py-1 text-xs font-bold">Total Retirement Income Needed</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Annual × Retirement Years</td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-bold">{formatCurrency(data.totalRetirementIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Healthcare */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏥" title="Healthcare Planning" cardKey="healthcare" />
              {cardVisibility.healthcare && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">Notes</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">Amount</th>
                  </tr></thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#12</td>
                      <td className="border border-black px-2 py-1 text-xs">Healthcare Expenses</td>
                      <NoteTd value={data.healthcareNote1} placeholder="~$315K For Couple" onChange={v => setData(p => ({ ...p, healthcareNote1: v }))} />
                      <td className="border border-black p-0"><CurrencyInput value={data.healthcareExpenses} placeholder="$315,000.00" onChange={val => setData(p => ({ ...p, healthcareExpenses: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#13</td>
                      <td className="border border-black px-2 py-1 text-xs">Long-Term Care</td>
                      <NoteTd value={data.healthcareNote2} placeholder="3% of healthcare × years × 2" onChange={v => setData(p => ({ ...p, healthcareNote2: v }))} />
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.longTermCare}
                          placeholder="$0.00"
                          onChange={val => {
                            ltcManualRef.current = true;
                            setData(p => ({ ...p, longTermCare: val }));
                          }}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-yellow-50"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Life Goals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🌟" title="Life Goals" cardKey="lifeGoals" />
              {cardVisibility.lifeGoals && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">Notes</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">Amount</th>
                  </tr></thead>
                  <tbody>
                    {[{n:'#14',l:'Travel Budget',nf:'travelNotes',nv:data.travelNotes,af:'travelBudget',av:data.travelBudget},
                      {n:'#15',l:'Vacation Home',nf:'vacationNotes',nv:data.vacationNotes,af:'vacationHome',av:data.vacationHome},
                      {n:'#16',l:'Charity / Giving',nf:'charityNotes',nv:data.charityNotes,af:'charity',av:data.charity},
                      {n:'#17',l:'Other Goals',nf:'otherGoalsNotes',nv:data.otherGoalsNotes,af:'otherGoals',av:data.otherGoals},
                    ].map(r => (
                      <tr key={r.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{r.n}</td>
                        <td className="border border-black px-2 py-1 text-xs">{r.l}</td>
                        <NoteTd value={r.nv} onChange={v => setData(p => ({ ...p, [r.nf]: v }))} />
                        <td className="border border-black p-0"><CurrencyInput value={r.av} placeholder="$0.00" onChange={val => setData(p => ({ ...p, [r.af]: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Legacy */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🎁" title="Legacy Planning" cardKey="legacy" />
              {cardVisibility.legacy && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">Notes</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">Amount</th>
                  </tr></thead>
                  <tbody>
                    {[{n:'#18',l:'Headstart Fund For Grandkids',nf:'headstartNotes',nv:data.headstartNotes,af:'headstartFund',av:data.headstartFund},
                      {n:'#19',l:'Family Legacy',nf:'legacyNotes',nv:data.legacyNotes,af:'familyLegacy',av:data.familyLegacy},
                      {n:'#20',l:'Family Support',nf:'supportNotes',nv:data.supportNotes,af:'familySupport',av:data.familySupport},
                    ].map(r => (
                      <tr key={r.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{r.n}</td>
                        <td className="border border-black px-2 py-1 text-xs">{r.l}</td>
                        <NoteTd value={r.nv} onChange={v => setData(p => ({ ...p, [r.nf]: v }))} />
                        <td className="border border-black p-0"><CurrencyInput value={r.av} placeholder="$0.00" onChange={val => setData(p => ({ ...p, [r.af]: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Total Requirement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-xs font-bold">💰 Total Requirement</h3>
                <button onClick={() => toggleCard('totalReq')} className={btnGhost}>{cardVisibility.totalReq ? 'Hide' : 'Show'}</button>
              </div>
              {cardVisibility.totalReq && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <tbody><tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-3 py-2 text-sm font-bold">💰 Total Requirement</td>
                    <td className="border border-black px-3 py-2 text-right text-base font-bold text-green-700">{formatCurrency(data.totalRequirement)}</td>
                  </tr></tbody>
                </table>
              )}
            </div>

            <div className="bg-black text-white text-center py-1.5 rounded text-xs">⚠️ Disclaimer: For Education Purpose Only. We Do Not Provide Any Legal Or Tax Advice</div>
          </div>
        )}

        {/* ════════════════════════════════════════ ASSETS TAB ══════════════ */}
        {activeTab === 'assets' && (
          <div className="space-y-3">

            {/* ── RETIREMENT PLANNING (USA) ──────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏦" title="Retirement Planning (USA)" cardKey="assetsRetirement" />
              {cardVisibility.assetsRetirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="Projected Value" />
                  <tbody>
                    {/* r1 – 401K calc+edit */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#1</td>
                      <td className="border border-black px-2 py-1 text-xs">Current 401K | 403B</td>
                      {stdCellsCalc("r1_him","r1_her","r1_notes","r1_present","r1_proj")}
                    </tr>
                    {/* r2 – Company Match N/A proj */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#2</td>
                      <td className="border border-black px-2 py-1 text-xs">Company Match %</td>
                      {stdCells("r2_him","r2_her","r2_notes","r2_present")}
                      <NAProjCell />
                    </tr>
                    {/* r3 – Max Funding editable proj */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#3</td>
                      <td className="border border-black px-2 py-1 text-xs">Are You Max Funding (~$22.5K)?</td>
                      {stdCells("r3_him","r3_her","r3_notes","r3_present")}
                      {manualProjCell("r3_proj")}
                    </tr>
                    {/* r4 – Prev 401K calc+edit */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#4</td>
                      <td className="border border-black px-2 py-1 text-xs">Previous 401K | Rollover 401K</td>
                      {stdCellsCalc("r4_him","r4_her","r4_notes","r4_present","r4_proj")}
                    </tr>
                    {/* r5 – Traditional IRA auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#5</td>
                      <td className="border border-black px-2 py-1 text-xs">Traditional IRA | SEP-IRA [Tax-Deferred]</td>
                      {stdCells("r5_him","r5_her","r5_notes","r5_present")}
                      <AutoProjCell present={assets.r5_present} />
                    </tr>
                    {/* r6 – Roth IRA auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#6</td>
                      <td className="border border-black px-2 py-1 text-xs">ROTH IRA | ROTH 401K [Tax-Free]</td>
                      {stdCells("r6_him","r6_her","r6_notes","r6_present")}
                      <AutoProjCell present={assets.r6_present} />
                    </tr>
                    {/* r7 – ESPP/RSU auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#7</td>
                      <td className="border border-black px-2 py-1 text-xs">ESPP | RSU | Annuities | Pension</td>
                      {stdCellsCalc("r7_him","r7_her","r7_notes","r7_present","r7_proj")}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── REAL ESTATE INVESTMENTS (USA) ──────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏠" title="Real Estate Investments (USA)" cardKey="assetsRealEstate" />
              {cardVisibility.assetsRealEstate && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="Projected Value" />
                  <tbody>
                    {[
                      {n:'#8', l:'Personal Home',                   hk:'e1_him' as keyof AssetsData, ek:'e1_her' as keyof AssetsData, nk:'e1_notes' as keyof AssetsData, pk:'e1_present' as keyof AssetsData, pj:'e1_proj' as keyof AssetsData, calc:true},
                      {n:'#9', l:'Real Estate Properties | Rentals', hk:'e2_him' as keyof AssetsData, ek:'e2_her' as keyof AssetsData, nk:'e2_notes' as keyof AssetsData, pk:'e2_present' as keyof AssetsData, pj:'e2_proj' as keyof AssetsData, calc:false},
                      {n:'#10',l:'Real Estate Land Parcels',         hk:'e3_him' as keyof AssetsData, ek:'e3_her' as keyof AssetsData, nk:'e3_notes' as keyof AssetsData, pk:'e3_present' as keyof AssetsData, pj:'e3_proj' as keyof AssetsData, calc:false},
                      {n:'#11',l:'Inheritance In The USA',           hk:'e4_him' as keyof AssetsData, ek:'e4_her' as keyof AssetsData, nk:'e4_notes' as keyof AssetsData, pk:'e4_present' as keyof AssetsData, pj:'e4_proj' as keyof AssetsData, calc:false},
                    ].map(r => (
                      <tr key={r.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{r.n}</td>
                        <td className="border border-black px-2 py-1 text-xs">{r.l}</td>
                        {r.calc
                          ? stdCellsCalc(r.hk, r.ek, r.nk, r.pk, r.pj)
                          : <>{stdCells(r.hk, r.ek, r.nk, r.pk)}{manualProjCell(r.pj)}</>
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── STOCKS | BUSINESS | INCOME (USA) ─────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="📈" title="Stocks | Business | Income (USA)" cardKey="assetsStocks" />
              {cardVisibility.assetsStocks && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="Projected Value" />
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#12</td>
                      <td className="border border-black px-2 py-1 text-xs">STOCKS | MFs | Bonds | ETFs (Outside Of 401K)</td>
                      {stdCellsCalc("s1_him","s1_her","s1_notes","s1_present","s1_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#13</td>
                      <td className="border border-black px-2 py-1 text-xs">Do You Own A Business?</td>
                      {stdCells("s2_him","s2_her","s2_notes","s2_present")}
                      {manualProjCell("s2_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#14</td>
                      <td className="border border-black px-2 py-1 text-xs">Alternative Investments (Private Equity, Crowd Funding, ETC.)</td>
                      {stdCellsCalc("s3_him","s3_her","s3_notes","s3_present","s3_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#15</td>
                      <td className="border border-black px-2 py-1 text-xs">Certificate Of Deposits (Bank CDs)</td>
                      {stdCells("s4_him","s4_her","s4_notes","s4_present")}
                      <AutoProjCell present={assets.s4_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#16</td>
                      <td className="border border-black px-2 py-1 text-xs">Cash In Bank + Emergency Fund</td>
                      {stdCellsCalc("s5_him","s5_her","s5_notes","s5_present","s5_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#17</td>
                      <td className="border border-black px-2 py-1 text-xs">Annual House-Hold Income</td>
                      {stdCells("s6_him","s6_her","s6_notes","s6_present")}
                      {manualProjCell("s6_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#18</td>
                      <td className="border border-black px-2 py-1 text-xs">Annual Savings Going Forward</td>
                      {stdCells("s7_him","s7_her","s7_notes","s7_present")}
                      {manualProjCell("s7_proj")}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── FAMILY PROTECTION & INSURANCE ────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🛡️" title="Family Protection & Insurance" cardKey="assetsInsurance" />
              {cardVisibility.assetsInsurance && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-12">Him</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-12">Her</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">Notes</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">Present Cash Value</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-40">Future Legacy Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#19</td>
                      <td className="border border-black px-2 py-1 text-xs">Life Insurance At Work</td>
                      {stdCells("f1_him","f1_her","f1_notes","f1_present")}
                      <NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#20</td>
                      <td className="border border-black px-2 py-1 text-xs">Life Insurance Outside Work</td>
                      {stdCells("f2_him","f2_her","f2_notes","f2_present")}
                      {manualProjCell("f2_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#21</td>
                      <td className="border border-black px-2 py-1 text-xs">Is it Cash Value Life Insurance?</td>
                      {stdCells("f3_him","f3_her","f3_notes","f3_present")}
                      {manualProjCell("f3_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#22</td>
                      <td className="border border-black px-2 py-1 text-xs">Which Company? How Long?</td>
                      <td className="border border-black text-center py-1 w-12"><input type="checkbox" checked={assets.f4_him} className="w-4 h-4" onChange={e => upd('f4_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1 w-12"><input type="checkbox" checked={assets.f4_her} className="w-4 h-4" onChange={e => upd('f4_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f4_notes} onChange={v => upd('f4_notes', v)} />
                      <NAProjCell />
                      <NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#23</td>
                      <td className="border border-black px-2 py-1 text-xs">Short Term | Long Term Disability at Work</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f5_him} className="w-4 h-4" onChange={e => upd('f5_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f5_her} className="w-4 h-4" onChange={e => upd('f5_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f5_notes} onChange={v => upd('f5_notes', v)} />
                      <NAProjCell /><NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#24</td>
                      <td className="border border-black px-2 py-1 text-xs">Long Term Care Outside Of Work</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f6_him} className="w-4 h-4" onChange={e => upd('f6_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f6_her} className="w-4 h-4" onChange={e => upd('f6_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f6_notes} onChange={v => upd('f6_notes', v)} />
                      <NAProjCell /><NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#25</td>
                      <td className="border border-black px-2 py-1 text-xs">Health Savings Account (HSA)</td>
                      {stdCellsCalc("f7_him","f7_her","f7_notes","f7_present","f7_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#26</td>
                      <td className="border border-black px-2 py-1 text-xs">Mortgage Protection Insurance</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f8_him} className="w-4 h-4" onChange={e => upd('f8_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f8_her} className="w-4 h-4" onChange={e => upd('f8_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f8_notes} onChange={v => upd('f8_notes', v)} />
                      <NAProjCell /><NAProjCell />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── COLLEGE PLANNING / ESTATE PLANNING ───────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🎓" title="College Planning / Estate Planning" cardKey="assetsCollege" />
              {cardVisibility.assetsCollege && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">Description</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-16">Child 1</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-16">Child 2</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">Notes</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">Present Value</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-44 whitespace-nowrap">
                        PROJECTED VALUE @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%){yearsToRetirement > 0 ? ` for ${yearsToRetirement} yrs` : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#27</td>
                      <td className="border border-black px-2 py-1 text-xs">529 Plans | State Pre-Paid Plans</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.c1_c1} className="w-4 h-4" onChange={e => upd('c1_c1', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.c1_c2} className="w-4 h-4" onChange={e => upd('c1_c2', e.target.checked)} /></td>
                      <NoteTd value={assets.c1_notes} onChange={v => upd('c1_notes', v)} />
                      {calcPresentCell("c1_present","c1_proj")}
                      {calcEditProjCell("c1_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#28</td>
                      <td className="border border-black px-2 py-1 text-xs">WILL &amp; Trust (Estate Planning)</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.c2_c1} className="w-4 h-4" onChange={e => upd('c2_c1', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.c2_c2} className="w-4 h-4" onChange={e => upd('c2_c2', e.target.checked)} /></td>
                      <NoteTd value={assets.c2_notes} onChange={v => upd('c2_notes', v)} />
                      <NAProjCell /><NAProjCell />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── FOREIGN ASSETS (OUTSIDE OF THE USA) ──────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🌏" title="Foreign Assets (Outside Of The USA)" cardKey="assetsForeign" />
              {cardVisibility.assetsForeign && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="Projected Value" />
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#29</td>
                      <td className="border border-black px-2 py-1 text-xs">Real Estate Assets</td>
                      {stdCellsCalc("x1_him","x1_her","x1_notes","x1_present","x1_proj")}
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#30</td>
                      <td className="border border-black px-2 py-1 text-xs">Non-Real Estate Assets (Fixed Deposits, Stocks, Loans, Jewellery, Investments)</td>
                      {stdCellsCalc("x2_him","x2_her","x2_notes","x2_present","x2_proj")}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── TOTALS ────────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-xs font-bold">💰 Total Assets</h3>
                <button onClick={() => toggleCard('totalAssets')} className={btnGhost}>{cardVisibility.totalAssets ? 'Hide' : 'Show'}</button>
              </div>
              {cardVisibility.totalAssets && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: COLORS.yellowBg }}>
                      <td className="border border-black px-3 py-2 text-sm font-bold">💰 Total Assets</td>
                      <td className="border border-black px-3 py-2">
                        <div className="text-right text-sm font-bold text-green-700">Present Value: {formatCurrencyZero(totalPresent)}</div>
                        <div className="text-right text-sm font-bold text-blue-700 mt-0.5">
                          Projected @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%){yearsToRetirement > 0 ? ` for ${yearsToRetirement} yrs` : ''}: {formatCurrencyZero(totalProjected)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-gray-800 text-white text-center py-1.5 rounded text-xs">
              ** FBAR: Report to US Treasury if foreign accounts exceed $10K | ** FATCA: Report to IRS (Form 8938) if foreign assets exceed $50K
            </div>
            <div className="bg-black text-white text-center py-1.5 rounded text-xs">⚠️ Disclaimer: For Education Purpose Only. We Do Not Provide Any Legal Or Tax Advice</div>
          </div>
        )}
        {/* ════════════════════════════════════ LIABILITIES TAB ══════════════ */}
        {activeTab === 'liabilities' && (
          <div className="space-y-3">

            
            {/* Total Liabilities summary — always visible */}
            {(() => {
              const toN = (v: any) => { const n = parseFloat(String(v ?? "").replace(/[$,\s]/g, "")); return Number.isFinite(n) ? n : 0; };
              const totalBalance  = liabilityRows.reduce((s, r) => s + toN(r.balance),         0);
              const totalMinPay   = liabilityRows.reduce((s, r) => s + toN(r.min_payment),     0);
              const totalCurPay   = liabilityRows.reduce((s, r) => s + toN(r.current_payment), 0);
              const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex gap-6 text-xs font-semibold flex-wrap items-center">
                    <span className="text-gray-500">📊 {liabilityRows.length} liabilit{liabilityRows.length === 1 ? 'y' : 'ies'}</span>
                    <span className="text-red-700">💳 Total Balance: <strong>{fmt(totalBalance)}</strong></span>
                    <span className="text-gray-700">Min Payment/mo: <strong>{fmt(totalMinPay)}</strong></span>
                    <span className="text-gray-700">Current Payment/mo: <strong>{fmt(totalCurPay)}</strong></span>
                  </div>
                </div>
              );
            })()}

            {/* Main liabilities table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold">💳 Liabilities</h3>
                {!data.fnaId && (
                  <span className="text-xs text-amber-600 font-medium">
                    ⚠️ Save the FNA record first (Goals tab) before adding liabilities.
                  </span>
                )}
                {liabNotice && <span className="text-xs text-green-600 font-semibold">{liabNotice}</span>}
              </div>
              <LiabilityEditableTable
                rows={liabilityRows}
                setRows={setLiabilityRows}
                columns={liabilityCols}
                fnaId={data.fnaId}
                onSaveRow={upsertLiabilityRow}
                onDeleteRow={deleteLiabilityRow}
              />
            </div>

            <div className="bg-black text-white text-center py-1.5 rounded text-xs">⚠️ Disclaimer: For Education Purpose Only. We Do Not Provide Any Legal Or Tax Advice</div>
          </div>
        )}

      </main>
    </div>
  );
}

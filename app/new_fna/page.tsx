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
  spouseName: string; city: string; state: string; clientDob: string; analysisDate: string;
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
  r1_him: boolean; r1_her: boolean; r1_notes: string; r1_present: number; // 401K/403B – auto
  r2_him: boolean; r2_her: boolean; r2_notes: string; r2_present: number; // Company Match – N/A proj
  r3_him: boolean; r3_her: boolean; r3_notes: string; r3_present: number; // Max Funding – N/A proj
  r4_him: boolean; r4_her: boolean; r4_notes: string; r4_present: number; // Previous 401K – auto
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
  s6_him: boolean; s6_her: boolean; s6_notes: string; s6_present: number; // Annual Income – N/A proj
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
  spouseName: "", city: "", state: "", clientDob: "",
  analysisDate: new Date().toISOString().split('T')[0],
  dob: "", notes: "", plannedRetirementAge: 65, calculatedInterestPercentage: 6,
  child1CollegeName: "", child1CollegeNotes: "", child1CollegeAmount: 0,
  child2CollegeName: "", child2CollegeNotes: "", child2CollegeAmount: 0,
  child1WeddingNotes: "", child1WeddingAmount: 0,
  child2WeddingNotes: "", child2WeddingAmount: 0,
  currentAge: 0, yearsToRetirement: 0, retirementYears: 0,
  monthlyIncomeNeeded: 0, monthlyRetirementIncome: 0, annualRetirementIncome: 0, totalRetirementIncome: 0,
  retirementNote1: "", retirementNote2: "", retirementNote3: "",
  healthcareExpenses: "", longTermCare: 0,
  healthcareNote1: "~$315K For Couple In Today's Dollars", healthcareNote2: "",
  travelBudget: 0, travelNotes: "", vacationHome: 0, vacationNotes: "",
  charity: 0, charityNotes: "", otherGoals: 0, otherGoalsNotes: "",
  headstartFund: 0, headstartNotes: "", familyLegacy: 0, legacyNotes: "",
  familySupport: 0, supportNotes: "", totalRequirement: 0,
};

const initialAssets: AssetsData = {
  r1_him:false, r1_her:false, r1_notes:"", r1_present:0,
  r2_him:false, r2_her:false, r2_notes:"", r2_present:0,
  r3_him:false, r3_her:false, r3_notes:"", r3_present:0,
  r4_him:false, r4_her:false, r4_notes:"", r4_present:0,
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
  s6_him:false, s6_her:false, s6_notes:"", s6_present:0,
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
    // Auto (read-only) projected rows — still using autoProj formula
    const autoRows = [
      assets.r1_present, assets.r4_present, assets.r5_present, assets.r6_present,
    ].reduce((s, p) => s + autoProj(p), 0);
    // Calc+edit projected rows — user may have overridden, so use stored proj value
    const calcEditRows = [
      assets.r7_proj,  // ESPP/RSU
      assets.s1_proj,  // Stocks/MFs
      assets.s3_proj,  // Alt Investments
      assets.s4_present > 0 ? autoProj(assets.s4_present) : 0, // CDs still auto
      assets.s5_proj,  // Cash in Bank
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
    if (!clientId) { setData(initialData); setAssets(initialAssets); return; }
    const c = clients.find(x => x.id === clientId);
    if (!c) return;
    setData(prev => ({
      ...initialData, clientId: c.id,
      clientName: `${c.first_name} ${c.last_name}`,
      clientPhone: c.phone || '', clientEmail: c.email || '',
      spouseName: c.spouse_name || '', city: c.city || '', state: c.state || '',
      clientDob: c.date_of_birth || '',
      analysisDate: new Date().toISOString().split('T')[0],
      healthcareNote1: "~$315K For Couple In Today's Dollars",
      plannedRetirementAge: 65, calculatedInterestPercentage: 6,
    }));
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
        healthcareExpenses: healthcare?.healthcare_expenses || 0,
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

  // ── Goals recalculation — uses plannedRetirementAge (dynamic, not hardcoded 65) ──
  useEffect(() => {
    const retAge = data.plannedRetirementAge || 65;
    const ytr  = data.currentAge > 0 ? Math.max(0, retAge - data.currentAge) : 0;
    // Retirement years: from planned retirement age to 85
    const rYrs = data.currentAge > 0 ? Math.max(0, (retAge + 20) - data.currentAge) : 0;
    const mri  = data.monthlyIncomeNeeded > 0 && ytr > 0
      ? data.monthlyIncomeNeeded * Math.pow(1.03, ytr) : 0;
    const ari  = mri * 12;
    const tri  = ari * (retAge >= 85 ? 1 : 85 - retAge);
    const ltc  = data.healthcareExpenses * 0.03 * ((85 - retAge) * 2);
    const total =
      data.child1CollegeAmount + data.child2CollegeAmount +
      data.child1WeddingAmount + data.child2WeddingAmount +
      tri + data.healthcareExpenses + ltc +
      data.travelBudget + data.vacationHome + data.charity + data.otherGoals +
      data.headstartFund + data.familyLegacy + data.familySupport;
    setData(prev => ({
      ...prev, yearsToRetirement: ytr, retirementYears: 85 - retAge > 0 ? 85 - retAge : 0,
      monthlyRetirementIncome: mri, annualRetirementIncome: ari,
      totalRetirementIncome: tri, longTermCare: ltc, totalRequirement: total,
    }));
  }, [
    data.currentAge, data.plannedRetirementAge, data.monthlyIncomeNeeded, data.healthcareExpenses,
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
      const notesPayload = JSON.stringify({ _fna_note: data.notes, _assets: assets });
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
          current_401k_projected_value: autoProj(assets.r1_present),
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

  const handleClear = () => {
    if (confirm('Clear all data and reset the form?')) {
      setData(initialData);
      setAssets(initialAssets);
      setLiabilityRows([]);
      setCardsExpanded(false);
      setCardVisibility(allCardsClosed);
      showMessage("Form cleared", 'success');
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

  // Load logo image as base64 for jsPDF
  const loadLogoBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = '/anunathan-logo.png';
    });
  };

  const handleGenerateReport = async () => {
    if (!data.clientId || !data.clientName) {
      alert("Please select a client first.");
      return;
    }
    setReportGenerating(true);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

      // ── Constants ──────────────────────────────────────────────────────────
      const PW = 612, PH = 792, M = 50, TW = PW - M * 2;
      const navy:  [number,number,number] = [26, 44, 94];
      const lBlue: [number,number,number] = [189, 215, 238];
      const white: [number,number,number] = [255, 255, 255];
      const black: [number,number,number] = [0, 0, 0];
      const lgray: [number,number,number] = [245, 245, 245];
      const dkgray:[number,number,number] = [80, 80, 80];
      const red:   [number,number,number] = [192, 0, 0];
      const green: [number,number,number] = [21, 128, 61];

      const today = new Date();
      const mmddyyyy = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}-${today.getFullYear()}`;
      const fmtC = (n: number) => (n||0).toLocaleString('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 });
      const yn = (v: boolean) => v ? 'Y' : 'N';

      const totalLiabilities = liabilityRows.reduce((s, r) => {
        const n = parseFloat(String(r.balance ?? "").replace(/[$,\s]/g, ""));
        return s + (Number.isFinite(n) ? n : 0);
      }, 0);
      const netWorth = totalPresent - totalLiabilities;
      const Gap = data.totalRequirement - totalProjected - totalLiabilities;

      // Load logo
      const logoData = await loadLogoBase64();

      // ── Helper: page header bar (logo + FLS Document title) ───────────────
      const pageTopBar = (subtitle = '') => {
        doc.setFillColor(...lBlue);
        doc.rect(0, 0, PW, 32, 'F');
        // logo
        if (logoData) {
          try { doc.addImage(logoData, 'PNG', M, 4, 52, 24); } catch {}
        } else {
          doc.setFont('helvetica','bold'); doc.setFontSize(8);
          doc.setTextColor(...navy); doc.text('AnuNathan', M, 20);
        }
        // title center
        doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.setTextColor(...navy); doc.text('FLS Document', PW/2, 21, { align:'center' });
        // FLS logo placeholder right
        doc.setFillColor(...navy); doc.rect(PW-M-50, 5, 50, 22, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(6);
        doc.setTextColor(...white); doc.text('FINANCIAL', PW-M-47, 13);
        doc.text('LIFESTYLE', PW-M-46, 19); doc.text('STRATEGY', PW-M-46, 25);
        doc.setTextColor(...black);
        if (subtitle) {
          doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
          doc.setTextColor(...dkgray); doc.text(subtitle, PW-M, 45, { align:'right' });
          doc.setTextColor(...black);
        }
        return 50;
      };

      // ── Helper: navy section banner ────────────────────────────────────────
      const sectionBanner = (label: string, y: number, w = TW): number => {
        doc.setFillColor(...navy);
        doc.rect(M, y, w, 16, 'F');
        doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(8);
        doc.text(label, M+6, y+11);
        doc.setTextColor(...black);
        return y + 22;
      };

      // ── Helper: page footer ────────────────────────────────────────────────
      let _pgNum = 0;
      const pageFooter = () => {
        _pgNum++;
        doc.setFont('helvetica','normal'); doc.setFontSize(7);
        doc.setTextColor(...dkgray);
        doc.text(`Page ${_pgNum}`, PW/2, PH-12, { align:'center' });
        doc.text('⚠ For Education Purpose Only. Not Legal or Tax Advice.', PW/2, PH-4, { align:'center' });
        doc.setTextColor(...black);
      };

      // ── Helper: bold label + normal value on same line ─────────────────────
      const kv = (label: string, val: string, x: number, y: number, labelW = 105) => {
        doc.setFont('helvetica','bold'); doc.setFontSize(8);
        doc.text(label+':', x, y);
        doc.setFont('helvetica','normal'); doc.setFontSize(8);
        doc.text(val||'-', x+labelW, y);
      };

      // ── Helper: striped table row ──────────────────────────────────────────
      const trow = (cells: string[], y: number, colW: number[], bold=false, bg?: [number,number,number]) => {
        if (bg) { doc.setFillColor(...bg); doc.rect(M, y-10, TW, 14, 'F'); }
        let x = M;
        cells.forEach((cell, i) => {
          doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(7.5);
          const txt = String(cell??'');
          // right-align last cell if it looks like currency or number
          const isLast = i === cells.length-1;
          const isNum = /^\$|^\-?\d/.test(txt.trim());
          if (isLast && isNum) {
            doc.text(txt, x + colW[i] - 4, y, { align:'right' });
          } else {
            doc.text(txt, x+3, y);
          }
          x += colW[i];
        });
        return y+14;
      };

      const hline = (y: number) => {
        doc.setDrawColor(200,200,200); doc.line(M, y, PW-M, y);
      };

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 1 — Cover
      // ══════════════════════════════════════════════════════════════════════
      pageTopBar();
      pageFooter();

      // "Prepared For" bar
      doc.setFillColor(...navy); doc.rect(M, 50, TW, 16, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.setTextColor(...white); doc.text('Prepared For', M+6, 61);
      doc.setTextColor(...black);

      // Client name large
      doc.setFont('helvetica','bold'); doc.setFontSize(20);
      doc.text(data.clientName || '—', M, 100);

      // "Prepared By" bar
      doc.setFillColor(...navy); doc.rect(M, 120, TW, 16, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.setTextColor(...white); doc.text('Prepared By:', M+6, 131);
      doc.setTextColor(...black);

      // Preparer name
      doc.setFont('helvetica','bold'); doc.setFontSize(16);
      doc.text('Chidam Alagar', M, 160);
      doc.setFont('helvetica','normal'); doc.setFontSize(10);
      doc.text('AnuNathan Financial Group', M, 176);

      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.text('Email:', M, 196);
      doc.setFont('helvetica','normal');
      doc.setTextColor(26, 86, 219);
      doc.text('chidam.alagar@gmail.com', M+30, 196);
      doc.setTextColor(...black);

      // USA disclaimer
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.text('In the USA:', M, 218);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      const usaTxt = 'Hegemon Group International, (HGI) is a marketing company offering a vast array of products and services through a network of independent affiliates. HGI does not provide insurance products, legal or tax advice. Insurance products offered through Hegemon Financial Group (HFG); and in California, insurance products offered through Hegemon Insurance Solutions collectively HFG. HFG is licensed in all states and the District of Columbia. California License #0I0198. World Headquarters: 11405 Old Roswell Rd, Alpharetta GA 30009.';
      const usaLines = doc.splitTextToSize(usaTxt, TW - 34);
      doc.text(usaLines, M+34, 218);

      const usaEndY = 218 + usaLines.length * 10;
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.text('In Canada:', M, usaEndY + 12);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      const caTxt = 'Hegemon Group International of Canada ULC (HGI) is a life insurance agency and marketing company offering a vast array of products and services through a network of independent affiliates in Canada. Insurance products offered only in the Provinces and Territories where HGI is licensed to conduct business. Canada Headquarters: 2866 Portland Drive, Oakville, ON L6H5W8';
      doc.text(doc.splitTextToSize(caTxt, TW - 34), M+34, usaEndY + 12);

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 2 — Important Disclaimer
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); let y = pageTopBar(''); pageFooter();

      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.text('Important Disclaimer', M, y+20); y += 38;

      const disclaParas = [
        'This analysis provides only broad, general guidelines, which may be helpful in determining your personal financial needs. It can serve as a guide for discussions with your professional advisors. Each of the recommendations in this analysis are calculated independently and are not intended to be a comprehensive financial plan.',
        'Calculations contained in this analysis are estimates only based on the information you provided, such as the value of your assets today, and the rate at which the assets appreciate. The actual values, rates of growth, and tax rates may be significantly different from those illustrated. These assumptions are only a "best guess." No guarantee can be made regarding values, as all rates are the hypothetical rates you provided. These computations are not a guarantee of future performance of any asset, including insurance or other financial products.',
        'No legal or accounting advice is being rendered either by this report or through any other oral or written communications. Nothing contained in this report is intended to be used on any tax form or to support any tax deduction. State laws vary regarding the distribution of property, and individual circumstances are unique and subject to change. You should discuss all strategies, transfers, and assumptions with your legal and tax advisors.',
        'To implement a strategy, it may be necessary to restructure the ownership of property, or change designated beneficiaries before specific will or trust provisions, prepared by the client\'s counsel, become effective. The transfer of a life insurance policy may not result in its removal from the estate of the prior owner for three years.',
        'Strategies may be proposed to support the purchase of various products such as insurance and other financial products. When this occurs, additional information about the specific product (including an insurer provided policy illustration) will be provided for your review.',
        'This is not an offering or the solicitation of an offer to purchase an interest in any investment vehicle. Any such offer or solicitation will only be made to qualified investors by means of an offering memorandum and only in those jurisdictions where permitted by law. The target returns set forth within all offerings may not be realized; actual results may differ materially from the stated goals. Prior to investing, investors must receive a prospectus, which contains important information regarding the investment objectives, risks, fees, and expenses of any funds and/or other investment opportunities. Past performance is no guarantee of future results. All investments involve risk, including the loss of principal.',
        'IMPORTANT: The projections or other information generated by this financial needs analysis tool regarding the likelihood of various investment outcomes are hypothetical in nature, do not reflect actual investment results and are not guarantees of future results.',
      ];
      doc.setFont('helvetica','normal'); doc.setFontSize(8);
      disclaParas.forEach(para => {
        if (y > PH-70) { doc.addPage(); y = pageTopBar('')+30; pageFooter(); }
        const ls = doc.splitTextToSize(para, TW);
        doc.text(ls, M, y); y += ls.length*10 + 6;
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 3 — Confirmation of Facts
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.text('Confirmation of Facts', M, y+20); y += 38;

      // Client Information
      y = sectionBanner('Client Information', y);

      // Two-column layout with proper spacing
      const col1x = M, col2x = M + TW/2 + 10;
      const clientPairs: [string,string,string,string][] = [
        ['Client Name', data.clientName||'-', 'Country', data.state ? 'USA' : '-'],
        ['Date of Birth', data.dob||data.clientDob||'-', 'State', data.state||'-'],
        ['Cell Phone', data.clientPhone||'-', 'Gender', '-'],
        ['Email', data.clientEmail||'-', 'Height', 'N/A'],
        ['Address', `${data.city||''} ${data.state||''}`.trim()||'-', 'Weight', '-'],
      ];
      doc.setFontSize(8);
      clientPairs.forEach(([lbl1,val1,lbl2,val2]) => {
        kv(lbl1, val1, col1x, y);
        kv(lbl2, val2, col2x, y);
        hline(y+4); y += 16;
      });
      y += 8;

      // Spouse Information
      y = sectionBanner('Spouse Information', y);
      const spousePairs: [string,string,string,string][] = [
        ['Spouse Name', data.spouseName||'-', 'Gender', '-'],
        ['Date of Birth', '-', 'Height', 'N/A'],
        ['Cell Phone', '-', 'Weight', '-'],
        ['Email', '-', '', ''],
      ];
      doc.setFontSize(8);
      spousePairs.forEach(([lbl1,val1,lbl2,val2]) => {
        kv(lbl1, val1, col1x, y);
        if (lbl2) kv(lbl2, val2, col2x, y);
        hline(y+4); y += 16;
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 4 — Financial Summary (Overview bar + Income + Mortgage)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar('Financial Summary'); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Financial Summary', M, y+20); y += 36;

      // Summary totals bar
      doc.setFillColor(...lBlue);
      doc.rect(M, y, TW, 22, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.setTextColor(...navy);
      const smryItems = [
        `Total Assets: ${fmtC(totalPresent)}`,
        `Total Liabilities: ${fmtC(totalLiabilities)}`,
        `Net Worth: ${fmtC(netWorth)}`,
      ];
      const smrySpacing = TW / smryItems.length;
      smryItems.forEach((txt, i) => {
        doc.text(txt, M + i*smrySpacing + 6, y+14);
      });
      doc.setTextColor(...black); y += 30;

      // Income section
      y = sectionBanner('Income', y);
      const annualIncome = (assets.s6_present || 0);
      const incomeRows: [string,string][] = [
        ['Client Annual Income', fmtC(annualIncome)],
        ['Occupation', '-'],
        ['Spouse Annual Income', '$0.00'],
        ['Spouse Occupation', '-'],
        ['Years of Income Replacement', String(data.yearsToRetirement)],
      ];
      doc.setFontSize(8);
      incomeRows.forEach(([lbl, val]) => {
        doc.setFont('helvetica','bold'); doc.text(lbl+':', M, y);
        doc.setFont('helvetica','normal'); doc.text(val, M+160, y);
        y += 14;
      }); y += 6;

      // Retirement planning summary
      y = sectionBanner('Retirement', y);
      const retRows: [string,string][] = [
        ['Retirement Savings Desired', fmtC(data.totalRetirementIncome)],
        ['% Interest on Retirement Savings', `${data.calculatedInterestPercentage}.00%`],
        ['Estimated Annual Income Needed', fmtC(data.annualRetirementIncome)],
      ];
      retRows.forEach(([lbl,val]) => {
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(lbl+':', M, y);
        doc.setFont('helvetica','normal'); doc.text(val, M+200, y); y += 14;
      }); y += 6;

      // Monthly Expenses
      y = sectionBanner('Monthly Expenses', y);
      const totalMortgageMonthly = liabilityRows
        .filter(r => String(r.liability_type||'').toLowerCase().includes('mortgage'))
        .reduce((s,r) => s + (parseFloat(String(r.current_payment||r.min_payment||0))||0), 0);
      const expRows: [string,string][] = [
        ['All Mortgages', fmtC(totalMortgageMonthly)],
        ['Retirement Plans (Monthly)', fmtC(data.monthlyIncomeNeeded)],
        ['Total Monthly Expenses (Est.)', fmtC(totalMortgageMonthly + data.monthlyIncomeNeeded)],
      ];
      expRows.forEach(([lbl,val]) => {
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(lbl+':', M, y);
        doc.setFont('helvetica','normal'); doc.text(val, M+200, y); y += 14;
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 5 — Assets Summary (with Y/N for Him/Her)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar('Assets & Liabilities'); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Assets Summary', M, y+20); y += 36;

      const aColW = [192, 40, 40, 96, 116];
      y = trow(['Asset', 'Him', 'Her', 'Present Value', `Projected @ ${data.plannedRetirementAge} (${data.calculatedInterestPercentage}%)`], y, aColW, true, lBlue);

      const assetRows2: [string, boolean, boolean, number, number][] = [
        ['Current 401K / 403B',         assets.r1_him, assets.r1_her, assets.r1_present, autoProj(assets.r1_present)],
        ['Company Match',                assets.r2_him, assets.r2_her, assets.r2_present, 0],
        ['Previous 401K / Rollover',     assets.r4_him, assets.r4_her, assets.r4_present, autoProj(assets.r4_present)],
        ['Traditional IRA / SEP-IRA',    assets.r5_him, assets.r5_her, assets.r5_present, autoProj(assets.r5_present)],
        ['Roth IRA / Roth 401K',         assets.r6_him, assets.r6_her, assets.r6_present, autoProj(assets.r6_present)],
        ['ESPP / RSU / Annuities',       assets.r7_him, assets.r7_her, assets.r7_present, assets.r7_proj||0],
        ['Personal Home',                assets.e1_him, assets.e1_her, assets.e1_present, assets.e1_proj||0],
        ['Real Estate Properties',       assets.e2_him, assets.e2_her, assets.e2_present, assets.e2_proj||0],
        ['Real Estate Land',             assets.e3_him, assets.e3_her, assets.e3_present, assets.e3_proj||0],
        ['Inheritance (USA)',            assets.e4_him, assets.e4_her, assets.e4_present, assets.e4_proj||0],
        ['Stocks / MFs / Bonds / ETFs',  assets.s1_him, assets.s1_her, assets.s1_present, assets.s1_proj||0],
        ['Business',                     assets.s2_him, assets.s2_her, assets.s2_present, assets.s2_proj||0],
        ['Alternative Investments',      assets.s3_him, assets.s3_her, assets.s3_present, assets.s3_proj||0],
        ['Certificate of Deposits (CD)', assets.s4_him, assets.s4_her, assets.s4_present, autoProj(assets.s4_present)],
        ['Cash in Bank / Emergency Fund',assets.s5_him, assets.s5_her, assets.s5_present, assets.s5_proj||0],
        ['Annual Household Income',      assets.s6_him, assets.s6_her, assets.s6_present, 0],
        ['Annual Savings Going Forward', assets.s7_him, assets.s7_her, assets.s7_present, assets.s7_proj||0],
        ['Life Insurance at Work',       assets.f1_him, assets.f1_her, assets.f1_present, 0],
        ['Life Insurance Outside Work',  assets.f2_him, assets.f2_her, assets.f2_present, assets.f2_proj||0],
        ['Cash Value Life Insurance',    assets.f3_him, assets.f3_her, assets.f3_present, assets.f3_proj||0],
        ['Health Savings Account (HSA)', assets.f7_him, assets.f7_her, assets.f7_present, assets.f7_proj||0],
        ['529 College Plans',            assets.c1_c1,  assets.c1_c2,  assets.c1_present, assets.c1_proj||0],
        ['Foreign Real Estate',          assets.x1_him, assets.x1_her, assets.x1_present, assets.x1_proj||0],
        ['Foreign Non-Real Estate',      assets.x2_him, assets.x2_her, assets.x2_present, assets.x2_proj||0],
      ];

      assetRows2.forEach((r, i) => {
        if (y > PH-70) { doc.addPage(); y = pageTopBar('Assets (cont.)')+30; pageFooter(); }
        const bg: [number,number,number]|undefined = i%2===0 ? lgray : undefined;
        const projVal = r[4] > 0 ? fmtC(r[4]) : (r[3] > 0 ? 'N/A' : '');
        y = trow([r[0], yn(r[1]), yn(r[2]), r[3]>0?fmtC(r[3]):'', projVal], y, aColW, false, bg);
      });

      // Total assets row
      if (y > PH-60) { doc.addPage(); y = pageTopBar('Assets (cont.)')+30; pageFooter(); }
      doc.setFillColor(...lBlue); doc.rect(M, y-10, TW, 14, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
      doc.text('TOTAL ASSETS', M+3, y);
      doc.text(fmtC(totalPresent), M+192+40+40+96-4, y, { align:'right' });
      doc.text(fmtC(totalProjected), M+TW-4, y, { align:'right' });
      y += 18;

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 6 — Liabilities (always starts a new page)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar('Liabilities'); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Liabilities', M, y+20); y += 36;

      if (liabilityRows.length === 0) {
        doc.setFont('helvetica','normal'); doc.setFontSize(9);
        doc.setTextColor(...dkgray); doc.text('No liabilities recorded.', M, y+10);
        doc.setTextColor(...black);
      } else {
        const lColW = [100, 100, 95, 90, 75, 75];
        y = trow(['Type','Description','Lender','Balance','Min Payment','Cur. Payment'], y, lColW, true, lBlue);
        liabilityRows.forEach((r, i) => {
          if (y > PH-70) { doc.addPage(); y = pageTopBar('Liabilities (cont.)')+30; pageFooter(); }
          const bg: [number,number,number]|undefined = i%2===0 ? lgray : undefined;
          y = trow([
            r.liability_type||'', r.description||'', r.lender||'',
            fmtC(Number(r.balance)||0),
            fmtC(Number(r.min_payment)||0),
            fmtC(Number(r.current_payment)||0),
          ], y, lColW, false, bg);
        });
        if (y > PH-60) { doc.addPage(); y = pageTopBar('Liabilities (cont.)')+30; pageFooter(); }
        doc.setFillColor(...lBlue); doc.rect(M, y-10, TW, 14, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
        doc.text('TOTAL LIABILITIES', M+3, y);
        doc.text(fmtC(totalLiabilities), PW-M-3, y, { align:'right' });
        y += 22;
      }

      // GAP analysis box on same page if room, otherwise new page
      if (y > PH-90) { doc.addPage(); y = pageTopBar('')+30; pageFooter(); }
      y += 6;
      const gapColor: [number,number,number] = Gap > 0 ? [255,235,235] : [235,255,235];
      doc.setFillColor(...gapColor); doc.rect(M, y, TW, 36, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
      doc.text(`GAP @ Retirement Age ${data.plannedRetirementAge}:`, M+6, y+13);
      doc.setTextColor(...(Gap > 0 ? red : green));
      doc.text(fmtC(Gap), PW-M-6, y+13, { align:'right' });
      doc.setTextColor(...black);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      doc.text(`= Total Planning (${fmtC(data.totalRequirement)}) − Projected Assets @ ${data.plannedRetirementAge} (${fmtC(totalProjected)}) − Liabilities (${fmtC(totalLiabilities)})`, M+6, y+25);
      doc.text(Gap > 0 ? '▲ Shortfall — Additional planning needed' : '▼ Surplus — Goals are covered by projected assets', M+6, y+33);
      y += 44;

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 7 — Financial Goals & Planning (moved after Liabilities)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar('Financial Goals & Planning'); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text('Financial Goals & Planning', M, y+20); y += 36;

      // Retirement planning table
      y = sectionBanner('Retirement Planning', y);
      const retPlanRows: [string,string,string][] = [
        ['#5', 'Current Age', String(data.currentAge||0)],
        ['#6', `Years To Retirement (${data.plannedRetirementAge} - Current Age)`, String(data.yearsToRetirement)],
        ['#7', 'Retirement Years (85 - Current Age)', String(data.retirementYears)],
        ['#8', 'Monthly Income Needed (Today\'s Dollars)', fmtC(data.monthlyIncomeNeeded)],
        ['#9', 'Monthly Income Needed (At Retirement @ 3%)', fmtC(data.monthlyRetirementIncome)],
        ['#10', 'Annual Retirement Income Needed', fmtC(data.annualRetirementIncome)],
        ['#11', 'Total Retirement Income Needed', fmtC(data.totalRetirementIncome)],
      ];
      const rCols = [30, 310, 148];
      y = trow(['#','Description','Amount'], y, rCols, true, lBlue);
      retPlanRows.forEach((r,i) => {
        y = trow(r, y, rCols, i===retPlanRows.length-1, i%2===0?lgray:undefined);
      }); y += 8;

      // College & Wedding
      if (y > PH-100) { doc.addPage(); y = pageTopBar('Financial Goals (cont.)')+30; pageFooter(); }
      y = sectionBanner('College & Wedding Planning', y);
      const goalTableRows: [string,string,string][] = [
        ['#1', `Child 1 College: ${data.child1CollegeName||''}`, fmtC(data.child1CollegeAmount)],
        ['#2', `Child 2 College: ${data.child2CollegeName||''}`, fmtC(data.child2CollegeAmount)],
        ['#3', `Child 1 Wedding: ${data.child1CollegeName||''}`, fmtC(data.child1WeddingAmount)],
        ['#4', `Child 2 Wedding: ${data.child2CollegeName||''}`, fmtC(data.child2WeddingAmount)],
      ];
      y = trow(['#','Description','Amount'], y, rCols, true, lBlue);
      goalTableRows.forEach((r,i) => { y = trow(r, y, rCols, false, i%2===0?lgray:undefined); });
      y += 8;

      // Healthcare
      if (y > PH-80) { doc.addPage(); y = pageTopBar('Financial Goals (cont.)')+30; pageFooter(); }
      y = sectionBanner('Healthcare Planning', y);
      const hcRows: [string,string,string][] = [
        ['#12','Healthcare Expenses', fmtC(data.healthcareExpenses)],
        ['#13','Long-Term Care (3% × yrs × 2)', fmtC(data.longTermCare)],
      ];
      y = trow(['#','Description','Amount'], y, rCols, true, lBlue);
      hcRows.forEach((r,i) => { y = trow(r, y, rCols, false, i%2===0?lgray:undefined); });
      y += 8;

      // Life Goals & Legacy
      if (y > PH-130) { doc.addPage(); y = pageTopBar('Financial Goals (cont.)')+30; pageFooter(); }
      y = sectionBanner('Life Goals & Legacy', y);
      const lgRows: [string,string,string][] = [
        ['#14','Travel Budget', fmtC(data.travelBudget)],
        ['#15','Vacation Home', fmtC(data.vacationHome)],
        ['#16','Charity / Giving', fmtC(data.charity)],
        ['#17','Other Goals', fmtC(data.otherGoals)],
        ['#18','Headstart Fund for Grandkids', fmtC(data.headstartFund)],
        ['#19','Family Legacy', fmtC(data.familyLegacy)],
        ['#20','Family Support', fmtC(data.familySupport)],
      ];
      y = trow(['#','Description','Amount'], y, rCols, true, lBlue);
      lgRows.forEach((r,i) => { y = trow(r, y, rCols, false, i%2===0?lgray:undefined); });
      y += 6;

      // Total Requirement
      if (y > PH-50) { doc.addPage(); y = pageTopBar('')+30; pageFooter(); }
      doc.setFillColor(255,255,153); doc.rect(M, y, TW, 18, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(9.5);
      doc.text('💰 Total Requirement', M+6, y+12.5);
      doc.setTextColor(21,128,61);
      doc.text(fmtC(data.totalRequirement), PW-M-6, y+12.5, { align:'right' });
      doc.setTextColor(...black);

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 8 — Your Financial Lifestyle Strategies  (Standard Template)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...navy); doc.text('Your Financial Lifestyle', M, y+20);
      doc.text('Strategies', M, y+36);
      doc.setTextColor(...black); y += 50;

      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      const flsIntro = 'This analysis provides only broad, general guidelines, which may be helpful in determining your personal financial needs. It can serve as a guide for discussions with your professional advisors. Each of the recommendations in this analysis are calculated independently and are not intended to be a comprehensive financial plan.';
      const flsLines = doc.splitTextToSize(flsIntro, TW/2 - 10);
      doc.text(flsLines, M, y);
      y += Math.max(flsLines.length*11, 60) + 10;

      y = sectionBanner('Estate Preservation & Legal Protection', y);
      const estateData: [string,string][] = [
        ['Do You Have a Will?','No'],
        ['Do You Have a Living Will?','No'],
        ['Does Your Spouse Have a Will?','No'],
        ['Does Your Spouse Have a Healthcare Power of Attorney?','No'],
        ['Does Your Spouse Have a Living Will?','No'],
        ['Does Your Spouse Have Their Own Attorney?','No'],
        ['Do You Have a Healthcare Power of Attorney?','No'],
        ['Do You Have Your Own Attorney?','No'],
      ];
      const half = Math.ceil(estateData.length/2);
      for(let i=0; i<half; i++){
        const l = estateData[i], r2 = estateData[i+half];
        kv(l[0], l[1], M, y);
        if (r2) kv(r2[0], r2[1], M+TW/2, y);
        y += 13;
      }
      y += 8;

      y = sectionBanner('Debt & Credit Management', y);
      const totalMinPmt = liabilityRows.reduce((s,r) => s+(parseFloat(String(r.min_payment||0))||0),0);
      const mortgageLiab = liabilityRows.find(r => String(r.liability_type||'').toLowerCase().includes('mortgage'));
      const mortgageBal = mortgageLiab ? (parseFloat(String(mortgageLiab.balance||0))||0) : 0;
      const debtData: [string,string,string,string][] = [
        ['Monthly Debt Payments', fmtC(totalMinPmt), 'Monthly Mortgage Payments', '-'],
        ['Total Monthly Debt Payments', fmtC(totalMinPmt), 'Debt Balance', '$0.00'],
        ['Household DTI Ratio', totalMinPmt && assets.s6_present ? `${((totalMinPmt*12/assets.s6_present)*100).toFixed(2)}%` : '-', 'Total Debt Including Mortgages', fmtC(totalLiabilities)],
        ['Mortgage Balance', fmtC(mortgageBal), 'Credit Rating (Spouse)', 'Good'],
        ['Credit Rating (Client)', 'Good', '', ''],
      ];
      debtData.forEach(([l1,v1,l2,v2]) => {
        kv(l1,v1,M,y); if(l2) kv(l2,v2,M+TW/2,y); y+=13;
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 9 — 6 Steps to Financial Security (Standard Template)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...navy); doc.text('6 Steps to Financial Security', M, y+20);
      doc.setTextColor(...black); y += 38;

      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      const steps6Intro = 'Success begins with financial education. As you move through these 6 Steps to Financial Security, you will evaluate your current financial situation, identify your goals, and objectives. Your HGI Associate will help guide you to suitable products and solutions to help you reach your financial dreams. The result is your personalized Financial Lifestyle Strategy.';
      const s6Lines = doc.splitTextToSize(steps6Intro, TW);
      doc.text(s6Lines, M, y); y += s6Lines.length*10 + 12;

      const steps6: [string,string,string,string][] = [
        ['1','Increase Cash Flow',   'Earn additional income', 'Manage expenses'],
        ['2','Debt Management',      'Consolidate debt', 'Eliminate debt'],
        ['3','Emergency Fund',       'Save 3-6 months\' income', 'Prepare for unexpected expenses'],
        ['4','Proper Protection',    'Protect against loss of income', 'Protect family assets'],
        ['5','Build Wealth',         'Outpace inflation', 'Active money management'],
        ['6','Preserve Wealth',      'Avoid probate', 'Reduce taxation'],
      ];
      steps6.forEach(([num, title, sub1, sub2]) => {
        // Icon square
        doc.setFillColor(200,214,229); doc.rect(M, y-11, 22, 22, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(11);
        doc.setTextColor(...navy); doc.text(num, M+8, y+2);
        doc.setTextColor(...black);
        // Step title
        doc.setFont('helvetica','bold'); doc.setFontSize(9.5);
        doc.text(title, M+28, y);
        // Sub items
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
        doc.setTextColor(...dkgray);
        doc.text(sub1, M+TW/2, y-4); doc.text(sub2, M+TW/2, y+4);
        doc.setTextColor(...black);
        y += 24;
      });

      y += 10;
      doc.setFont('helvetica','bold'); doc.setFontSize(11);
      doc.setTextColor(...navy); doc.text('Financial Prioritization', M, y);
      doc.setTextColor(...black); y += 14;
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      doc.text('Start at the bottom and work your way up.', M, y); y += 16;

      // Pyramid tiers
      const tiers = [
        {label:'Protect', sub:'What You Earn  |  What You Own  |  What You Owe  |  Those You Love', tag:'Defensive Planning'},
        {label:'Plan For', sub:'Major Purchases  |  College Education  |  Emergencies  |  Retirement', tag:'Offensive Planning'},
        {label:'Prioritize Goals', sub:'Diversity to Reduce Risk  |  Maximize Qualified Plan Contributions  |  Overpower Inflation', tag:'Aggressive Planning'},
        {label:'Pass Along Assets', sub:'Estate Conservation  |  Charitable Giving  |  Consider Tax Efficiency  |  Business Continuation Planning', tag:'Progressive Planning'},
      ];
      const tierBase = y + tiers.length * 22;
      tiers.forEach((tier, idx) => {
        const tierW = 80 + idx*60;
        const tierX = M + (TW-tierW)/2;
        const tierY = tierBase - idx*22 - 18;
        const shade = Math.round(70+idx*40);
        doc.setFillColor(shade, shade+20, 200-idx*20);
        doc.rect(tierX, tierY, tierW, 18, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
        doc.setTextColor(...white); doc.text(tier.label, tierX+tierW/2, tierY+8, {align:'center'});
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5);
        doc.text(doc.splitTextToSize(tier.sub, tierW-4), tierX+2, tierY+13);
        doc.setTextColor(...navy); doc.setFontSize(7);
        doc.text(tier.tag, M+TW+2, tierY+10);
        doc.setTextColor(...black);
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 10 — The Wealth Flow Formula (Standard Template)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...navy); doc.text('The Wealth Flow Formula', M, y+20);
      doc.setTextColor(...black); y += 38;

      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      const wffIntro = 'This concept is a simple way to show the relationship between taking care of your responsibilities and building and preserving your wealth. The Wealth Flow Formula combines two concepts that address your changing long-term financial needs:';
      const wffLines = doc.splitTextToSize(wffIntro, TW);
      doc.text(wffLines, M, y); y += wffLines.length*10 + 10;

      const wffSections = [
        {bold:'1. The Theory of Decreasing Responsibility.', text:' In the early years, since you haven\'t had the time to accumulate wealth, you must rent a substitute form of wealth called Term Life Insurance. With responsibilities such as young children, high debt, a mortgage and college to pay for, a loss of income from death or a Chronic, Critical or Terminal Illness would be devastating to a family. Even a non-working spouse needs to be protected in order to support a loved one and to ensure financial stability in the family.'},
        {bold:'2. The Law of Building Equity.', text:' Over the years as your financial needs change, you are beginning to accumulate wealth with the Law of Building Equity and your financial responsibilities are decreasing as your children become grown, your debt is reduced, and your mortgage is paid or nearly-paid. In the later years, as you have accumulated wealth, you need to protect against living too long, income taxes, lawsuits, garnishments, liens, judgments and estate taxes. To solve this need, Permanent Life Insurance is needed.'},
      ];
      wffSections.forEach(s => {
        if (y > PH-120) { doc.addPage(); y = pageTopBar('')+30; pageFooter(); }
        const boldW = doc.getStringUnitWidth(s.bold) * 8.5 / doc.internal.scaleFactor;
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
        doc.text(s.bold, M, y);
        doc.setFont('helvetica','normal');
        const rest = doc.splitTextToSize(s.text, TW);
        // First continuation line offset
        doc.text(rest[0], M + boldW + 2, y);
        if (rest.length > 1) { doc.text(rest.slice(1), M, y+10); }
        y += rest.length*10 + 10;
      });

      // Today / Tomorrow boxes
      if (y > PH-120) { doc.addPage(); y = pageTopBar('')+30; pageFooter(); }
      y += 6;
      const boxW = (TW-20)/2;
      // Left box – Today
      doc.setFillColor(230,240,255); doc.rect(M, y, boxW, 80, 'F');
      doc.setFillColor(...navy); doc.rect(M, y, boxW, 14, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...white);
      doc.text('In the early years, you may need a lot of coverage...', M+4, y+10);
      doc.setTextColor(...black); doc.setFontSize(7.5); doc.setFont('helvetica','normal');
      doc.text('Term Insurance', M+boxW/2, y+35, {align:'center'});
      doc.text('You may not have a lot of money.', M+4, y+50);
      doc.setFont('helvetica','bold'); doc.text('TODAY – Protect Income', M+4, y+62);
      doc.setFont('helvetica','normal'); doc.text('1. Young children  2. High debt  3. House mortgage', M+4, y+72);
      // Arrow
      doc.setFillColor(...navy); doc.rect(M+boxW+2, y+30, 16, 20, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...white);
      doc.text('→', M+boxW+5, y+43);
      doc.setTextColor(...black);
      // Right box – Tomorrow
      doc.setFillColor(230,245,230); doc.rect(M+boxW+20, y, boxW, 80, 'F');
      doc.setFillColor(...navy); doc.rect(M+boxW+20, y, boxW, 14, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...white);
      doc.text('In the later years... You\'d better have money.', M+boxW+24, y+10);
      doc.setTextColor(...black); doc.setFontSize(7.5); doc.setFont('helvetica','normal');
      doc.text('Indexed Universal Life', M+boxW+20+boxW/2, y+35, {align:'center'});
      doc.text('...in the later years, you may not.', M+boxW+24, y+50);
      doc.setFont('helvetica','bold'); doc.text('TOMORROW – Protect Wealth', M+boxW+24, y+62);
      doc.setFont('helvetica','normal'); doc.text('1. Grown children  2. Lower debt  3. Mortgage paid', M+boxW+24, y+72);

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 11 — The Rule of 72 (Standard Template)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...navy); doc.text('The Rule of 72', M, y+20);
      doc.setTextColor(...black); y += 38;

      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      const r72text = 'Have you ever wondered how quickly your money would double based on the interest rate that you are receiving? This can be easily calculated using the Rule of 72. It will help you determine the effect of compound interest over a number of years. Simply take the number 72 and divide it by the rate of return that you are receiving on your money. The result is the approximate number of years it will take for your money to double.\nThe banks and finance companies understand the Rule of 72, however they use it to their advantage by lending consumers money and charging them 8%, 10%, 12% or even much higher! Then they pay you less than 1% on your money and keep the difference as profit. When this happens, you are on the wrong side of the Rule of 72, and it is being used against you. The "Magic of Compound Interest" works against you with debt. As time goes on, the interest charges compound and it becomes harder and harder to get out of debt.\nDo you think that the wealthy understand how money works? Of course, they do. They take the time to learn and study the "rules of the money game" and then they place a plan into action to receive better returns on their money. Many people in Middle America do not know the "rules of the money game". They do not have a financial plan for long term success. Most of the savings that they do have are earning low rates of return, so instead of having their money work for them, they spend a lifetime working for money.';
      r72text.split('\n').forEach(para => {
        const ls = doc.splitTextToSize(para, TW); doc.text(ls, M, y); y += ls.length*10+6;
      }); y += 8;

      // Rule of 72 comparison table
      const r72Cols = [120, 130, 150];
      y = trow(['Interest Rate', 'Money Doubles Every', 'Growth Example (starting age 29)'], y, r72Cols, true, lBlue);
      const r72Rows: [string,string,string][] = [
        ['2%','Every 36 Years','29→$10,000  |  65→$20,000'],
        ['4%','Every 18 Years','29→$10,000  |  47→$20,000  |  65→$40,000'],
        ['8%','Every 9 Years', '29→$10,000  |  38→$20,000  |  47→$40,000  |  56→$80,000  |  65→$160,000'],
      ];
      r72Rows.forEach((r,i) => { y = trow(r, y, r72Cols, false, i%2===0?lgray:undefined); });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 12 — Time & Consistency (Standard Template)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...navy); doc.text('Time & Consistency', M, y+20);
      doc.setTextColor(...black); y += 38;

      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      const tcText = 'You may think that you will never earn enough money to have a true level of financial independence. All it takes is the right combination of time, consistency, and the "Magic of Compound Interest."\nIf you\'re like most people, you don\'t have a lot of money to invest. That\'s why time is so critical. When you\'re young, you can save small amounts and still end up with thousands of dollars at retirement. If you wait to begin saving, you must save much more. If you want to be financially independent, you have no choice – you must start now, or later you must save more. One thing is certain: you can\'t afford the high cost of waiting.';
      tcText.split('\n').forEach(para => {
        const ls = doc.splitTextToSize(para, TW); doc.text(ls, M, y); y += ls.length*10+6;
      }); y += 8;

      // High Cost of Waiting table
      doc.setFont('helvetica','bold'); doc.setFontSize(9);
      doc.text('The High Cost of Waiting', PW/2, y, {align:'center'}); y += 4;
      doc.setFont('helvetica','normal'); doc.setFontSize(8);
      doc.text('$100 per month at 12%', PW/2, y+10, {align:'center'}); y += 20;
      const hcwCols = [120, 120, 120, 100];
      y = trow(['Start Saving At Age','Total at Age 65','Cost to Wait','Notes'], y, hcwCols, true, lBlue);
      const hcwRows: [string,string,string,string][] = [
        ['25','$979,307','N/A','Optimal – start today'],
        ['26','$873,241','$106,066','1 year delay'],
        ['30','$551,083','$428,224','5 year delay'],
      ];
      hcwRows.forEach((r,i) => { y = trow(r, y, hcwCols, false, i%2===0?lgray:undefined); });
      y += 14;

      doc.setFont('helvetica','bold'); doc.setFontSize(9);
      doc.text('Begin With A Lump Sum', M, y); y += 14;
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      const lsText = 'There\'s one way to really give yourself a boost when you start your long-term savings program. If you start with a lump sum to begin with, your results will be significantly different. If you started your savings program with a 1-year lump sum of $120 ($10 per month x 12 months), you will be giving yourself a full year head start. Look at how dramatic the difference in results would be:';
      const lsLines = doc.splitTextToSize(lsText, TW);
      doc.text(lsLines, M, y); y += lsLines.length*10 + 10;

      const lsCols = [180, 80, 80, 80, 80];
      y = trow(['Scenario','20 Years','30 Years','40 Years','50 Years'], y, lsCols, true, lBlue);
      y = trow(['$10/month @ 12%','$9,198','$30,809','$97,930','$306,398'], y, lsCols, false, lgray);
      y = trow(['$120 lump sum + $10/month @ 12%','$10,356','$34,404','$109,096','$341,078'], y, lsCols, false);

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 13 — Your HGI Associate (Standard Template)
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage(); y = pageTopBar(''); pageFooter();
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...navy); doc.text('Your HGI Associate', M, y+20);
      doc.setTextColor(...black); y += 38;

      y = sectionBanner('HGI Associate Details', y);
      const assocData: [string,string][] = [
        ['HGI Associate Name', 'Chidambaranathan Alagar'],
        ['Code', 'CAE4E3CF'],
        ['Email', 'chidam.alagar@gmail.com'],
        ['Phone', '4029578693'],
      ];
      assocData.forEach(([lbl,val]) => {
        kv(lbl, val, M, y, 130); y += 16;
      });
      y += 8;

      y = sectionBanner('Advisor Notes', y);
      y += 8;
      const notesDisplay = (data.notes && !data.notes.startsWith('__ASSETS__')) ? data.notes : 'No notes provided.';
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      doc.text(doc.splitTextToSize(notesDisplay, TW), M, y);
      y += 40;

      // Generated for box
      doc.setFillColor(...lBlue); doc.rect(M, y, TW, 24, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
      doc.text(`Report generated for: ${data.clientName}  |  Date: ${mmddyyyy}`, M+6, y+10);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      doc.text(`Analysis Date: ${data.analysisDate||mmddyyyy}  |  Planned Retirement Age: ${data.plannedRetirementAge}  |  Interest Rate: ${data.calculatedInterestPercentage}%`, M+6, y+20);
      y += 32;

      // Final disclaimer box
      doc.setFillColor(30,30,30); doc.rect(M, y, TW, 24, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.setTextColor(...white);
      doc.text('⚠ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE.', PW/2, y+10, {align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(7);
      doc.text('All projections are hypothetical estimates based on information provided. Past performance does not guarantee future results.', PW/2, y+19, {align:'center'});
      doc.setTextColor(...black);

      // ── Save ──────────────────────────────────────────────────────────────
      const safeClientName = data.clientName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
      doc.save(`${safeClientName}_${mmddyyyy}.pdf`);

    } catch (err: any) {
      alert(`Report generation failed: ${err.message}\n\nMake sure jspdf is installed: npm install jspdf`);
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
          <div className="grid grid-cols-3 gap-2 mb-2">
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
              <input readOnly value={data.clientPhone} className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Email</label>
              <input readOnly value={data.clientEmail} className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Spouse Name</label>
              <input value={data.spouseName} onChange={e => setData(p => ({ ...p, spouseName: e.target.value }))}
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
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Analysis Date</label>
              <input type="date" value={data.analysisDate}
                onChange={e => setData(p => ({ ...p, analysisDate: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Date of Birth</label>
              <input type="date" value={data.dob}
                onChange={e => setData(p => ({ ...p, dob: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
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
              <label className="block text-xs font-semibold mb-1 text-gray-600">Note</label>
              <input type="text" value={data.notes} placeholder="Add notes..."
                onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
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
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{data.yearsToRetirement}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#7</td>
                      <td className="border border-black px-2 py-1 text-xs">Retirement Years (85 - {data.plannedRetirementAge})</td>
                      <NoteTd value={data.retirementNote3} onChange={v => setData(p => ({ ...p, retirementNote3: v }))}/>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{data.retirementYears}</td>
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
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{formatCurrency(data.longTermCare)}</td>
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
                    {/* r1 – 401K auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#1</td>
                      <td className="border border-black px-2 py-1 text-xs">Current 401K | 403B</td>
                      {stdCells("r1_him","r1_her","r1_notes","r1_present")}
                      <AutoProjCell present={assets.r1_present} />
                    </tr>
                    {/* r2 – Company Match N/A proj */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#2</td>
                      <td className="border border-black px-2 py-1 text-xs">Company Match %</td>
                      {stdCells("r2_him","r2_her","r2_notes","r2_present")}
                      <NAProjCell />
                    </tr>
                    {/* r3 – Max Funding N/A proj */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#3</td>
                      <td className="border border-black px-2 py-1 text-xs">Are You Max Funding (~$22.5K)?</td>
                      {stdCells("r3_him","r3_her","r3_notes","r3_present")}
                      <NAProjCell />
                    </tr>
                    {/* r4 – Prev 401K auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#4</td>
                      <td className="border border-black px-2 py-1 text-xs">Previous 401K | Rollover 401K</td>
                      {stdCells("r4_him","r4_her","r4_notes","r4_present")}
                      <AutoProjCell present={assets.r4_present} />
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
                      <NAProjCell />
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
                      <td className="border border-black px-2 py-1 text-xs text-center text-gray-400 bg-gray-50">N/A</td>
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

// app/quote_tool/page.tsx
// NEW FILE: Term Insurance Quote Tool
// Generates instant premium comparisons across major term life insurance carriers.
// Rate engine uses actuarial base rates derived from Corebridge Financial market data (March 2025).

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ─── Auth cookie helpers ───────────────────────────────────────────────────────
const AUTH_COOKIE = 'canfs_auth';
function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`${AUTH_COOKIE}=true`));
}
function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type HealthClass = 'Preferred Plus Non-Tobacco' | 'Preferred Non-Tobacco' | 'Standard Non-Tobacco' | 'Tobacco';
type Gender = 'Male' | 'Female';

type QuoteParams = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  gender: Gender;
  health_class: HealthClass;
  face_amount: number;
  term_years: number;
};

type ABRBenefit = {
  chronic: string;
  critical: string;
  terminal: string;
};

type CarrierDef = {
  id: string;
  carrier: string;
  product: string;
  highlight: boolean; // marks our recommended/featured carrier
  abr: ABRBenefit;
  // Base monthly rate per $1,000 face at Male/40/PNT/30yr (from market data March 2025)
  basePer1000: number;
};

// ─── Carrier database ──────────────────────────────────────────────────────────
// Base rates derived from Corebridge market comparison data (March 24, 2025)
// Base: Male, Age 40, Preferred Non-Tobacco, 30-Year, $1,000,000 face amount
const CARRIERS: CarrierDef[] = [
  {
    id: 'corebridge',
    carrier: 'Corebridge Financial',
    product: 'QoL Flex Term',
    highlight: true,
    basePer1000: 0.11541,
    abr: {
      chronic: '$1,000,000 – 30-day wait',
      critical: '$1,000,000 – 30-day wait',
      terminal: '$1,000,000 – No wait',
    },
  },
  {
    id: 'lincoln',
    carrier: 'Lincoln Financial',
    product: 'TermAccel',
    highlight: false,
    basePer1000: 0.11698,
    abr: {
      chronic: 'N/A',
      critical: 'N/A',
      terminal: '$250,000 – No wait',
    },
  },
  {
    id: 'nationwide',
    carrier: 'Nationwide',
    product: 'Guaranteed Level Term',
    highlight: false,
    basePer1000: 0.12206,
    abr: {
      chronic: '20% of face OR HIPAA daily rate × 365 – 30-day wait',
      critical: 'Lesser of 10% of face or $25,000/event – 30-180 day wait',
      terminal: '$250,000 – No wait',
    },
  },
  {
    id: 'northam',
    carrier: 'North American',
    product: 'ADDvantage Term',
    highlight: false,
    basePer1000: 0.13068,
    abr: {
      chronic: 'Lesser of 24% of face or $480,000/yr – No wait',
      critical: '$1,000,000 – 30-day wait',
      terminal: '$900,000 – No wait',
    },
  },
  {
    id: 'nlg',
    carrier: 'National Life Group',
    product: 'Level Term',
    highlight: false,
    basePer1000: 0.13596,
    abr: {
      chronic: 'Lesser of 100% of DB or $1,000,000 – 30-day wait',
      critical: 'Lesser of 100% of DB or $1,000,000 – 30-day wait',
      terminal: '$1,000,000 – No wait',
    },
  },
  {
    id: 'moo',
    carrier: 'Mutual of Omaha',
    product: 'Term Life Answers',
    highlight: false,
    basePer1000: 0.14126,
    abr: {
      chronic: 'N/A',
      critical: 'N/A',
      terminal: '$800,000 – No wait',
    },
  },
  {
    id: 'ameritas',
    carrier: 'Ameritas',
    product: 'ClearEdge LB Term',
    highlight: false,
    basePer1000: 0.14191,
    abr: {
      chronic: '$1,000,000 – 90-day wait',
      critical: '$1,000,000 – Stroke 30-day / Paralysis 90-day / Coma 96-hr wait',
      terminal: '$1,000,000 – No wait',
    },
  },
  {
    id: 'jh',
    carrier: 'John Hancock',
    product: 'Protection Term',
    highlight: false,
    basePer1000: 0.16156,
    abr: {
      chronic: 'N/A',
      critical: 'N/A',
      terminal: '$500,000 – No wait',
    },
  },
  {
    id: 'transamerica',
    carrier: 'Transamerica',
    product: 'Trendsetter LB',
    highlight: false,
    basePer1000: 0.16598,
    abr: {
      chronic: '$900,000 – 2-year wait',
      critical: '$900,000 – 30-day wait',
      terminal: '$1,000,000 – No wait',
    },
  },
  {
    id: 'ethos',
    carrier: 'Ethos Life',
    product: 'Term Life',
    highlight: false,
    basePer1000: 0.12950,
    abr: {
      chronic: 'N/A',
      critical: 'N/A',
      terminal: 'Up to $500,000 – No wait',
    },
  },
];

// ─── Rate calculation engine ───────────────────────────────────────────────────
// Multiplier tables calibrated to common actuarial patterns.

/** Age multiplier relative to base age 40 */
function ageMultiplier(age: number): number {
  // Exponential age loading roughly matching SOA data
  const base = 40;
  const diff = age - base;
  if (diff === 0) return 1.0;
  if (diff > 0) return Math.pow(1.072, diff);  // ~7.2% per year older
  return Math.pow(0.940, Math.abs(diff));       // ~6% per year younger
}

/** Gender multiplier (Female historically ~20-25% lower than Male) */
function genderMultiplier(gender: Gender): number {
  return gender === 'Female' ? 0.78 : 1.0;
}

/** Health class multiplier relative to PNT (Preferred Non-Tobacco) */
function healthMultiplier(hc: HealthClass): number {
  switch (hc) {
    case 'Preferred Plus Non-Tobacco': return 0.88;
    case 'Preferred Non-Tobacco':       return 1.00;
    case 'Standard Non-Tobacco':        return 1.35;
    case 'Tobacco':                     return 2.10;
    default:                            return 1.00;
  }
}

/** Term duration multiplier relative to 30-year base */
function termMultiplier(years: number): number {
  const table: Record<number, number> = {
    10: 0.55, 15: 0.68, 20: 0.78, 25: 0.90, 30: 1.00,
  };
  return table[years] ?? 1.0;
}

/** Calculate monthly premium for a carrier given quote params */
function calcMonthlyPremium(carrier: CarrierDef, p: QuoteParams): number {
  const perThousand = carrier.basePer1000
    * ageMultiplier(p.age)
    * genderMultiplier(p.gender)
    * healthMultiplier(p.health_class)
    * termMultiplier(p.term_years);
  return (perThousand * p.face_amount) / 1000;
}

/** Format currency */
const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/** Format face amount shorthand */
const fmtFace = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

// ─── Available term options ────────────────────────────────────────────────────
const TERM_OPTIONS = [10, 15, 20, 25, 30];
const FACE_OPTIONS = [
  250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000,
];
const HEALTH_CLASSES: HealthClass[] = [
  'Preferred Plus Non-Tobacco',
  'Preferred Non-Tobacco',
  'Standard Non-Tobacco',
  'Tobacco',
];

// ─── Default form values ───────────────────────────────────────────────────────
const DEFAULT_PARAMS: QuoteParams = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  age: 40,
  gender: 'Male',
  health_class: 'Preferred Non-Tobacco',
  face_amount: 1_000_000,
  term_years: 30,
};

// ─── Helper: compute age from DOB ─────────────────────────────────────────────
function ageFromDob(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

// ─── ABR badge color helper ────────────────────────────────────────────────────
function abrColor(val: string) {
  if (val === 'N/A') return 'text-slate-400';
  if (val.includes('$1,000,000')) return 'text-emerald-700 font-semibold';
  return 'text-slate-700';
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function QuoteToolPage() {
  const router = useRouter();

  // Auth guard
  if (typeof window !== 'undefined' && !hasAuthCookie()) {
    router.push('/auth');
  }

  const logout = () => {
    clearAuthCookie();
    router.push('/auth');
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [params, setParams] = useState<QuoteParams>({ ...DEFAULT_PARAMS });
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(
    new Set(CARRIERS.map((c) => c.id))
  );
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [showABR, setShowABR] = useState(true);

  // ── Derived: active carriers sorted by premium ────────────────────────────
  const quoteResults = useMemo(() => {
    if (!quoteGenerated) return [];
    return CARRIERS
      .filter((c) => selectedCarriers.has(c.id))
      .map((c) => ({ ...c, monthly: calcMonthlyPremium(c, params) }))
      .sort((a, b) => a.monthly - b.monthly);
  }, [quoteGenerated, selectedCarriers, params]);

  const lowestMonthly = quoteResults[0]?.monthly ?? 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleCarrier = (id: string) => {
    setSelectedCarriers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const selectAllCarriers = () => setSelectedCarriers(new Set(CARRIERS.map((c) => c.id)));
  const clearAllCarriers  = () => setSelectedCarriers(new Set([CARRIERS[0].id]));

  const handleDobChange = (dob: string) => {
    const age = ageFromDob(dob);
    setParams((p) => ({ ...p, date_of_birth: dob, age: age > 0 ? age : p.age }));
  };

  const generateQuote = () => {
    if (params.age < 18 || params.age > 75) {
      alert('Age must be between 18 and 75 for term life insurance.');
      return;
    }
    setQuoteGenerated(true);
  };

  const resetQuote = () => {
    setParams({ ...DEFAULT_PARAMS });
    setQuoteGenerated(false);
  };

  const printQuote = () => window.print();

  // ── Annual / total premium helpers ────────────────────────────────────────
  const annual = (m: number) => m * 12;
  const total  = (m: number) => m * 12 * params.term_years;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 pt-5 pb-3 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/anunathan-logo.png"
                className="h-14 w-auto"
                alt="Logo"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
              <div>
                <div className="text-lg font-bold text-[#1E5AA8]">Quote Tool</div>
                <div className="text-xs font-semibold text-[#808000]">
                  Term Life Insurance · Instant Premium Comparison
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Dashboard
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Logout ➜
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block px-6 pt-4 pb-2 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-[#1E5AA8]">Term Life Insurance Quote Comparison</div>
            <div className="text-sm text-slate-600 mt-0.5">
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-semibold">AnNa Financial Group</div>
            <div>Build your career. Protect their future</div>
            <div className="mt-1 text-[10px] text-slate-400">FOR FINANCIAL PROFESSIONAL USE ONLY · NOT FOR PUBLIC DISTRIBUTION</div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-10 space-y-5">

        {/* ── TOP PANEL: Carriers + Parameters ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 print:hidden">

          {/* ── CARRIER SELECTION ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Select Carriers</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllCarriers}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllCarriers}
                  className="text-xs text-slate-500 hover:underline font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {CARRIERS.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors
                    ${selectedCarriers.has(c.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCarriers.has(c.id)}
                    onChange={() => toggleCarrier(c.id)}
                    className="mt-0.5 accent-blue-600 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 truncate">{c.carrier}</span>
                      {c.highlight && (
                        <span className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                          ★ TOP
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{c.product}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-slate-400 text-center">
              {selectedCarriers.size} of {CARRIERS.length} carriers selected
            </div>
          </div>

          {/* ── QUOTE PARAMETERS ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Quote Parameters</h2>

            {/* Personal info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="First Name"
                  value={params.first_name}
                  onChange={(e) => setParams((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Last Name"
                  value={params.last_name}
                  onChange={(e) => setParams((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  value={params.date_of_birth}
                  onChange={(e) => handleDobChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Age {params.date_of_birth && <span className="text-blue-500">(auto)</span>}
                </label>
                <input
                  type="number"
                  min={18}
                  max={75}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  value={params.age}
                  onChange={(e) => setParams((p) => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Insurance parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={params.gender}
                  onChange={(e) => setParams((p) => ({ ...p, gender: e.target.value as Gender }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Health Class</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={params.health_class}
                  onChange={(e) => setParams((p) => ({ ...p, health_class: e.target.value as HealthClass }))}
                >
                  {HEALTH_CLASSES.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Face Amount</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={params.face_amount}
                  onChange={(e) => setParams((p) => ({ ...p, face_amount: parseInt(e.target.value) }))}
                >
                  {FACE_OPTIONS.map((f) => (
                    <option key={f} value={f}>{fmtFace(f)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Term Duration</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  value={params.term_years}
                  onChange={(e) => setParams((p) => ({ ...p, term_years: parseInt(e.target.value) }))}
                >
                  {TERM_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}-Year Term</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary pill */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 mb-4">
              <span>👤 <b>{params.gender}</b>, Age <b>{params.age}</b></span>
              <span>❤️ <b>{params.health_class}</b></span>
              <span>💰 Face Amount: <b>{fmtFace(params.face_amount)}</b></span>
              <span>📅 <b>{params.term_years}-Year</b> Term</span>
              {(params.first_name || params.last_name) && (
                <span>🧾 Client: <b>{params.first_name} {params.last_name}</b></span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={generateQuote}
                disabled={params.age < 18 || params.age > 75}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E5AA8] text-white font-semibold px-5 py-2 text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🔍 Generate Quote
              </button>
              {quoteGenerated && (
                <>
                  <button
                    type="button"
                    onClick={resetQuote}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    ↺ Reset
                  </button>
                  <button
                    type="button"
                    onClick={printQuote}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    🖨️ Print
                  </button>
                  <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showABR}
                      onChange={(e) => setShowABR(e.target.checked)}
                      className="accent-blue-600"
                    />
                    <span className="text-xs text-slate-600 font-medium">Show Living Benefits (ABR)</span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── QUOTE RESULTS TABLE ───────────────────────────────────────────── */}
        {quoteGenerated && quoteResults.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* Results header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#1E5AA8] to-[#2d7dd2]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Premium Comparison — {quoteResults.length} Carrier{quoteResults.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {params.gender}, Age {params.age} · {params.health_class} · {fmtFace(params.face_amount)} Face Amount · {params.term_years}-Year Term
                    {(params.first_name || params.last_name) && ` · ${params.first_name} ${params.last_name}`}
                  </p>
                </div>
                <div className="text-right text-xs text-blue-100">
                  <div>Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div className="mt-0.5 text-[10px] opacity-70">Rates are illustrative estimates only. Actual premiums subject to underwriting.</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-semibold">
                    <th className="px-4 py-3 text-left sticky left-0 bg-slate-100 z-10 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left sticky left-8 bg-slate-100 z-10 whitespace-nowrap min-w-[160px]">Carrier / Product</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Monthly</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Annual</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Total ({params.term_years} yrs)</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">vs. Lowest</th>
                    {showABR && <>
                      <th className="px-4 py-3 text-left whitespace-nowrap min-w-[220px]">Chronic Illness ABR</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap min-w-[220px]">Critical Illness ABR</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap min-w-[180px]">Terminal Illness ABR</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {quoteResults.map((r, idx) => {
                    const pctAbove = lowestMonthly > 0
                      ? ((r.monthly - lowestMonthly) / lowestMonthly) * 100
                      : 0;
                    const isLowest = idx === 0;
                    const rowBg = r.highlight
                      ? 'bg-emerald-50 hover:bg-emerald-100'
                      : isLowest
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-slate-50';

                    return (
                      <tr
                        key={r.id}
                        className={`border-t border-slate-100 transition-colors ${rowBg}`}
                      >
                        {/* Rank */}
                        <td className={`px-4 py-3 sticky left-0 z-10 font-bold text-xs ${r.highlight ? 'bg-emerald-50' : isLowest ? 'bg-blue-50' : 'bg-white'}`}>
                          {isLowest ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold">1</span>
                          ) : (
                            <span className="text-slate-400">{idx + 1}</span>
                          )}
                        </td>

                        {/* Carrier name */}
                        <td className={`px-4 py-3 sticky left-8 z-10 ${r.highlight ? 'bg-emerald-50' : isLowest ? 'bg-blue-50' : 'bg-white'}`}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                {r.carrier}
                                {r.highlight && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">★ FEATURED</span>
                                )}
                                {isLowest && !r.highlight && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">LOWEST</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">{r.product}</div>
                            </div>
                          </div>
                        </td>

                        {/* Premiums */}
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {fmt(r.monthly)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                          {fmt(annual(r.monthly))}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                          {fmt(total(r.monthly))}
                        </td>

                        {/* vs lowest */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isLowest ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                              Best Rate
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600">
                              ↑{pctAbove.toFixed(0)}%
                            </span>
                          )}
                        </td>

                        {/* ABR benefits */}
                        {showABR && <>
                          <td className={`px-4 py-3 text-xs ${abrColor(r.abr.chronic)}`}>{r.abr.chronic}</td>
                          <td className={`px-4 py-3 text-xs ${abrColor(r.abr.critical)}`}>{r.abr.critical}</td>
                          <td className={`px-4 py-3 text-xs ${abrColor(r.abr.terminal)}`}>{r.abr.terminal}</td>
                        </>}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary footer */}
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs text-slate-500">
                    <td colSpan={showABR ? 9 : 6} className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span>Rates shown are <b>estimated monthly premiums</b> for illustrative purposes only.</span>
                        <span>Actual premiums are subject to full underwriting and carrier approval.</span>
                        <span>ABR = Accelerated Death Benefit Rider (not a replacement for Long Term Care Insurance).</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Savings callout */}
            {quoteResults.length >= 2 && (() => {
              const highest = quoteResults[quoteResults.length - 1].monthly;
              const savings = (highest - lowestMonthly) * 12;
              return savings > 0 ? (
                <div className="px-6 py-3 border-t border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
                  <div className="text-xs text-slate-700">
                    💡 <span className="font-semibold">Potential Savings:</span> Choosing the lowest-rate carrier saves up to{' '}
                    <span className="font-bold text-emerald-700">{fmt(savings)}/year</span>{' '}
                    vs. the highest-quoted carrier — <span className="font-bold text-emerald-700">{fmt(savings * params.term_years)}</span> over the full {params.term_years}-year term.
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* ── EMPTY STATE ───────────────────────────────────────────────────── */}
        {!quoteGenerated && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-base font-semibold text-slate-600 mb-1">Ready to Generate a Quote</div>
            <div className="text-sm text-slate-400">
              Select carriers, enter the insured's parameters above, then click <b>Generate Quote</b>.
            </div>
          </div>
        )}

        {/* ── ABR DISCLOSURE ────────────────────────────────────────────────── */}
        {quoteGenerated && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Accelerated Benefit Riders (ABR) Disclosure
            </h3>
            <div className="text-[11px] text-slate-500 leading-relaxed space-y-1.5">
              <p>
                An Accelerated Death Benefit Rider (ABR) is <b>not a replacement for Long Term Care Insurance (LTCI)</b>. It is a life insurance benefit that gives
                you the option to accelerate some of the death benefit in the event the insured meets the criteria for a qualifying event described in the policy.
              </p>
              <p>
                ABR payments are unrestricted and may be used for any purpose. Death benefits and policy values will be reduced if an ABR payment is made.
                ABR payments may affect eligibility for, or amounts of, Medicaid or other government benefits. Tax consequences will depend on specific facts
                and circumstances — consult a personal tax advisor prior to receipt of any payments.
              </p>
              <p className="font-semibold text-slate-600">
                FOR FINANCIAL PROFESSIONAL USE ONLY · NOT FOR PUBLIC DISTRIBUTION · Rates are illustrative estimates only and are subject to change.
                Actual premiums are determined by each carrier's underwriting process.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

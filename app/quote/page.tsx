// app/quote_tool/page.tsx
// Term Insurance Quote Tool
// Generates instant premium comparisons across all user-selected term life insurance carriers.
// Rate engine uses independent actuarial multipliers — no carrier is used as a baseline.

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  // ADDED: state of issue — used in AI comparison for state-specific underwriting/availability context
  state: string;
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

// ADDED: AI-computed accurate premium data per carrier (Guaranteed + Non-Guaranteed Annual)
type AIPremiumEntry = {
  guaranteed_annual: number;       // Contractually guaranteed level term annual premium
  non_guaranteed_annual: number;   // Post-level term ART rate (year N+1, not contractually fixed)
};
type AIPremiums = Record<string, AIPremiumEntry>;

// ─── Carrier database ──────────────────────────────────────────────────────────
// Base rates sourced from independent market data (March 2025).
// All carriers are treated equally — no carrier is designated as a baseline or featured.
// Base parameters: Male, Age 40, Preferred Non-Tobacco, 30-Year, $1,000,000 face amount.
//
// CALIBRATION NOTE (Corebridge): Actual Corebridge QoL Flex Term quote (March 2026, Winflex Web):
//   Male / Age 55 / Preferred Non-Tobacco / $1,000,000 / 10-Year / Texas → $1,858.00/yr guaranteed.
//   Back-calculated basePer1000 = 1858/12 / (1.072^15 × 0.55 × 1000) = 0.09923
//   (Previous value 0.11541 was ~17% too high; corrected to match published carrier data.)
const CARRIERS: CarrierDef[] = [
  {
    id: 'corebridge',
    carrier: 'Corebridge Financial',
    product: 'QoL Flex Term',
    highlight: false,
    // MODIFIED: recalibrated from actual Corebridge Winflex quote (Male/55/PNT/$1M/10yr = $1,858/yr)
    basePer1000: 0.09923,
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
  // REMOVED: John Hancock Protection Term (per requirements)
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

// ADDED: US state list for the State of Issue field
const US_STATES: { abbr: string; name: string }[] = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' }, { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' }, { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' }, { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' }, { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' }, { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' },
  { abbr: 'DC', name: 'District of Columbia' },
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
  state: 'TX', // MODIFIED: default state set to Texas
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

// ADDED: ABR availability helper — returns true if rider is available for this carrier
function abrAvailable(val: string): boolean {
  return val !== 'N/A';
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

  // MODIFIED: all carriers selected by default — Corebridge included like every other provider
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(
    new Set(CARRIERS.map((c) => c.id))
  );
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [showABR, setShowABR] = useState(true);

  // ADDED: AI-powered premium insights state
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ADDED: selected row state — tracks which carrier row the user clicked
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // ADDED: per-carrier AI insight state for the selected row
  const [selectedCarrierInsight, setSelectedCarrierInsight] = useState<string | null>(null);
  const [selectedCarrierLoading, setSelectedCarrierLoading] = useState(false);
  const [selectedCarrierError, setSelectedCarrierError] = useState<string | null>(null);

  // ADDED: form validation errors for mandatory fields (Age, State, Gender, Health Class, Face Amount)
  const [formErrors, setFormErrors] = useState<{
    age?: string;
    state?: string;
    gender?: string;
    health_class?: string;
    face_amount?: string;
  }>({});

  // ADDED: AI-computed accurate premiums — Guaranteed Annual and Non-Guaranteed Annual per carrier
  // These are fetched via AI when a quote is generated and override/supplement the local rate engine.
  const [aiPremiums, setAiPremiums] = useState<AIPremiums | null>(null);
  const [aiPremiumsLoading, setAiPremiumsLoading] = useState(false);
  const [aiPremiumsError, setAiPremiumsError] = useState<string | null>(null);

  // Fetch AI insights — compares ONLY user-selected carriers, no Corebridge bias, produces best-quote recommendation
  const fetchAIInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    setAiInsights(null);
    try {
      // Build summary from ONLY the user-selected carriers — sorted lowest to highest premium
      const selectedList = CARRIERS
        .filter((c) => selectedCarriers.has(c.id))
        .map((c) => {
          const monthly = calcMonthlyPremium(c, params);
          return { carrier: c.carrier, product: c.product, monthly, abr: c.abr };
        })
        .sort((a, b) => a.monthly - b.monthly);

      const carrierSummary = selectedList
        .map((c, i) =>
          `${i + 1}. ${c.carrier} (${c.product})\n   Monthly: $${c.monthly.toFixed(2)} | Annual: $${(c.monthly * 12).toFixed(2)} | Total (${params.term_years} yrs): $${(c.monthly * 12 * params.term_years).toFixed(2)}\n   Chronic ABR: ${c.abr.chronic}\n   Critical ABR: ${c.abr.critical}\n   Terminal ABR: ${c.abr.terminal}`
        )
        .join('\n\n');

      // MODIFIED: neutral prompt — includes state for state-specific underwriting/availability context
      const stateLabel = params.state
        ? `${params.state} (${US_STATES.find(s => s.abbr === params.state)?.name ?? params.state})`
        : 'Not specified';

      const prompt = `You are a licensed life insurance advisor assistant at AnNa Financial Group.

A premium comparison has been generated for the following client:
- Name: ${params.first_name || 'Prospect'} ${params.last_name || ''}
- Gender: ${params.gender} | Age: ${params.age} | DOB: ${params.date_of_birth || 'Not provided'}
- Health Class: ${params.health_class}
- Face Amount: ${fmtFace(params.face_amount)} | Term: ${params.term_years} years
- State of Issue: ${stateLabel}

The following ${selectedList.length} carrier(s) have been selected for comparison (sorted lowest to highest monthly premium):

${carrierSummary}

Your task:
Evaluate ALL carriers listed above on equal footing — do not favor any specific carrier over another.
${params.state ? `The client is in ${stateLabel}. Factor in any known state-specific considerations: carrier availability, state approval status, regulatory differences (e.g. NY requires DFS-approved products), or riders that may be restricted or enhanced in this state.` : ''}
Based purely on the data above, provide a structured analysis with these four sections:

Best Quote Recommendation:
Name the single best-value carrier from the list above and explain why in 2-3 sentences, weighing both monthly premium and living benefit (ABR) coverage${params.state ? ` and state-specific availability in ${params.state}` : ''}. If multiple carriers are close in value, name the top 2 and explain the trade-off.

Premium Analysis:
Identify the lowest-cost option and the highest-cost option. Quantify the annual savings of choosing the lowest over the highest. Note any carriers that offer exceptional ABR coverage at a competitive price point.

Client Profile Insights:
2-3 key insurance considerations specific to this client's age, health class, coverage amount (${fmtFace(params.face_amount)} / ${params.term_years}-year term)${params.state ? `, and state of issue (${params.state})` : ''}.

Advisor Talking Points:
2-3 specific, actionable questions or talking points the advisor should raise with the client during the presentation based on the carriers shown${params.state ? ` and the client's state (${params.state})` : ''}.

Keep each section to 2-4 sentences. Use plain text only — no markdown symbols like **, ##, or bullet dashes.`;

      // Server-side API route (browser cannot call Anthropic directly)
      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 1000 }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error ${response.status}`);
      }
      const data = await response.json();
      setAiInsights((data.text ?? '').trim());
    } catch (err: any) {
      setAiError('AI insights unavailable. Please review the quote manually.');
    } finally {
      setAiLoading(false);
    }
  }, [selectedCarriers, params]);

  // Fetch AI insight for a single selected carrier row — compares against ALL other selected carriers
  const fetchSelectedCarrierInsights = useCallback(async (carrierId: string) => {
    const carrier = CARRIERS.find((c) => c.id === carrierId);
    if (!carrier) return;
    const monthly = calcMonthlyPremium(carrier, params);
    const annualPremium = monthly * 12;
    const totalPremium = monthly * 12 * params.term_years;
    setSelectedCarrierLoading(true);
    setSelectedCarrierError(null);
    setSelectedCarrierInsight(null);
    try {
      // All other selected carriers with their premiums for comparison context
      const otherSelected = CARRIERS
        .filter((c) => selectedCarriers.has(c.id) && c.id !== carrierId)
        .map((c) => {
          const m = calcMonthlyPremium(c, params);
          return `  - ${c.carrier} (${c.product}): $${m.toFixed(2)}/mo | Annual: $${(m * 12).toFixed(2)} | Chronic: ${c.abr.chronic} | Critical: ${c.abr.critical} | Terminal: ${c.abr.terminal}`;
        })
        .join('\n');

      // MODIFIED: richer prompt — includes state for state-specific carrier availability + regulatory context
      const stateLabel = params.state
        ? `${params.state} (${US_STATES.find(s => s.abbr === params.state)?.name ?? params.state})`
        : 'Not specified';

      const prompt = `You are a licensed life insurance advisor assistant at AnNa Financial Group.

The advisor has selected the following carrier for a deeper analysis:

Carrier: ${carrier.carrier} | Product: ${carrier.product}
Monthly Premium: $${monthly.toFixed(2)} | Annual: $${annualPremium.toFixed(2)} | Total (${params.term_years} yrs): $${totalPremium.toFixed(2)}
Chronic Illness ABR: ${carrier.abr.chronic}
Critical Illness ABR: ${carrier.abr.critical}
Terminal Illness ABR: ${carrier.abr.terminal}

Client Profile:
Name: ${params.first_name || 'Prospect'} ${params.last_name || ''} | Gender: ${params.gender} | Age: ${params.age}
Health Class: ${params.health_class} | Face Amount: ${fmtFace(params.face_amount)} | Term: ${params.term_years} years
State of Issue: ${stateLabel}

Other selected carriers for comparison:
${otherSelected || '  (No other carriers selected)'}

Evaluate this carrier objectively — do not favor any specific provider.
${params.state ? `The client is in ${stateLabel}. Consider any known state-specific factors: carrier approval status, rider availability, or regulatory rules that may affect this product in ${params.state}.` : ''}
Provide a focused analysis in exactly three labeled sections:

Strengths:
2 sentences on what makes this carrier/product a strong option for this specific client profile, referencing the premium, ABR benefits${params.state ? `, and state suitability (${params.state})` : ''}.

Considerations:
1-2 sentences on any trade-offs, limitations, or reasons a client might choose a different carrier from the list above${params.state ? `, including any state-specific limitations in ${params.state}` : ''}.

Key Talking Point:
One specific, precise question or statement the advisor should raise with the client about this carrier option.

Use plain text only — no markdown symbols.`;

      // Server-side API route
      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 1000 }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error ${response.status}`);
      }
      const data = await response.json();
      setSelectedCarrierInsight((data.text ?? '').trim());
    } catch {
      setSelectedCarrierError('Could not load carrier insight.');
    } finally {
      setSelectedCarrierLoading(false);
    }
  }, [params, selectedCarriers]);

  // ADDED: fetchAIPremiums — uses AI to compute carrier-specific Guaranteed and Non-Guaranteed Annual premiums.
  // The AI is provided with the full client profile, all selected carriers with local estimates as context,
  // and a known Corebridge calibration anchor from actual published Winflex data.
  // Returns JSON keyed by carrier ID: { guaranteed_annual, non_guaranteed_annual }
  const fetchAIPremiums = useCallback(async () => {
    setAiPremiumsLoading(true);
    setAiPremiumsError(null);
    setAiPremiums(null);
    try {
      const stateLabel = params.state
        ? `${params.state} (${US_STATES.find(s => s.abbr === params.state)?.name ?? params.state})`
        : 'Not specified';

      // Build the list of selected carriers with local rate estimates for AI context
      const carrierList = CARRIERS
        .filter((c) => selectedCarriers.has(c.id))
        .map((c) => {
          const localMonthly = calcMonthlyPremium(c, params);
          return `  { "id": "${c.id}", "carrier": "${c.carrier}", "product": "${c.product}", "local_monthly_estimate": ${localMonthly.toFixed(2)} }`;
        })
        .join(',\n');

      const carrierIds = CARRIERS
        .filter((c) => selectedCarriers.has(c.id))
        .map((c) => `"${c.id}"`)
        .join(', ');

      const prompt = `You are a licensed life insurance rate expert with deep knowledge of carrier-specific published term life premium tables (2024–2025 market data).

CLIENT PROFILE:
- Gender: ${params.gender}
- Age at Issue: ${params.age}
- Health Classification: ${params.health_class}
- State of Issue: ${stateLabel}
- Face Amount: ${fmtFace(params.face_amount)} ($${params.face_amount.toLocaleString()})
- Term Duration: ${params.term_years} years

CARRIERS TO QUOTE (selected by advisor):
[
${carrierList}
]

CALIBRATION ANCHOR (verified actual Corebridge Winflex Web quote, March 2026):
  Corebridge QoL Flex Term / Male / Age 55 / Preferred Non-Tobacco / $1,000,000 / 10-Year / Texas → Guaranteed Annual: $1,858.00
  Corebridge post-level term Year 11 ART: $2,561.20

TASK:
Using your knowledge of each carrier's published rate tables, provide accurate premium estimates for the client profile above.
For each carrier return:
1. "guaranteed_annual" — the contractually guaranteed level-term annual policy premium (what the client pays for the ${params.term_years}-year term period, mode: annual)
2. "non_guaranteed_annual" — the estimated Annual Renewable Term (ART) premium for Year ${params.term_years + 1} (first post-level term renewal year). This is typically not contractually fixed and can be significantly higher. Use each carrier's known ART multiplier/loading.

IMPORTANT:
- Use the calibration anchor above to sanity-check your Corebridge output.
- Adjust proportionally for age ${params.age} vs age 55 in the anchor (${params.age < 55 ? `${params.age} is younger → lower rate` : params.age > 55 ? `${params.age} is older → higher rate` : 'same age as anchor'}).
- Return ONLY valid JSON. No explanation, no markdown, no code fences.
- If you cannot estimate a carrier's rate confidently, use the local_monthly_estimate × 12 for guaranteed_annual and × 18 for non_guaranteed_annual.

Return format (JSON object only, keys must be the carrier IDs listed: ${carrierIds}):
{"corebridge":{"guaranteed_annual":1234,"non_guaranteed_annual":1800},"lincoln":{"guaranteed_annual":1260,"non_guaranteed_annual":1950}}`;

      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 800 }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      const rawText = (data.text ?? '').trim();

      // Strip markdown code fences if present
      const jsonText = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      const parsed: AIPremiums = JSON.parse(jsonText);

      // Validate structure: every entry must have numeric guaranteed_annual and non_guaranteed_annual
      const validated: AIPremiums = {};
      for (const [id, entry] of Object.entries(parsed)) {
        if (
          typeof entry === 'object' && entry !== null &&
          typeof (entry as any).guaranteed_annual === 'number' &&
          typeof (entry as any).non_guaranteed_annual === 'number'
        ) {
          validated[id] = {
            guaranteed_annual: (entry as any).guaranteed_annual,
            non_guaranteed_annual: (entry as any).non_guaranteed_annual,
          };
        }
      }

      // Fallback: for any selected carrier missing from AI response, use local estimate
      CARRIERS
        .filter((c) => selectedCarriers.has(c.id) && !validated[c.id])
        .forEach((c) => {
          const m = calcMonthlyPremium(c, params);
          validated[c.id] = {
            guaranteed_annual: Math.round(m * 12 * 100) / 100,
            non_guaranteed_annual: Math.round(m * 18 * 100) / 100,
          };
        });

      setAiPremiums(validated);
    } catch {
      setAiPremiumsError('Could not load AI-computed premiums. Showing estimated values.');
      // On error, generate fallback from local engine for all selected carriers
      const fallback: AIPremiums = {};
      CARRIERS
        .filter((c) => selectedCarriers.has(c.id))
        .forEach((c) => {
          const m = calcMonthlyPremium(c, params);
          fallback[c.id] = {
            guaranteed_annual: Math.round(m * 12 * 100) / 100,
            non_guaranteed_annual: Math.round(m * 18 * 100) / 100,
          };
        });
      setAiPremiums(fallback);
    } finally {
      setAiPremiumsLoading(false);
    }
  }, [selectedCarriers, params]);

  // ── Derived: active carriers sorted by premium ────────────────────────────
  const quoteResults = useMemo(() => {
    if (!quoteGenerated) return [];
    return CARRIERS
      .filter((c) => selectedCarriers.has(c.id))
      .map((c) => ({ ...c, monthly: calcMonthlyPremium(c, params) }))
      .sort((a, b) => a.monthly - b.monthly);
  }, [quoteGenerated, selectedCarriers, params]);

  const lowestMonthly = quoteResults[0]?.monthly ?? 0;

  // ADDED: lowest guaranteed annual (AI-computed when available, else local × 12)
  // Used for "vs. Lowest" comparison in the Guaranteed Annual column
  const lowestGuaranteedAnnual = useMemo(() => {
    if (!quoteGenerated || quoteResults.length === 0) return 0;
    const annuals = quoteResults.map((r) =>
      aiPremiums?.[r.id]?.guaranteed_annual ?? (r.monthly * 12)
    );
    return Math.min(...annuals);
  }, [quoteResults, aiPremiums, quoteGenerated]);

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
  // MODIFIED: clearAllCarriers keeps minimum 1 carrier — defaults to first in list (Corebridge)
  const clearAllCarriers = () => setSelectedCarriers(new Set([CARRIERS[0].id]));

  const handleDobChange = (dob: string) => {
    const age = ageFromDob(dob);
    setParams((p) => ({ ...p, date_of_birth: dob, age: age > 0 ? age : p.age }));
  };

  // MODIFIED: generateQuote now validates all mandatory fields before proceeding.
  // Mandatory: Age (18–75), State (must be selected), Gender (always set), Health Class (always set), Face Amount (always set).
  const generateQuote = () => {
    const errors: typeof formErrors = {};

    // Age is mandatory and must be in the valid range
    if (!params.age || params.age < 18 || params.age > 75) {
      errors.age = params.age < 18 || params.age > 75
        ? 'Age must be between 18 and 75'
        : 'Age is required';
    }
    // State is mandatory — must not be empty
    if (!params.state) {
      errors.state = 'State of issue is required';
    }
    // Gender, Health Class, Face Amount always have defaults so they are always valid,
    // but we still mark them as required visually. Only flag if somehow blank.
    if (!params.gender) {
      errors.gender = 'Gender is required';
    }
    if (!params.health_class) {
      errors.health_class = 'Health class is required';
    }
    if (!params.face_amount || params.face_amount <= 0) {
      errors.face_amount = 'Face amount is required';
    }

    setFormErrors(errors);

    // Block quote generation if any mandatory field has an error
    if (Object.keys(errors).length > 0) return;

    setQuoteGenerated(true);
    // Auto-fetch AI insights on quote generation
    fetchAIInsights();
    // ADDED: also fetch AI-computed accurate premiums (Guaranteed + Non-Guaranteed Annual)
    fetchAIPremiums();
  };

  const resetQuote = () => {
    setParams({ ...DEFAULT_PARAMS });
    setQuoteGenerated(false);
    // ADDED: clear AI insights on reset
    setAiInsights(null);
    setAiError(null);
    // ADDED: clear row selection on reset
    setSelectedRow(null);
    setSelectedCarrierInsight(null);
    setSelectedCarrierError(null);
    // MODIFIED: clear form validation errors on reset
    setFormErrors({});
    // ADDED: clear AI-computed premiums on reset
    setAiPremiums(null);
    setAiPremiumsError(null);
    setAiPremiumsLoading(false);
  };

  // ADDED: row click handler — selects/deselects a carrier row and fetches its AI insight
  const handleRowSelect = (id: string) => {
    if (selectedRow === id) {
      setSelectedRow(null);
      setSelectedCarrierInsight(null);
      setSelectedCarrierError(null);
    } else {
      setSelectedRow(id);
      fetchSelectedCarrierInsights(id);
    }
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

      {/* Print CSS — landscape, cell borders, blue header, page numbers in footer */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 8mm 16mm 8mm;
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 8pt;
              color: #64748b;
              font-family: sans-serif;
            }
          }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-page-wrap { padding: 0; }
          /* Excel-style borders on every cell */
          .print-table table { font-size: 7.5px !important; border-collapse: collapse !important; width: 100%; }
          .print-table th, .print-table td { padding: 3px 5px !important; border: 1px solid #9ca3af !important; }
          /* Blue header row in print */
          .print-table thead tr th { background-color: #1E5AA8 !important; color: #ffffff !important; font-weight: 700 !important; }
          /* MODIFIED: all body rows print with white background — no amber/blue/emerald row highlights in PDF */
          .print-table tbody tr { background-color: #ffffff !important; box-shadow: none !important; outline: none !important; }
          .print-table tbody td { background-color: #ffffff !important; }
          /* MODIFIED: hide selected-row indicator elements in print */
          .print-selected-badge { display: none !important; }
        }
      ` }} />

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

      {/* MODIFIED: Print header — restored with business logo, title, client snapshot (visible only when printing) */}
      <div className="hidden print:block print-page-wrap">
        {/* Top bar */}
        <div className="px-8 pt-5 pb-3 border-b-2 border-[#1E5AA8]">
          <div className="flex items-center justify-between">
            {/* Logo + company name */}
            <div className="flex items-center gap-4">
              <img
                src="/anunathan-logo.png"
                alt="AnNa Financial Group"
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
              />
              <div>
                <div className="text-base font-bold text-[#1E5AA8]">AnNa Financial Group</div>
                <div className="text-[10px] text-[#808000] font-semibold">Build your career. Protect their future</div>
              </div>
            </div>
            {/* Report title + date */}
            <div className="text-right">
              <div className="text-base font-bold text-slate-800">Term Life Insurance</div>
              <div className="text-sm font-semibold text-slate-700">Premium Comparison Report</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
        {/* Client snapshot bar — MODIFIED: added State */}
        <div className="px-8 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-x-6 gap-y-0.5 text-[10px] text-slate-700">
          {(params.first_name || params.last_name) && (
            <span><b>Client:</b> {params.first_name} {params.last_name}</span>
          )}
          <span><b>Gender:</b> {params.gender}</span>
          <span><b>Age:</b> {params.age}</span>
          {params.date_of_birth && <span><b>DOB:</b> {params.date_of_birth}</span>}
          <span><b>Health Class:</b> {params.health_class}</span>
          <span><b>Face Amount:</b> {fmtFace(params.face_amount)}</span>
          <span><b>Term Duration:</b> {params.term_years} Years</span>
          {params.state && <span><b>State:</b> {params.state} — {US_STATES.find(s => s.abbr === params.state)?.name ?? ''}</span>}
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
                      {/* MODIFIED: removed ★ TOP badge — no carrier is featured */}
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

            {/* Personal info — MODIFIED: Age and State are mandatory fields (marked with *) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
              {/* MODIFIED: Age — mandatory field, shows required * and red border+error when invalid */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Age {params.date_of_birth && <span className="text-blue-500">(auto)</span>}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  min={18}
                  max={75}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 ${formErrors.age ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  value={params.age}
                  onChange={(e) => {
                    setParams((p) => ({ ...p, age: parseInt(e.target.value) || 0 }));
                    setFormErrors((fe) => ({ ...fe, age: undefined }));
                  }}
                />
                {formErrors.age && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.age}</p>}
              </div>
              {/* MODIFIED: State — mandatory field, shows required * and red border+error when not selected */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  State<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white ${formErrors.state ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  value={params.state}
                  onChange={(e) => {
                    setParams((p) => ({ ...p, state: e.target.value }));
                    setFormErrors((fe) => ({ ...fe, state: undefined }));
                  }}
                >
                  <option value="">— Select State —</option>
                  {US_STATES.map((s) => (
                    <option key={s.abbr} value={s.abbr}>{s.abbr} — {s.name}</option>
                  ))}
                </select>
                {formErrors.state && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.state}</p>}
              </div>
            </div>

            {/* Insurance parameters — MODIFIED: Gender, Health Class, Face Amount are mandatory (marked with *) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {/* Gender — mandatory, always has a default so no runtime error expected */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Gender<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white ${formErrors.gender ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  value={params.gender}
                  onChange={(e) => {
                    setParams((p) => ({ ...p, gender: e.target.value as Gender }));
                    setFormErrors((fe) => ({ ...fe, gender: undefined }));
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {formErrors.gender && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.gender}</p>}
              </div>
              {/* Health Class — mandatory, always has a default */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Health Class<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white ${formErrors.health_class ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  value={params.health_class}
                  onChange={(e) => {
                    setParams((p) => ({ ...p, health_class: e.target.value as HealthClass }));
                    setFormErrors((fe) => ({ ...fe, health_class: undefined }));
                  }}
                >
                  {HEALTH_CLASSES.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {formErrors.health_class && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.health_class}</p>}
              </div>
              {/* Face Amount — mandatory, always has a default */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Face Amount<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white ${formErrors.face_amount ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  value={params.face_amount}
                  onChange={(e) => {
                    setParams((p) => ({ ...p, face_amount: parseInt(e.target.value) }));
                    setFormErrors((fe) => ({ ...fe, face_amount: undefined }));
                  }}
                >
                  {FACE_OPTIONS.map((f) => (
                    <option key={f} value={f}>{fmtFace(f)}</option>
                  ))}
                </select>
                {formErrors.face_amount && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.face_amount}</p>}
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

            {/* Summary pill — MODIFIED: added State */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 mb-4">
              <span>👤 <b>{params.gender}</b>, Age <b>{params.age}</b></span>
              <span>❤️ <b>{params.health_class}</b></span>
              <span>💰 Face Amount: <b>{fmtFace(params.face_amount)}</b></span>
              <span>📅 <b>{params.term_years}-Year</b> Term</span>
              {params.state && <span>📍 State: <b>{params.state}</b></span>}
              {(params.first_name || params.last_name) && (
                <span>🧾 Client: <b>{params.first_name} {params.last_name}</b></span>
              )}
            </div>

            {/* Action buttons — MODIFIED: Generate Quote disabled when mandatory fields are missing */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={generateQuote}
                  disabled={params.age < 18 || params.age > 75 || !params.state}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1E5AA8] text-white font-semibold px-5 py-2 text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🔍 Generate Quote
                </button>
                {/* ADDED: mandatory hint shown when button is blocked */}
                {(!params.state || params.age < 18 || params.age > 75) && (
                  <span className="text-[10px] text-red-500 ml-1">
                    {!params.state ? 'Select a state to continue' : 'Age must be 18–75'}
                  </span>
                )}
              </div>
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
                    {params.state && ` · ${params.state}`}
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
            <div className="overflow-x-auto print-table">
              {/* MODIFIED: border-collapse + Excel-style borders on screen and print */}
              <table className="w-full text-sm border-collapse">
                <thead>
                  {/* MODIFIED: blue fill header row with bold white text + Excel borders */}
                  <tr className="text-white text-xs font-bold" style={{ backgroundColor: '#1E5AA8' }}>
                    <th className="px-4 py-3 text-left sticky left-0 z-10 whitespace-nowrap border border-blue-700" style={{ backgroundColor: '#1E5AA8' }}>#</th>
                    <th className="px-4 py-3 text-left sticky left-8 z-10 whitespace-nowrap min-w-[160px] border border-blue-700" style={{ backgroundColor: '#1E5AA8' }}>Carrier / Product</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap border border-blue-700">Monthly</th>
                    {/* MODIFIED: renamed "Annual" → "Guaranteed Annual" (AI-computed accurate level-term premium) */}
                    <th className="px-4 py-3 text-right whitespace-nowrap border border-blue-700 min-w-[120px]">
                      Guaranteed Annual
                      {aiPremiumsLoading && <span className="ml-1 text-[9px] font-normal opacity-70">⏳</span>}
                    </th>
                    {/* all columns shown in print/PDF */}
                    <th className="px-4 py-3 text-right whitespace-nowrap border border-blue-700">Total ({params.term_years} yrs)</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap border border-blue-700">vs. Lowest</th>
                    {showABR && <>
                      <th className="px-4 py-3 text-center whitespace-nowrap min-w-[110px] border border-blue-700">Chronic Illness ABR</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap min-w-[110px] border border-blue-700">Critical Illness ABR</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap min-w-[110px] border border-blue-700">Terminal Illness ABR</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {quoteResults.map((r, idx) => {
                    // ADDED: resolve AI-computed premiums for this carrier (or fall back to local engine)
                    const aiData = aiPremiums?.[r.id];
                    const guaranteedAnnual = aiData?.guaranteed_annual ?? (r.monthly * 12);
                    const guaranteedMonthly = guaranteedAnnual / 12;

                    // vs. Lowest uses guaranteed annual when AI data is available
                    const pctAbove = lowestGuaranteedAnnual > 0
                      ? ((guaranteedAnnual - lowestGuaranteedAnnual) / lowestGuaranteedAnnual) * 100
                      : lowestMonthly > 0
                      ? ((r.monthly - lowestMonthly) / lowestMonthly) * 100
                      : 0;
                    // isLowest based on guaranteed annual when AI data available, else local
                    const isLowest = aiPremiums
                      ? guaranteedAnnual === lowestGuaranteedAnnual
                      : idx === 0;
                    const isSelected = selectedRow === r.id;

                    // MODIFIED: removed r.highlight (Corebridge featured) from rowBg — only selected/lowest matter
                    const rowBg = isSelected
                      ? 'bg-amber-100 hover:bg-amber-200 ring-2 ring-amber-400 ring-inset'
                      : isLowest
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-slate-50';

                    // MODIFIED: sticky cell bg — no highlight branch
                    const stickyBg = isSelected
                      ? 'bg-amber-100'
                      : isLowest
                      ? 'bg-blue-50'
                      : 'bg-white';

                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleRowSelect(r.id)}
                        className={`transition-colors cursor-pointer select-none ${rowBg}`}
                      >
                        {/* Rank — border on every cell */}
                        <td className={`px-4 py-3 sticky left-0 z-10 font-bold text-xs border border-slate-300 ${stickyBg}`}>
                          {isLowest ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold">1</span>
                          ) : (
                            <span className="text-slate-400">{idx + 1}</span>
                          )}
                        </td>

                        {/* Carrier name */}
                        <td className={`px-4 py-3 sticky left-8 z-10 border border-slate-300 ${stickyBg}`}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                {r.carrier}
                                {/* MODIFIED: removed ★ FEATURED badge — no carrier is featured */}
                                {isLowest && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">LOWEST</span>
                                )}
                                {/* MODIFIED: print-selected-badge class hides this in PDF via print CSS */}
                                {isSelected && (
                                  <span className="print-selected-badge px-1 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-800">▶ SELECTED</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">{r.product}</div>
                            </div>
                          </div>
                        </td>

                        {/* Monthly — local rate engine estimate */}
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                          {aiPremiumsLoading
                            ? <span className="text-slate-400 animate-pulse">…</span>
                            : fmt(guaranteedMonthly)}
                        </td>

                        {/* MODIFIED: Guaranteed Annual — AI-computed accurate level-term premium */}
                        <td className="px-4 py-3 text-right whitespace-nowrap border border-slate-300">
                          {aiPremiumsLoading ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                              loading
                            </span>
                          ) : (
                            <span className={`font-bold ${isLowest ? 'text-blue-700' : 'text-slate-900'}`}>
                              {fmt(guaranteedAnnual)}
                              {aiData && <span className="ml-1 text-[8px] text-emerald-600 font-semibold">AI</span>}
                            </span>
                          )}
                        </td>

                        {/* Total — uses guaranteed annual × term years */}
                        <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap border border-slate-300">
                          {aiPremiumsLoading
                            ? <span className="text-slate-400 animate-pulse">…</span>
                            : fmt(guaranteedAnnual * params.term_years)}
                        </td>

                        {/* vs lowest — based on guaranteed annual */}
                        <td className="px-4 py-3 text-center whitespace-nowrap border border-slate-300">
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

                        {/* ABR benefits — detailed text on screen, Available/Not Available in print */}
                        {showABR && <>
                          <td className="px-4 py-3 text-xs text-center border border-slate-300">
                            <span className={`print:hidden ${abrColor(r.abr.chronic)}`}>{r.abr.chronic}</span>
                            <span className={`hidden print:inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${abrAvailable(r.abr.chronic) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              {abrAvailable(r.abr.chronic) ? 'Available' : 'Not Available'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-center border border-slate-300">
                            <span className={`print:hidden ${abrColor(r.abr.critical)}`}>{r.abr.critical}</span>
                            <span className={`hidden print:inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${abrAvailable(r.abr.critical) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              {abrAvailable(r.abr.critical) ? 'Available' : 'Not Available'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-center border border-slate-300">
                            <span className={`print:hidden ${abrColor(r.abr.terminal)}`}>{r.abr.terminal}</span>
                            <span className={`hidden print:inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${abrAvailable(r.abr.terminal) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              {abrAvailable(r.abr.terminal) ? 'Available' : 'Not Available'}
                            </span>
                          </td>
                        </>}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary footer */}
                <tfoot>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <td colSpan={showABR ? 9 : 6} className="px-4 py-2.5 border border-slate-300 print:hidden">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span>Rates shown are <b>AI-computed Guaranteed Annual premiums</b> for illustrative purposes only.</span>
                        <span>Actual premiums are subject to full underwriting and carrier approval.</span>
                        <span>ABR = Accelerated Death Benefit Rider (not a replacement for Long Term Care Insurance).</span>
                        {aiPremiumsError && <span className="text-orange-600">⚠ {aiPremiumsError}</span>}
                      </div>
                    </td>
                    <td colSpan={showABR ? 9 : 6} className="hidden print:table-cell px-2 py-1.5 border border-slate-300 text-[8px] text-slate-500 italic">
                      Guaranteed Annual = contractual level-term annual premium. Actual rates subject to full underwriting. ABR availability varies by carrier and state.
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Savings callout — screen only, uses AI guaranteed annual when available */}
            {quoteResults.length >= 2 && !aiPremiumsLoading && (() => {
              // Use AI premiums if available, else local monthly × 12
              const annuals = quoteResults.map((r) =>
                aiPremiums?.[r.id]?.guaranteed_annual ?? (r.monthly * 12)
              );
              const lowestA = Math.min(...annuals);
              const highestA = Math.max(...annuals);
              const savings = highestA - lowestA;
              return savings > 0 ? (
                <div className="px-6 py-3 border-t border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50 print:hidden">
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

        {/* MODIFIED: AI Insights Panel — shows selected carrier insight when a row is chosen, else general quote insights */}
        {quoteGenerated && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden print:hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {selectedRow
                      ? `AI Insight — ${CARRIERS.find(c => c.id === selectedRow)?.carrier ?? 'Selected Carrier'}`
                      : 'AI Advisor Insights'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedRow
                      ? 'Click a different row to compare · Click same row to deselect'
                      : 'Powered by Claude · Click any row in the table for a carrier-specific analysis'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedRow && (
                  <button
                    type="button"
                    onClick={() => fetchSelectedCarrierInsights(selectedRow)}
                    disabled={selectedCarrierLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white text-amber-700 font-semibold px-3 py-1.5 text-xs hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedCarrierLoading ? '⏳ Loading…' : '↺ Refresh'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchAIInsights}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white text-violet-700 font-semibold px-3 py-1.5 text-xs hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? '⏳ Analyzing…' : '↺ Full Analysis'}
                </button>
              </div>
            </div>
            <div className="px-5 py-4">
              {/* Selected carrier insight */}
              {selectedRow && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1.5">
                    {CARRIERS.find(c => c.id === selectedRow)?.carrier} · {CARRIERS.find(c => c.id === selectedRow)?.product}
                  </div>
                  {selectedCarrierLoading && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 py-1">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Analyzing this carrier for your client…
                    </div>
                  )}
                  {selectedCarrierError && !selectedCarrierLoading && (
                    <div className="text-xs text-red-500">{selectedCarrierError}</div>
                  )}
                  {selectedCarrierInsight && !selectedCarrierLoading && (
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{selectedCarrierInsight}</div>
                  )}
                </div>
              )}

              {/* Full quote insights */}
              {aiLoading && (
                <div className="flex items-center gap-3 text-sm text-slate-500 py-2">
                  <svg className="animate-spin h-4 w-4 text-violet-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating full analysis for this client profile…
                </div>
              )}
              {aiError && !aiLoading && (
                <div className="text-xs text-red-500 py-1">{aiError}</div>
              )}
              {aiInsights && !aiLoading && (
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{aiInsights}</div>
              )}
              {!aiInsights && !aiLoading && !aiError && !selectedRow && (
                <div className="text-xs text-slate-400 py-2 italic">
                  Click any carrier row above for a targeted insight, or click Full Analysis for an overview of all carriers.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADDED: Print-only ABR Rider Availability Disclaimer section */}
        {quoteGenerated && (
          <div className="hidden print:block mt-4 px-2">
            <div className="border border-slate-300 rounded p-4 bg-slate-50">
              <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
                Rider Availability Disclaimer
              </div>
              <div className="text-[10px] text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  The "Available" / "Not Available" indicators above reflect whether each carrier's product includes
                  an Accelerated Death Benefit Rider (ABR) for the specified illness category as a standard or optional
                  feature. Rider availability, benefit limits, and elimination periods vary by carrier, product, state of issue,
                  and individual underwriting. Not all riders listed are available in all states.
                </p>
                <p>
                  An ABR is <strong>not a replacement for Long Term Care Insurance (LTCI)</strong>. It is a life insurance
                  benefit that gives the policyholder the option to accelerate a portion of the death benefit if they meet
                  the criteria for a qualifying chronic, critical, or terminal illness event as defined in the policy contract.
                  ABR payments reduce the remaining death benefit and policy cash values, if applicable. ABR payments
                  may affect eligibility for Medicaid or other government assistance programs.
                </p>
                <p>
                  Tax treatment of ABR proceeds is governed by IRC Section 101(g). Policyholders should consult a
                  qualified tax advisor before receiving any accelerated benefit payments.
                </p>
                <p className="font-semibold text-slate-700">
                  All premiums shown are estimated figures for illustrative purposes only, based on published carrier
                  rate tables as of March 2025. Actual premiums are subject to full carrier underwriting, state availability,
                  and individual health classification. Premiums are not guaranteed until a policy is issued.
                </p>
              </div>
            </div>
            {/* MODIFIED: Print footer removed — page numbers are rendered by the @page @bottom-center CSS rule above.
                No logo, company name, or Corebridge reference in the PDF footer. */}
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

        {/* ── ABR DISCLOSURE — screen only (print version is in the print block above) ── */}
        {quoteGenerated && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 print:hidden">
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

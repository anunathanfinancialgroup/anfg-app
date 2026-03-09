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
  // ADDED: Saved Age (Age Nearest Birthday) — when true, premium uses ANB instead of ALB
  use_saved_age: boolean;
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

/**
 * Compute Age Nearest Birthday (ANB) — the basis for "Saved Age" policies.
 * If the insured is within 6 months AFTER their last birthday → use ALB (age).
 * If the insured is within 6 months BEFORE their next birthday → use ALB + 1.
 * Requires DOB string (YYYY-MM-DD). Returns ALB unchanged if DOB is missing.
 *
 * Life insurance premium basis:
 *   ALB (Age Last Birthday) — standard, uses exact integer age entered.
 *   ANB (Age Nearest Birthday / Saved Age) — rounds to nearest birthday.
 *   ANB can be LOWER than ALB (e.g. age 54 yr 4 mo → ANB = 54 = ALB;
 *   age 54 yr 8 mo → ANB = 55 = ALB+1; but also age 55 yr 1 mo → ANB = 55 = ALB).
 *   Using ANB early in the year (< 6 months after birthday) saves 1 year of premium.
 */
function savedAgeFromDob(dob: string, alb: number): number {
  if (!dob) return alb; // no DOB → cannot compute ANB, return ALB unchanged
  const today = new Date();
  const birth = new Date(dob);
  // Days since last birthday
  const lastBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (lastBday > today) lastBday.setFullYear(today.getFullYear() - 1);
  const daysSinceLastBday = Math.floor((today.getTime() - lastBday.getTime()) / 86_400_000);
  // Days until next birthday
  const nextBday = new Date(lastBday.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const daysUntilNextBday = Math.floor((nextBday.getTime() - today.getTime()) / 86_400_000);
  // Round to nearest birthday: if closer to next → ANB = ALB + 1
  return daysUntilNextBday < daysSinceLastBday ? alb + 1 : alb;
}

/**
 * Saved Age from integer ALB only (no DOB available).
 * Without a DOB we cannot determine which side of the half-year boundary the client is on.
 * As a conservative estimate we assume the client is in the second half of their current year
 * (i.e. ANB = ALB + 1). Advisors should confirm with actual DOB when possible.
 */
function savedAgeFromAlb(alb: number): number {
  return alb + 1;
}

/** Resolve the effective rating age from params — ALB or ANB (Saved Age) */
function effectiveAge(p: QuoteParams): number {
  if (!p.use_saved_age) return p.age;
  return p.date_of_birth
    ? savedAgeFromDob(p.date_of_birth, p.age)
    : savedAgeFromAlb(p.age);
}

/**
 * Age multiplier relative to base age 40.
 * Accepts the EFFECTIVE age (ALB or ANB) — see effectiveAge().
 */
function ageMultiplier(age: number): number {
  // Exponential age loading calibrated to SOA VBT 2015 S&U table shape.
  const base = 40;
  const diff = age - base;
  if (diff === 0) return 1.0;
  if (diff > 0) return Math.pow(1.072, diff);  // ~7.2% per year older
  return Math.pow(0.940, Math.abs(diff));       // ~6.0% per year younger
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

/** Calculate monthly premium for a carrier given quote params.
 * Uses effectiveAge(p) which returns ALB or ANB (Saved Age) based on p.use_saved_age.
 */
function calcMonthlyPremium(carrier: CarrierDef, p: QuoteParams): number {
  const ratingAge = effectiveAge(p); // ALB or ANB depending on use_saved_age flag
  const perThousand = carrier.basePer1000
    * ageMultiplier(ratingAge)
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
  use_saved_age: false, // ADDED: Saved Age off by default — advisor toggles per client
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
/**
 * ADDED: ABR rider comparison engine — scores a carrier's living-benefit coverage (0-5).
 * Used by the carrier-ranking AI to factor rider quality alongside premium cost.
 *   Chronic Illness:  2 pts (most impactful for long-term care / chronic condition planning)
 *   Critical Illness: 2 pts (heart attack, cancer, stroke, major organ coverage)
 *   Terminal Illness: 1 pt  (baseline expectation — most carriers include this)
 * Full-face-amount ($1M) chronic/critical riders earn +1 bonus pt for breadth of coverage.
 */
function abrScore(abr: ABRBenefit): number {
  let score = 0;
  if (abrAvailable(abr.chronic))  { score += 2; if (abr.chronic.includes('$1,000,000'))  score += 1; }
  if (abrAvailable(abr.critical)) { score += 2; if (abr.critical.includes('$1,000,000')) score += 1; }
  if (abrAvailable(abr.terminal)) { score += 1; }
  return score;
}

// ══════════════════════════════════════════════════════════════════════════════
// LOCAL CARRIER INSIGHT GENERATOR
// Produces a meaningful 3-section analysis from carrier + quote data alone.
// Used as the primary source (no API needed) — AI enhances when available.
// ══════════════════════════════════════════════════════════════════════════════

interface LocalInsightOptions {
  carrier: CarrierDef;
  params: QuoteParams;
  displayMonthly: number;
  displayAnnual: number;
  peers: Array<{ carrier: CarrierDef; annual: number }>;
}

function generateLocalCarrierInsight(opts: LocalInsightOptions): string {
  const { carrier, params, displayMonthly, displayAnnual, peers } = opts;
  const abr = carrier.abr;
  const abrPts = abrScore(abr);
  const termYrs = params.term_years;
  const face = fmtFace(params.face_amount);
  const ratingAge = effectiveAge(params);
  const ageBasis = params.use_saved_age ? `Saved Age (ANB ${ratingAge})` : `Age ${ratingAge} (ALB)`;

  // — Premium context —
  const sortedPeers = [...peers].sort((a, b) => a.annual - b.annual);
  const lowestPeer = sortedPeers[0];
  const highestPeer = sortedPeers[sortedPeers.length - 1];
  const peerCount = peers.length;

  const isLowest = peerCount === 0 || displayAnnual <= lowestPeer.annual;
  const isHighest = peerCount > 0 && displayAnnual >= highestPeer.annual;

  let premiumRank = '';
  if (peerCount === 0) {
    premiumRank = 'This is the only carrier selected for comparison.';
  } else if (isLowest) {
    premiumRank = `This is the lowest-cost option among the ${peerCount + 1} carriers compared, at $${displayAnnual.toFixed(2)}/yr.`;
  } else if (isHighest) {
    const diff = displayAnnual - lowestPeer.annual;
    premiumRank = `At $${displayAnnual.toFixed(2)}/yr, this is the highest-priced option — $${diff.toFixed(2)}/yr more than the lowest-quoted carrier.`;
  } else {
    const lowestDiff = displayAnnual - lowestPeer.annual;
    const rank = sortedPeers.findIndex(p => p.annual > displayAnnual) + 1;
    premiumRank = `Ranked #${rank} of ${peerCount + 1} carriers at $${displayAnnual.toFixed(2)}/yr — $${lowestDiff.toFixed(2)}/yr above the lowest option.`;
  }

  // — ABR Strengths —
  const abrStrengths: string[] = [];
  if (abrAvailable(abr.chronic)) {
    const fullFace = abr.chronic.includes('$1,000,000');
    abrStrengths.push(
      fullFace
        ? `Full face amount ($1M) Chronic Illness rider — pays out up to $1,000,000 for qualifying chronic conditions.`
        : `Chronic Illness ABR: ${abr.chronic}.`
    );
  }
  if (abrAvailable(abr.critical)) {
    const fullFace = abr.critical.includes('$1,000,000');
    abrStrengths.push(
      fullFace
        ? `Full face amount ($1M) Critical Illness rider covers heart attack, cancer, and stroke.`
        : `Critical Illness ABR: ${abr.critical}.`
    );
  }
  if (abrAvailable(abr.terminal)) {
    abrStrengths.push(`Terminal Illness ABR: ${abr.terminal} — accelerated benefit paid on terminal diagnosis.`);
  }
  if (abrStrengths.length === 0) {
    abrStrengths.push('No Accelerated Benefit Riders (ABR) are available on this product.');
  }

  // — Key term context —
  const totalCost = (displayAnnual * termYrs).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  // — Profile-specific note —
  let profileNote = '';
  if (params.age >= 55) {
    profileNote = `At ${ageBasis}, locking in a ${termYrs}-year level premium now avoids significant rate increases in future years.`;
  } else if (params.age <= 35) {
    profileNote = `At ${ageBasis}, a ${termYrs}-year level term secures coverage through the highest-earning and family-dependency years at a cost-effective rate.`;
  } else {
    profileNote = `${ageBasis} with ${params.health_class} puts this client in a strong underwriting tier for a ${termYrs}-year level term.`;
  }

  // — Health class talking point —
  let healthNote = '';
  if (params.health_class === 'Preferred Plus Non-Tobacco') {
    healthNote = 'Preferred Plus Non-Tobacco is the highest health class — confirm medical history supports this rating before presenting to the client.';
  } else if (params.health_class === 'Tobacco') {
    healthNote = 'Tobacco-rated premiums are significantly higher. Ask the client if they plan to quit — a policy review after 2+ tobacco-free years may qualify for a better rate class.';
  } else if (params.health_class === 'Standard Non-Tobacco') {
    healthNote = 'Standard Non-Tobacco rating may indicate past health issues. Ask if the client has had any changes in health since the last exam — there may be room to improve the rate class.';
  } else {
    healthNote = `Preferred Non-Tobacco is a strong rating. Confirm the client's current health, prescriptions, and family history before application to protect this classification.`;
  }

  // ── Assemble the three sections ──────────────────────────────────────────────
  const strengthsLines: string[] = [
    `${carrier.carrier} (${carrier.product}) — ABR Score: ${abrPts}/5.`,
    premiumRank,
  ];
  if (!isLowest && peerCount > 0) {
    // Only highlight ABR as a differentiator if premium is not the lowest
    strengthsLines.push(`The ABR suite${abrPts >= 4 ? ' is among the strongest in the comparison' : ''}: ${abrStrengths[0]}`);
  } else {
    strengthsLines.push(abrStrengths[0]);
  }
  if (abrStrengths.length > 1) strengthsLines.push(abrStrengths[1]);

  const considerationsLines: string[] = [];
  if (isHighest && peerCount > 0) {
    const savings = (displayAnnual - lowestPeer.annual) * termYrs;
    considerationsLines.push(
      `Over the full ${termYrs}-year term, choosing this carrier costs $${savings.toLocaleString('en-US', { minimumFractionDigits: 2 })} more than the lowest-quoted option — the premium spread should be justified by ABR value or carrier stability preference.`
    );
  } else if (!isLowest && peerCount > 0) {
    const savings = (displayAnnual - lowestPeer.annual) * termYrs;
    considerationsLines.push(
      `Over ${termYrs} years, this option costs $${savings.toLocaleString('en-US', { minimumFractionDigits: 2 })} more than the lowest-quoted carrier — evaluate whether the additional ABR coverage justifies the difference.`
    );
  }
  if (abrPts === 0) {
    considerationsLines.push('No ABRs are included — clients needing living-benefit protection should compare options that offer chronic or critical illness riders.');
  }
  if (considerationsLines.length === 0) {
    considerationsLines.push(
      `Total ${termYrs}-year cost is ${totalCost}. ${profileNote}`
    );
  }

  const talkingPoint = healthNote;

  const sections: string[] = [
    'Strengths:',
    strengthsLines.join(' '),
    '',
    'Considerations:',
    considerationsLines.join(' '),
    '',
    'Key Talking Point:',
    talkingPoint,
  ];

  return sections.join('\n');
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
      // MODIFIED: fetchAIInsights — Corebridge quoted standalone (not ranked against peer group).
      // ABR scores (abrScore()) included so carrier-ranking AI factors rider quality alongside premium.
      // Uses AI-computed premiums when already available for accurate monthly figures in the summary.
      const stateLabel = params.state
        ? `${params.state} (${US_STATES.find(s => s.abbr === params.state)?.name ?? params.state})`
        : 'Not specified';

      // Separate Corebridge from peer carriers
      const peerCarrierDefs = CARRIERS.filter((c) => selectedCarriers.has(c.id) && c.id !== 'corebridge');
      const peerSelected = peerCarrierDefs
        .map((c) => {
          const aiAnnual = aiPremiums?.[c.id]?.guaranteed_annual;
          const monthly = aiAnnual ? aiAnnual / 12 : calcMonthlyPremium(c, params);
          return { ...c, monthly };
        })
        .sort((a, b) => a.monthly - b.monthly);

      const corebridgeDef = selectedCarriers.has('corebridge')
        ? CARRIERS.find((c) => c.id === 'corebridge') ?? null : null;
      const cbMonthly = corebridgeDef
        ? (aiPremiums?.corebridge?.guaranteed_annual
          ? aiPremiums.corebridge.guaranteed_annual / 12
          : calcMonthlyPremium(corebridgeDef, params))
        : 0;

      const selectedList = [...peerSelected, ...(corebridgeDef ? [{ ...corebridgeDef, monthly: cbMonthly }] : [])];

      // MODIFIED: peer-only carrier summary — Corebridge excluded from comparison.
      // Uses AI guaranteed_annual when already loaded, otherwise actuarial estimate.
      // Generates rank based on fetched premium value (lowest guaranteed_annual = rank 1).
      const peerSummaryLines = peerSelected.map((c, i) => {
        const pts = abrScore(c.abr);
        return [
          `${i + 1}. ${c.carrier} (${c.product})`,
          `   Monthly: $${c.monthly.toFixed(2)} | Annual: $${(c.monthly * 12).toFixed(2)} | Total (${params.term_years} yrs): $${(c.monthly * 12 * params.term_years).toFixed(2)}`,
          `   ABR Score: ${pts}/5 | Chronic: ${c.abr.chronic} | Critical: ${c.abr.critical} | Terminal: ${c.abr.terminal}`,
        ].join('\n');
      });
      const peerSummary = peerSummaryLines.join('\n\n');

      const prompt = `You are a licensed life insurance advisor assistant at AnNa Financial Group.

A premium comparison has been generated for the following client:
- Name: ${params.first_name || 'Prospect'} ${params.last_name || ''}
- Gender: ${params.gender} | Age: ${params.age} (ALB)${params.use_saved_age ? ` → Saved Age (ANB): ${effectiveAge(params)}` : ''} | DOB: ${params.date_of_birth || 'Not provided'}${params.use_saved_age ? ' | Basis: Saved Age (ANB — Age Nearest Birthday)' : ' | Basis: ALB (Age Last Birthday)'}
- Health Class: ${params.health_class}
- Face Amount: ${fmtFace(params.face_amount)} | Term: ${params.term_years} years
- State of Issue: ${stateLabel}

${peerSelected.length} carrier(s) selected for comparison (ranked lowest to highest by guaranteed annual premium):

${peerSummary}

Your task:
Evaluate ALL carriers listed above on equal footing — do not favor any specific carrier over another.
${params.state ? `The client is in ${stateLabel}. Factor in any known state-specific considerations: carrier availability, state approval status, regulatory differences (e.g. NY requires DFS-approved products), or riders that may be restricted or enhanced in this state.` : ''}
Based purely on the data above, provide a structured analysis with these four sections:

Best Quote Recommendation:
Name the single best-value carrier from the list above and explain why in 2-3 sentences, weighing both monthly premium and ABR score${params.state ? ` and state-specific availability in ${params.state}` : ''}. If multiple carriers are close in value, name the top 2 and explain the trade-off.

Premium Analysis:
Identify the lowest-cost and highest-cost options. Quantify the annual savings of choosing the lowest over the highest. Note any carriers that offer exceptional ABR coverage at a competitive price point.

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
  // REWRITTEN: fetchSelectedCarrierInsights
  // Strategy: generate a rich LOCAL insight immediately (always works, no API needed),
  // then try the AI route to get an enhanced version. If the AI call fails for any
  // reason (404, 503, timeout, missing key), the local insight is shown — the user
  // always sees meaningful content.
  const fetchSelectedCarrierInsights = useCallback(async (carrierId: string) => {
    const carrier = CARRIERS.find((c) => c.id === carrierId);
    if (!carrier) return;

    setSelectedCarrierLoading(true);
    setSelectedCarrierError(null);
    setSelectedCarrierInsight(null);

    const ratingAge   = effectiveAge(params);
    const monthly     = calcMonthlyPremium(carrier, params);
    const aiAnnual    = aiPremiums?.[carrierId]?.guaranteed_annual;
    const displayMonthly = aiAnnual ? aiAnnual / 12 : monthly;
    const displayAnnual  = aiAnnual ?? monthly * 12;

    // ── Step 1: Build and show local insight immediately ─────────────────────
    // This runs synchronously — the user sees real content in milliseconds.
    const peers = CARRIERS
      .filter((c) => selectedCarriers.has(c.id) && c.id !== carrierId)
      .map((c) => {
        const cAiAnnual = aiPremiums?.[c.id]?.guaranteed_annual;
        const annual    = cAiAnnual ?? calcMonthlyPremium(c, params) * 12;
        return { carrier: c, annual };
      });

    const localInsight = generateLocalCarrierInsight({
      carrier,
      params,
      displayMonthly,
      displayAnnual,
      peers,
    });

    // Show local insight right away — don't wait for AI
    setSelectedCarrierInsight(localInsight);
    setSelectedCarrierLoading(false); // show immediately; AI will replace if successful

    // ── Step 2: Attempt AI enhancement (best-effort, 15 s timeout) ───────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const stateLabel = params.state
        ? `${params.state} (${US_STATES.find(s => s.abbr === params.state)?.name ?? params.state})`
        : 'Not specified';

      const abrPts = abrScore(carrier.abr);
      const displayTotal = displayAnnual * params.term_years;

      const otherLines: string[] = CARRIERS
        .filter((c) => selectedCarriers.has(c.id) && c.id !== carrierId)
        .map((c) => {
          const cAiAnnual = aiPremiums?.[c.id]?.guaranteed_annual;
          const m = cAiAnnual ? cAiAnnual / 12 : calcMonthlyPremium(c, params);
          const pts = abrScore(c.abr);
          return [
            `  - ${c.carrier} (${c.product})`,
            `    Monthly: $${m.toFixed(2)} | Annual: $${(m * 12).toFixed(2)} | ABR Score: ${pts}/5`,
            `    Chronic: ${c.abr.chronic} | Critical: ${c.abr.critical} | Terminal: ${c.abr.terminal}`,
          ].join('\n');
        });
      const otherSelected = otherLines.length > 0 ? otherLines.join('\n\n') : '  (No other carriers selected)';

      const promptParts: string[] = [
        'You are a licensed life insurance advisor assistant at AnNa Financial Group.',
        '',
        'The advisor has selected the following carrier for a deeper analysis:',
        '',
        `Carrier: ${carrier.carrier} | Product: ${carrier.product}`,
        `Monthly Premium: $${displayMonthly.toFixed(2)} | Annual: $${displayAnnual.toFixed(2)} | Total (${params.term_years} yrs): $${displayTotal.toFixed(2)}`,
        `ABR Score: ${abrPts}/5`,
        `Chronic Illness ABR: ${carrier.abr.chronic}`,
        `Critical Illness ABR: ${carrier.abr.critical}`,
        `Terminal Illness ABR: ${carrier.abr.terminal}`,
        '',
        'Client Profile:',
        `Name: ${params.first_name || 'Prospect'} ${params.last_name || ''} | Gender: ${params.gender}`,
        `Age (ALB): ${params.age}${params.use_saved_age ? ` | Saved Age (ANB): ${ratingAge} — rating basis` : ' | Basis: ALB'}`,
        `Health Class: ${params.health_class} | Face Amount: ${fmtFace(params.face_amount)} | Term: ${params.term_years} years`,
        `State of Issue: ${stateLabel}`,
        '',
        'Other selected carriers for comparison:',
        otherSelected,
        '',
        'Evaluate this carrier objectively — do not favor any specific provider.',
      ];

      if (params.state) {
        promptParts.push(
          `The client is in ${stateLabel}. Consider state-specific factors: carrier approval status, rider availability, and regulatory rules that may affect this product in ${params.state}.`
        );
      }

      promptParts.push(
        'Provide a focused analysis in exactly three labeled sections:',
        '',
        'Strengths:',
        `2-3 sentences on what makes this carrier/product a strong option for this client, referencing premium, ABR score${params.state ? `, and state suitability (${params.state})` : ''}.`,
        '',
        'Considerations:',
        `1-2 sentences on trade-offs, limitations, or reasons a client might prefer a different carrier${params.state ? `, including state-specific limitations in ${params.state}` : ''}.`,
        '',
        'Key Talking Point:',
        'One specific, actionable question or statement the advisor should raise with the client about this carrier.',
        '',
        'Use plain text only — no markdown symbols like **, ##, or bullet dashes.',
        'Be specific to the client profile — avoid generic insurance boilerplate.'
      );

      const prompt = promptParts.join('\n');

      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 1000 }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // AI route unavailable — local insight already shown, silently keep it
        console.warn(`[fetchSelectedCarrierInsights] AI route returned ${response.status} — showing local insight`);
        return;
      }

      const data = await response.json();
      const text = ((data.text ?? data.content ?? '') as string).trim();

      // Replace local insight with AI-enhanced version only if we got real content
      if (text && text.length > 80) {
        setSelectedCarrierInsight(text);
      }
      // else: keep the local insight already shown

    } catch (err: unknown) {
      clearTimeout(timeout);
      // AI failed — local insight already shown, nothing more needed
      console.warn('[fetchSelectedCarrierInsights] AI enhancement failed — local insight retained:', err);
    }
    // NOTE: setSelectedCarrierLoading(false) already called after local insight above.
    // No finally block needed here — loading was cleared after Step 1.
  }, [params, selectedCarriers, aiPremiums]);

  // MODIFIED: fetchAIPremiums — fully rebuilt with:
  //   1. Actuarial engine pre-computed as guaranteed fallback (AI premiums ALWAYS populate)
  //   2. Corebridge quoted standalone — NOT mixed into peer comparison group
  //   3. Robust multi-layer JSON extraction (handles markdown, prose, partial responses)
  //   4. Sanity-check: AI values within 30%–300% of actuarial estimate are accepted
  //   5. Silent error path — never shows error banner; actuarial values used transparently
  //   6. ABR rider scores included in prompt for carrier-ranking AI context
  const fetchAIPremiums = useCallback(async () => {
    setAiPremiumsLoading(true);
    setAiPremiumsError(null);
    setAiPremiums(null);

    // ── Step 1: Pre-build actuarial fallback for ALL selected carriers ──────────
    // This is computed BEFORE the API call so it is always available as a safety net.
    // If the AI call succeeds, AI values override these for each carrier where the
    // AI response passes sanity checks. If the AI call fails entirely, these values
    // are used silently — no error banner is shown.
    const actuarialFallback: AIPremiums = {};
    CARRIERS
      .filter((c) => selectedCarriers.has(c.id))
      .forEach((c) => {
        const m = calcMonthlyPremium(c, params);
        actuarialFallback[c.id] = {
          guaranteed_annual: Math.round(m * 12 * 100) / 100,
          non_guaranteed_annual: Math.round(m * 18 * 100) / 100,
        };
      });

    // Immediately seed state with actuarial values — table populates right away
    // and will silently update when/if AI values arrive.
    setAiPremiums({ ...actuarialFallback });

    // ── Step 2: Build AI prompt ──────────────────────────────────────────────────
    try {
      const stateLabel = params.state
        ? `${params.state} (${US_STATES.find(s => s.abbr === params.state)?.name ?? params.state})`
        : 'Not specified';

      // CONSTRAINT: Corebridge is quoted standalone — NOT compared against peer carriers.
      // All other selected carriers form the peer comparison group.
      const corebridgeSelected = selectedCarriers.has('corebridge');
      const peerCarriers = CARRIERS.filter((c) => selectedCarriers.has(c.id) && c.id !== 'corebridge');

      // Build carrier list: peers first, then Corebridge last with standalone flag
      const allSelectedForPrompt = [...peerCarriers, ...(corebridgeSelected ? [CARRIERS.find(c => c.id === 'corebridge')!] : [])];

      const carrierListLines = allSelectedForPrompt.map((c) => {
        const localMonthly = calcMonthlyPremium(c, params);
        const abrPts = abrScore(c.abr);
        const isCorebridge = c.id === 'corebridge';
        return [
          `  {`,
          `    "id": "${c.id}",`,
          `    "carrier": "${c.carrier}",`,
          `    "product": "${c.product}",`,
          `    "actuarial_monthly_estimate": ${localMonthly.toFixed(2)},`,
          `    "actuarial_annual_estimate": ${(localMonthly * 12).toFixed(2)},`,
          `    "abr_score": ${abrPts},`,
          `    "abr_chronic": "${c.abr.chronic}",`,
          `    "abr_critical": "${c.abr.critical}",`,
          `    "abr_terminal": "${c.abr.terminal}"` + (isCorebridge ? ',\n    "comparison_rule": "standalone only — do not rank against peer carriers"' : ''),
          `  }`,
        ].join('\n');
      });

      const carrierIds = allSelectedForPrompt.map((c) => `"${c.id}"`).join(', ');

      const prompt = `You are a licensed life insurance actuarial pricing expert.
Your task: return ONLY a valid JSON object — no prose, no explanation, no markdown fences.

CLIENT PROFILE (Age Last Birthday — no saved-age adjustment):
  Gender: ${params.gender}
  Age (ALB): ${params.age}${params.use_saved_age ? ` | Saved Age (ANB): ${effectiveAge(params)} ← USE THIS for premium calculation` : ''}
  Health Class: ${params.health_class}
  State of Issue: ${stateLabel}
  Face Amount: $${params.face_amount.toLocaleString()} (${fmtFace(params.face_amount)})
  Term: ${params.term_years} years (level premium period)

CALIBRATION ANCHOR — verified Corebridge Winflex Web quote (March 2026):
  Corebridge QoL Flex Term | Male | Age 55 | PNT | $1,000,000 | 10-Year | Texas
  Guaranteed Annual Premium: $1,858.00
  Use this to calibrate your Corebridge estimate proportionally for age ${params.age} vs 55.

CARRIERS (${allSelectedForPrompt.length} selected — actuarial estimates provided for sanity-checking):
${carrierListLines.join(',\n')}

COMPARISON RULES:
- Corebridge Financial: quote standalone based on published QoL Flex Term rates only.
- All other carriers: compare as a peer group using published ${params.term_years}-year level term rates.
- ABR scores are provided for carrier-ranking context; factor them into value assessment.
${params.use_saved_age ? `- SAVED AGE: Use Age Nearest Birthday (ANB = ${effectiveAge(params)}) as the rating age.` : `- Use Age Last Birthday (ALB = ${params.age}) — do NOT apply nearest-birthday rounding.`}

OUTPUT: Return ONLY this JSON structure, with one key per carrier ID (${carrierIds}).
Each value must be an object with "guaranteed_annual" (number) and "abr_rank" (number 1=best).
Example: {"lincoln":{"guaranteed_annual":1560,"abr_rank":2},"corebridge":{"guaranteed_annual":1858,"abr_rank":1}}

CRITICAL: Output raw JSON only. First character must be '{'. Last character must be '}'.`;

      // ── Step 3: Call the AI API ───────────────────────────────────────────────
      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 600 }),
      });

      if (!response.ok) {
        // Non-2xx response — stay with actuarial values already seeded
        return;
      }

      const data = await response.json();
      const rawText = ((data.text ?? data.content ?? '')).toString().trim();

      // ── Step 4: Robust multi-layer JSON extraction ───────────────────────────
      // Layer 1: direct parse
      // Layer 2: strip markdown code fences (``` or ```json)
      // Layer 3: extract first {...} block from anywhere in the response
      let parsedAI: Record<string, any> | null = null;

      const tryParse = (s: string): Record<string, any> | null => {
        try { const r = JSON.parse(s); return typeof r === 'object' && r !== null ? r : null; }
        catch { return null; }
      };

      // L1: direct
      parsedAI = tryParse(rawText);

      // L2: strip code fences
      if (!parsedAI) {
        const stripped = rawText
          .replace(/^```(?:json)?\s*/im, '')
          .replace(/\s*```\s*$/m, '')
          .trim();
        parsedAI = tryParse(stripped);
      }

      // L3: extract first { ... } block
      if (!parsedAI) {
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          parsedAI = tryParse(rawText.slice(firstBrace, lastBrace + 1));
        }
      }

      // If all layers fail, actuarial values already set — just return
      if (!parsedAI) return;

      // ── Step 5: Merge AI values over actuarial fallback (sanity-checked) ─────
      // Start from actuarial baseline so every carrier always has a value.
      const merged: AIPremiums = { ...actuarialFallback };

      for (const [id, entry] of Object.entries(parsedAI)) {
        if (typeof entry !== 'object' || entry === null) continue;
        const ga = (entry as any).guaranteed_annual;
        if (typeof ga !== 'number' || ga <= 0) continue;

        // Sanity check: AI value must be within 30%–300% of actuarial estimate
        const actuarialAnnual = actuarialFallback[id]?.guaranteed_annual;
        if (actuarialAnnual) {
          const ratio = ga / actuarialAnnual;
          if (ratio < 0.30 || ratio > 3.0) continue; // reject outlier
        }

        merged[id] = {
          guaranteed_annual: Math.round(ga * 100) / 100,
          non_guaranteed_annual: actuarialFallback[id]?.non_guaranteed_annual
            ?? Math.round(ga * 1.5 * 100) / 100,
        };
      }

      // ── Step 6: Commit merged result ─────────────────────────────────────────
      setAiPremiums(merged);

    } catch {
      // Silent catch — actuarial values already seeded in Step 1; no error banner.
      // setAiPremiumsError is intentionally NOT called here.
    } finally {
      setAiPremiumsLoading(false);
    }
  }, [selectedCarriers, params]);

  // ── Derived: active carriers sorted by premium ────────────────────────────
  // MODIFIED: quoteResults re-sorts by AI guaranteed_annual when available.
  // When AI premiums load, the ranking updates to reflect accurate carrier pricing.
  // Falls back to actuarial monthly sort if AI data is not yet available.
  const quoteResults = useMemo(() => {
    if (!quoteGenerated) return [];
    const results = CARRIERS
      .filter((c) => selectedCarriers.has(c.id))
      .map((c) => ({ ...c, monthly: calcMonthlyPremium(c, params) }));
    return results.sort((a, b) => {
      // Use AI guaranteed annual when available; otherwise actuarial monthly × 12
      const aAnnual = aiPremiums?.[a.id]?.guaranteed_annual ?? (a.monthly * 12);
      const bAnnual = aiPremiums?.[b.id]?.guaranteed_annual ?? (b.monthly * 12);
      return aAnnual - bAnnual;
    });
  }, [quoteGenerated, selectedCarriers, params, aiPremiums]);

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
          <span><b>Age:</b> {params.age} (ALB){params.use_saved_age && <span className="text-blue-700 font-bold ml-1">Saved Age ANB: {effectiveAge(params)}</span>}</span>
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
                {/* ADDED: Saved Age checkbox — shows ANB when DOB is entered, else ALB+1 estimate */}
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="accent-blue-600 w-3.5 h-3.5"
                    checked={params.use_saved_age}
                    onChange={(e) => setParams((p) => ({ ...p, use_saved_age: e.target.checked }))}
                  />
                  <span className="text-[10px] font-semibold text-slate-600">Saved Age</span>
                  {params.use_saved_age && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      ANB: {effectiveAge(params)}
                      {!params.date_of_birth && <span className="text-orange-500 ml-1">(est.)</span>}
                    </span>
                  )}
                </label>
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
              <span>👤 <b>{params.gender}</b>, Age <b>{params.age}</b>{params.use_saved_age && <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Saved Age ANB {effectiveAge(params)}</span>}</span>
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
                    {params.gender}, Age {params.age}{params.use_saved_age ? ` (Saved Age: ANB ${effectiveAge(params)})` : ' (ALB)'} · {params.health_class} · {fmtFace(params.face_amount)} Face Amount · {params.term_years}-Year Term
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
                        {params.use_saved_age && (
                          <span className="text-blue-700 font-semibold">Saved Age (ANB {effectiveAge(params)}) applied — premiums based on Age Nearest Birthday.</span>
                        )}
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

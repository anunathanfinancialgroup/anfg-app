// app/dashboard/page.tsx

"use client";

/** 
 * AnNa Financial Group — Dashboard (page_0 (2).tsx) 
 * 
 * Minimal, scoped UI-layer changes only: 
 * - Added/kept new columns: spouse_name, date_of_birth, children, city, state, immigration_status, work_details. 
 * - Yellow highlight (no timestamp considered) for BOP Date & Follow-Up Date cells when ≥ today in Upcoming Meetings + All Records. 
 * - Upcoming Meetings: Refresh resets to default 30-day range; Show Results active green label. 
 * - Status columns render dropdown lists (incl. State). 
 * - Word-wrap + scrollable popups for Referred By, Product, Comment, Remark (and immigration_status, work_details). 
 * 
 * No backend changes (schema, procedures, routes, auth, Supabase policies). 
 */ 

import React, { useEffect, useMemo, useRef, useState } from "react"; 
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx"; 
import { 
  addDays, 
  addMonths, 
  format, 
  isValid, 
  parseISO, 
  startOfMonth, 
  subMonths, 
  subDays, 
  endOfMonth, 
} from "date-fns"; 
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  LabelList, 
} from "recharts"; 
import { getSupabase } from "@/lib/supabaseClient"; 
import { Button, Card } from "@/components/ui"; 

export const dynamic = "force-dynamic"; 

type Row = Record<string, any>; 
type SortKey = 
  | "client" 
  | "created_at" 
  | "BOP_Date" 
  | "BOP_" 
  | "Followup_Date" 
  | "status" 
  | "CalledOn" 
  | "Issued"; 
type SortDir = "asc" | "desc"; 
type ProgressSortKey = 
  | "client_name" 
  | "last_call_date" 
  | "call_attempts" 
  | "last_bop_date" 
  | "bop_attempts" 
  | "last_followup_date" 
  | "followup_attempts"; 
const ALL_PAGE_SIZE = 10; 
const PROGRESS_PAGE_SIZE = 10;
const UPCOMING_PAGE_SIZE = 10;

const AUTH_COOKIE = "canfs_auth";

function hasAuthCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${AUTH_COOKIE}=true`));
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}
 
const READONLY_LIST_COLS = new Set([ 
  "interest_type", 
  "business_opportunities", 
  "wealth_solutions", 
  "preferred_days", 
]); 
/* --- BEGIN CHANGE: Array columns + multi-select option lists keyed by interest_type --- */
const ARRAY_COLS = new Set([
  "business_opportunities",
  "wealth_solutions",
  "preferred_days",
]);
const BUSINESS_OPPORTUNITIES_OPTIONS: string[] = [
  "financial_freedom",
  "time_freedom",
  "tax_free_retirement",
  "living_benefits",
  "business_building",
  "leadership_development",
  "legacy_building",
];
const WEALTH_SOLUTIONS_OPTIONS: string[] = [
  "protection_planning",
  "retirement_planning",
  "education_planning",
  "investment_planning",
  "estate_planning",
  "tax_planning",
  "debt_management",
];
/** Returns available options for each multi-select field based on interest_type */
function getMultiSelectOptions(interestType: string): {
  business_opportunities: string[];
  wealth_solutions: string[];
} {
  const it = (interestType ?? "Both").toLowerCase();
  return {
    business_opportunities: it === "wealth" ? [] : BUSINESS_OPPORTUNITIES_OPTIONS,
    wealth_solutions: it === "business" ? [] : WEALTH_SOLUTIONS_OPTIONS,
  };
}
/* --- END CHANGE --- */ 
// Date & datetime keys (UI mapping only) 
const DATE_TIME_KEYS = new Set([ 
  "BOP_Date", 
  "CalledOn", 
  "Followup_Date", 
  "FollowUp_Date", 
  "Issued", 
  "FNA_Date", 
]); 
const DATE_ONLY_KEYS = new Set(["date_of_birth"]); // calendar date without time 
/** ------- Yellow highlight helper (ignore timestamp) ------- */ 
function dateOnOrAfterToday(dateVal: any): boolean { 
  if (!dateVal) return false; 
  const d = new Date(dateVal); 
  if (Number.isNaN(d.getTime())) return false; 
  const today = new Date(); 
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()); 
  const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()); 
  return dOnly.getTime() >= tOnly.getTime(); 
} 
const HIGHLIGHT_DATE_KEYS = new Set(["BOP_Date", "Followup_Date", "FollowUp_Date"]); 
const LABEL_OVERRIDES: Record<string, string> = { 
  client_name: "Client Name", 
  last_call_date: "Last Call On", 
  call_attempts: "No of Calls", 
  last_bop_date: "Last/Next BOP Call On", 
  bop_attempts: "No of BOP Calls", 
  last_followup_date: "Last/Next FollowUp On", 
  followup_attempts: "No of FollowUp Calls", 
  created_at: "Created Date", 
  interest_type: "Interest Type", 
  business_opportunities: "Business Opportunities", 
  wealth_solutions: "Wealth Solutions", 
  preferred_days: "Preferred Days", 
  preferred_time: "Preferred Time", 
  referred_by: "Referred By", 
  Profession: "Profession", 
  Product: "Products Sold", 
  Comment: "Comment", 
  Remark: "Remark", 
  CalledOn: "Called On", 
  BOP_Date: "BOP Date", 
  BOP_Status: "BOP Status", 
  Followup_Date: "Follow-Up Date", 
  FollowUp_Status: "Follow-Up Status", 
  spouse_name: "Spouse Name", 
  date_of_birth: "Date Of Birth", 
  children: "Children", 
  city: "City", 
  state: "State", 
  immigration_status: "Immigration Status", 
  work_details: "Work Details", 
  status: "Record Status", 
  client_status: "Status", 
  FNA_Status: "FNA Status", 
  FNA_Date: "FNA Date", 
}; 
function labelFor(key: string) { 
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key]; 
  const s = key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim(); 
  const acronyms = new Set(["BOP", "ID", "API", "URL", "CAN"]); 
  return s 
    .split(/\s+/) 
    .map((w) => 
      acronyms.has(w.toUpperCase()) 
        ? w.toUpperCase() 
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() 
    ) 
    .join(" "); 
} 
function clientName(r: Row) { 
  return `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(); 
} 
function toLocalInput(value: any) { 
  if (!value || value === null || value === undefined || String(value).trim() === '') return ""; 
  
  // Value from database is in format: 2026-01-23T19:01:00.000Z
  // We want to display it as: 2026-01-23T19:01 (without timezone conversion)
  // This preserves the exact time that was entered
  const str = String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return "";
  
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}`;
} 
function toLocalDateInput(value: any) { 
  if (!value || value === null || value === undefined || String(value).trim() === '') return ""; 
  const d = new Date(value); 
  const timestamp = d.getTime();
  // Reject invalid dates, negative timestamps, and dates from 1969-1970 (likely epoch/default values)
  if (Number.isNaN(timestamp) || timestamp < 0) return "";
  const year = d.getFullYear();
  if (year === 1969 || year === 1970) return ""; // Reject epoch dates
  const pad = (n: number) => String(n).padStart(2, "0"); 
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; 
} 
function fromLocalInput(value: string) { 
  if (!value?.trim()) return null;
  
  // datetime-local format: YYYY-MM-DDTHH:MM
  // We want to store this EXACT time without timezone conversion
  // Parse manually to avoid browser timezone interpretation
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    console.error('Invalid datetime-local format:', value);
    return null;
  }
  
  const [, year, month, day, hour, minute] = match;
  
  // Create ISO string directly without timezone conversion
  // This treats the input as if it's already in UTC
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
  console.log('fromLocalInput:', value, '→', isoString);
  return isoString;
} 
function fromLocalDate(value: string) { 
  if (!value?.trim()) return null; 
  const parts = value.split("-"); 
  if (parts.length !== 3) return null; 
  const [y, m, d] = parts.map((x) => Number(x)); 
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1); 
  if (Number.isNaN(dt.getTime())) return null; 
  return dt.toISOString(); 
} 

// Get a row's value as the same string format used by inputs (for dirty-checking)
function getRowInputString(r: Row, k: string): string {
  const isDateTime = DATE_TIME_KEYS.has(k);
  const isDateOnly = DATE_ONLY_KEYS.has(k);
  const val = (r as any)?.[k];
  if (isDateTime) return toLocalInput(val);
  if (isDateOnly) return toLocalDateInput(val);
  return val ?? "";
}
function asListItems(value: any): string[] { 
  if (value == null) return []; 
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean); 
  const s = String(value).trim(); 
  if (!s) return []; 
  if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean); 
  return [s]; 
} 
function toggleSort(cur: { key: SortKey; dir: SortDir }, k: SortKey) { 
  const DESC_FIRST = new Set<SortKey>(["CalledOn", "BOP_Date", "Followup_Date"]); 
  if (cur.key !== k) { 
    return { key: k, dir: (DESC_FIRST.has(k) ? "desc" : "asc") as SortDir }; 
  } 
  return { key: k, dir: cur.dir === "asc" ? ("desc" as SortDir) : ("asc" as SortDir) }; 
} 
function toggleProgressSort( 
  cur: { key: ProgressSortKey; dir: SortDir }, 
  k: ProgressSortKey 
) { 
  const DESC_FIRST = new Set<ProgressSortKey>([ 
    "last_call_date", 
    "last_bop_date", 
    "last_followup_date", 
  ]); 
  if (cur.key !== k) { 
    return { key: k, dir: (DESC_FIRST.has(k) ? "desc" : "asc") as SortDir }; 
  } 
  return { key: k, dir: cur.dir === "asc" ? ("desc" as SortDir) : ("asc" as SortDir) }; 
} 
function useColumnResizer() { 
  const [widths, setWidths] = useState<Record<string, number>>({}); 
  const resizeRef = useRef<{ 
    colId: string; 
    startX: number; 
    startW: number; 
    minW: number; 
  } | null>(null); 
  const startResize = ( 
    e: React.MouseEvent, 
    colId: string, 
    curWidth: number, 
    minW = 70 
  ) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    resizeRef.current = { colId, startX: e.clientX, startW: curWidth, minW }; 
    const onMove = (ev: MouseEvent) => { 
      if (!resizeRef.current) return; 
      const dx = ev.clientX - resizeRef.current.startX; 
      const next = Math.max(resizeRef.current.minW, resizeRef.current.startW + dx); 
      setWidths((prev) => ({ ...prev, [resizeRef.current!.colId]: next })); 
    }; 
    const onUp = () => { 
      resizeRef.current = null; 
      window.removeEventListener("mousemove", onMove); 
      window.removeEventListener("mouseup", onUp); 
    }; 
    window.addEventListener("mousemove", onMove); 
    window.addEventListener("mouseup", onUp); 
  }; 
  return { widths, setWidths, startResize }; 
} 
const US_STATE_OPTIONS: string[] = [ 
  "", 
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", 
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", 
]; 
const IMMIGRATION_STATUS_OPTIONS: string[] = [ 
  "", 
  "U.S. Citizen", "U.S.Green Card", "H-1B", "H-1B/I-140 Approved", "L-1A", "L-1B", "F-1 Student", 
  "F-1 OPT", "F-1 STEM OPT", "H-4 EAD", "E-3", "I-485 Pending", "I-485 EAD/AP", "Other Visa Status", 
]; 
const STATUS_OPTIONS: Record<string, string[]> = { 
  status: ["", "Successful Client", "Prospect Client", "New Client",  "Existing Client", "Referral Client", "Initiated", "Not-Interested", "In-Progress", "On-Hold", "Closed", "Completed"], 
  followup_status: ["", "Open", "In-Progress", "Follow-Up", "Follow-Up 2", "On Hold", "Completed"], 
  "follow-up_status": ["", "Open", "In-Progress", "Follow-Up", "Follow-Up 2", "On Hold", "Completed"], 
  client_status: ["", "Policy Issued", "New Client", "Initiated", "Interested", "Not-Interested", "In-Progress", "Closed", "On Hold", "Purchased", "Re-Opened", "Completed"],
  bop_status: ["", "Presented", "Business", "Client", "In-Progress", "On-Hold", "Clarification", "Not Interested", "Completed", "Closed"], 
  fna_status: ["", "In-Progress", "Completed", "Not Interested", "Solution Provided", "Skipped"], 
  state: US_STATE_OPTIONS, 
  immigration_status: IMMIGRATION_STATUS_OPTIONS, 
}; 
function optionsForKey(k: string): string[] | null { 
  const lk = k.toLowerCase().replace(/\s+/g, "_"); 
  if (lk in STATUS_OPTIONS) return STATUS_OPTIONS[lk]; 
  return null; 
} 
export default function Dashboard() {
  const router = useRouter(); 
  const [error, setError] = useState<string | null>(null); 
  const [daily60, setDaily60] = useState<{ day: string; calls?: number; bops?: number; followups?: number }[]>([]); 
  const [monthly12, setMonthly12] = useState<{ month: string; calls?: number; bops?: number; followups?: number }[]>([]); 
  const [trendLoading, setTrendLoading] = useState(false); 
  const [rangeStart, setRangeStart] = useState(format(new Date(), "yyyy-MM-dd")); 
  const [rangeEnd, setRangeEnd] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd")); 
  const [upcoming, setUpcoming] = useState<Row[]>([]); 
  const [upcomingLoading, setUpcomingLoading] = useState(false); 
  const [sortUpcoming, setSortUpcoming] = useState<{ key: SortKey; dir: SortDir }>({ key: "BOP_Date", dir: "desc" }); 
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [upcomingPageJump, setUpcomingPageJump] = useState("1"); 
  const [progressRows, setProgressRows] = useState<Row[]>([]); 
  const [progressLoading, setProgressLoading] = useState(false); 
  const [progressFilter, setProgressFilter] = useState(""); 
  const [progressSort, setProgressSort] = useState<{ key: ProgressSortKey; dir: SortDir }>({ key: "last_call_date", dir: "desc" }); 
  const [progressPage, setProgressPage] = useState(0); 
  const [progressPageJump, setProgressPageJump] = useState("1"); 
  
  // Column filters for all cards
  const [recordsColumnFilters, setRecordsColumnFilters] = useState<Record<string, Set<string>>>({});
  
  const [q, setQ] = useState(""); 
  const [records, setRecords] = useState<Row[]>([]); 
  const [total, setTotal] = useState(0); 
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0); 
  const [pageJump, setPageJump] = useState("1"); 
  const [loading, setLoading] = useState(true); 
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<string, Record<string, string>>>({});
  const [batchSaving, setBatchSaving] = useState(false);
  const [resetDraftsToken, setResetDraftsToken] = useState(0);
  const saveEnabled = useMemo(() => {
    if (!selectedRecordId) return false;
    const edits = pendingEdits[selectedRecordId];
    return !!edits && Object.keys(edits).length > 0;
  }, [selectedRecordId, pendingEdits]);
 
  const [sortAll, setSortAll] = useState<{ key: SortKey; dir: SortDir }>({ key: "created_at", dir: "desc" }); 
  const [recordsVisible, setRecordsVisible] = useState(false);  

  const [trendsVisible, setTrendsVisible] = useState(false);
  const [upcomingVisible, setUpcomingVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);

  /* --- BEGIN CHANGE: New Client + Soft Delete state --- */
  const NEW_CLIENT_DEFAULTS: Record<string, any> = {
    first_name: "",
    last_name: "",
    phone: "000-000-0000",
    email: "chidam.alagar@gmail.com",
    interest_type: "Both",
    business_opportunities: ["financial_freedom"],
    wealth_solutions: ["protection_planning"],
    referred_by: "Chidam Alagar",
    preferred_days: ["Monday"],
    preferred_time: "PM",
  };
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState<Record<string, any>>({ ...NEW_CLIENT_DEFAULTS });
  const [newClientSaving, setNewClientSaving] = useState(false);
  const [newClientMsg, setNewClientMsg] = useState<string | null>(null);
  const [newClientError, setNewClientError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  /* Derive available options for New Client modal based on selected interest_type */
  const newClientMultiOpts = useMemo(
    () => getMultiSelectOptions(newClientForm.interest_type ?? "Both"),
    [newClientForm.interest_type]
  );
  /* --- END CHANGE --- */
 
  useEffect(() => {
    (async () => {
      try {
        // Guard: accept either the simple cookie auth (used by /auth) OR a Supabase session (if configured).
        const cookieOk = hasAuthCookie();
        if (!cookieOk) {
          const supabase = getSupabase();
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            router.replace("/auth?next=/dashboard");
            return;
          }
        }
        await Promise.all([fetchTrends(), fetchProgressSummary(), loadPage(0)]);
      } catch (e: any) {
        setError(e?.message ?? "Failed to initialize");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]); 
  useEffect(() => { 
    loadPage(0); 
  }, [sortAll.key, sortAll.dir]); 
  useEffect(() => { 
    if (upcoming.length) fetchUpcoming(); 
  }, [sortUpcoming.key, sortUpcoming.dir]); 
  useEffect(() => {
    const id = setTimeout(() => {
      loadPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [q]); 
  function applySort(query: any, sort: { key: SortKey; dir: SortDir }) { 
    const ascending = sort.dir === "asc"; 
    if (sort.key === "client") return query.order("first_name", { ascending }).order("last_name", { ascending }); 
    return query.order(sort.key, { ascending }); 
  } 
 async function logout() { 
    try { 
      const supabase = getSupabase(); 
      await supabase.auth.signOut(); 
    } finally {
      clearAuthCookie();
      router.replace("/auth");
    } 
  } 
  async function ut() { 
    try { 
      const supabase = getSupabase(); 
      await supabase.auth.signOut(); 
    } finally {
      clearAuthCookie();
      router.replace("/auth");
    } 
  } 
  async function fetchTrends() { 
    setTrendLoading(true); 
    setError(null); 
    try { 
      const supabase = getSupabase(); 
      const today = new Date(); 
      const startDaily = subDays(today, 59); 
      const [{ data: callsRows }, { data: bopsRows }, { data: fuRows }] = await Promise.all([ 
        supabase.from("client_registrations").select("CalledOn").gte("CalledOn", startDaily.toISOString()).order("CalledOn", { ascending: true }).limit(50000), 
        supabase.from("client_registrations").select("BOP_Date").gte("BOP_Date", startDaily.toISOString()).order("BOP_Date", { ascending: true }).limit(50000), 
        supabase.from("client_registrations").select("Followup_Date").gte("Followup_Date", startDaily.toISOString()).order("Followup_Date", { ascending: true }).limit(50000), 
      ]); 
      const days: string[] = []; 
      const callsDay = new Map<string, number>(); 
      const bopsDay = new Map<string, number>(); 
      const fuDay = new Map<string, number>(); 
      for (let i = 0; i < 60; i++) { 
        const d = addDays(startDaily, i); 
        const key = format(d, "yyyy-MM-dd"); 
        days.push(key); 
        callsDay.set(key, 0); 
        bopsDay.set(key, 0); 
        fuDay.set(key, 0); 
      } 
      const bumpDay = (dateVal: any, map: Map<string, number>) => { 
        if (!dateVal) return; 
        const d = parseISO(String(dateVal)); 
        if (!isValid(d)) return; 
        const k = format(d, "yyyy-MM-dd"); 
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1); 
      }; 
      (callsRows ?? []).forEach((r: any) => bumpDay(r.CalledOn, callsDay)); 
      (bopsRows ?? []).forEach((r: any) => bumpDay(r.BOP_Date, bopsDay)); 
      (fuRows ?? []).forEach((r: any) => bumpDay(r.Followup_Date, fuDay)); 
      const nz = (n: number | undefined) => (n && n !== 0 ? n : undefined); 
      setDaily60(days.map((day) => ({ day, calls: nz(callsDay.get(day) ?? 0), bops: nz(bopsDay.get(day) ?? 0), followups: nz(fuDay.get(day) ?? 0) }))); 
      const startMonth = startOfMonth(subMonths(today, 11)); 
      const months: string[] = []; 
      const callsMonth = new Map<string, number>(); 
      const bopsMonth = new Map<string, number>(); 
      const fuMonth = new Map<string, number>(); 
      for (let i = 0; i < 12; i++) { 
        const mDate = addMonths(startMonth, i); 
        const key = format(mDate, "yyyy-MM"); 
        months.push(key); 
        callsMonth.set(key, 0); 
        bopsMonth.set(key, 0); 
        fuMonth.set(key, 0); 
      } 
      // --- BEGIN CHANGE: Replace per-column client_registrations queries with v_client_call_year_month_counts
      // for all 12 months. The view counts rows in client_call_track (audit log), so it gives accurate
      // historical totals. typename values in the view are "Call", "BOP", "FollowUp".
      // The three original client_registrations queries are kept so that the existing API calls are preserved
      // (they are awaited but their results are superseded by the view for any month the view has data).
      const startYear  = startMonth.getFullYear();
      const startMonthNum = startMonth.getMonth() + 1; // 1-indexed to match the view

      const [{ data: callsY }, { data: bopsY }, { data: fuY }, { data: viewCounts }] = await Promise.all([
        // Existing calls kept intact — results used only as fallback when view has no row for a month
        supabase.from("client_registrations").select("CalledOn").gte("CalledOn", startMonth.toISOString()).lt("CalledOn", addMonths(endOfMonth(today), 1).toISOString()).order("CalledOn", { ascending: true }).limit(200000),
        supabase.from("client_registrations").select("BOP_Date").gte("BOP_Date", startMonth.toISOString()).lt("BOP_Date", addMonths(endOfMonth(today), 1).toISOString()).order("BOP_Date", { ascending: true }).limit(200000),
        supabase.from("client_registrations").select("Followup_Date").gte("Followup_Date", startMonth.toISOString()).lt("Followup_Date", addMonths(endOfMonth(today), 1).toISOString()).order("Followup_Date", { ascending: true }).limit(200000),
        // Fetch ALL rows in the 12-month window from the audit-based view
        supabase.from("v_client_call_year_month_counts")
          .select("year, month, typename, record_count")
          .or(
            // year > startYear  OR  (year = startYear AND month >= startMonthNum)
            `year.gt.${startYear},and(year.eq.${startYear},month.gte.${startMonthNum})`
          )
          .lte("year", today.getFullYear()),
      ]);

      const bumpMonth = (dateVal: any, map: Map<string, number>) => {
        if (!dateVal) return;
        const d = parseISO(String(dateVal));
        if (!isValid(d)) return;
        const k = format(d, "yyyy-MM");
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
      };
      // Populate fallback maps from client_registrations (used only when view has no entry)
      (callsY ?? []).forEach((r: any) => bumpMonth(r.CalledOn, callsMonth));
      (bopsY ?? []).forEach((r: any) => bumpMonth(r.BOP_Date, bopsMonth));
      (fuY ?? []).forEach((r: any) => bumpMonth(r.Followup_Date, fuMonth));

      // Build the 12-month dataset; override with view counts where available.
      // View typename values: "Call" → calls, "BOP" → bops, "FollowUp" → followups
      const viewByKey = new Map<string, { calls?: number; bops?: number; followups?: number }>();
      (viewCounts ?? []).forEach((r: any) => {
        // Pad month to 2 digits to match "yyyy-MM" format used for chart keys
        const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
        const entry = viewByKey.get(key) ?? {};
        const count = Number(r.record_count);
        if (r.typename === "Call")     entry.calls     = count;
        else if (r.typename === "BOP") entry.bops      = count;
        else if (r.typename === "FollowUp") entry.followups = count;
        viewByKey.set(key, entry);
      });

      // Don't filter out zero values - show all months including zeros for proper chart display
      setMonthly12(months.map((month) => {
        const viewEntry = viewByKey.get(month);
        return {
          month,
          // Use view count when present; fall back to client_registrations-derived count
          calls:     viewEntry?.calls     ?? callsMonth.get(month)  ?? 0,
          bops:      viewEntry?.bops      ?? bopsMonth.get(month)   ?? 0,
          followups: viewEntry?.followups ?? fuMonth.get(month)     ?? 0,
        };
      }));
      // --- END CHANGE ---
    } catch (e: any) { 
      setError(e?.message ?? "Failed to load trends"); 
    } finally { 
      setTrendLoading(false); 
    } 
  } 
  async function fetchUpcoming() { 
    setUpcomingLoading(true); 
    setError(null); 
    try { 
      const supabase = getSupabase(); 
      const start = new Date(rangeStart); 
      const end = new Date(rangeEnd); 
      const startIso = start.toISOString(); 
      const endIso = new Date(end.getTime() + 24 * 60 * 60 * 1000).toISOString(); 
      const { data: bopRows, error: bopErr } = await supabase.from("client_registrations").select("*").neq("status", "deleted").gte("BOP_Date", startIso).lt("BOP_Date", endIso).limit(5000); /* CHANGE: exclude deleted */ 
      if (bopErr) throw bopErr; 
      const { data: fuRows, error: fuErr } = await supabase.from("client_registrations").select("*").neq("status", "deleted").gte("Followup_Date", startIso).lt("Followup_Date", endIso).limit(5000); /* CHANGE: exclude deleted */ 
      if (fuErr) throw fuErr; 
      const map = new Map<string, any>(); 
      for (const r of bopRows ?? []) map.set(String((r as any).id), r); 
      for (const r of fuRows ?? []) map.set(String((r as any).id), r); 
      let merged = Array.from(map.values()); 
      const asc = sortUpcoming.dir === "asc"; 
      const key = sortUpcoming.key; 
      const getVal = (r: any) => { 
        if (key === "client") return `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(); 
        return r[key]; 
      }; 
      merged.sort((a: any, b: any) => { 
        const av = getVal(a); 
        const bv = getVal(b); 
        if (key === "created_at" || key === "BOP_Date" || key === "Followup_Date" || key === "CalledOn" || key === "Issued") { 
          const at = av ? new Date(av).getTime() : 0; 
          const bt = bv ? new Date(bv).getTime() : 0; 
          return asc ? at - bt : bt - at; 
        } 
        return asc ? String(av ?? "").localeCompare(String(bv ?? "")) : String(bv ?? "").localeCompare(String(av ?? "")); 
      }); 
      setUpcoming(merged); 
      setUpcomingVisible(true); 
    } catch (e: any) { 
      setError(e?.message ?? "Failed to load upcoming meetings"); 
    } finally { 
      setUpcomingLoading(false); 
    } 
  } 
  async function fetchProgressSummary() { 
    setProgressLoading(true); 
    setError(null); 
    try { 
      const supabase = getSupabase(); 
      const { data, error } = await supabase 
        .from("v_client_progress_summary") 
        .select("clientid, first_name, last_name, phone, email, last_call_date, call_attempts, last_bop_date, bop_attempts, last_followup_date, followup_attempts") 
        .order("clientid", { ascending: false }); 
      if (error) throw error; 
      const rows = (data ?? []).map((r: any) => ({ 
        clientid: r.clientid, 
        client_name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(), 
        first_name: r.first_name, 
        last_name: r.last_name, 
        phone: r.phone, 
        email: r.email, 
        last_call_date: r.last_call_date, 
        call_attempts: r.call_attempts, 
        last_bop_date: r.last_bop_date, 
        bop_attempts: r.bop_attempts, 
        last_followup_date: r.last_followup_date, 
        followup_attempts: r.followup_attempts, 
      })); 
      console.log('Progress Summary loaded:', rows.length, 'records'); 
      setProgressRows(rows); 
      setProgressPage(0); 
    } catch (e: any) { 
      setError(e?.message ?? "Failed to load Client Progress Summary"); 
    } finally { 
      setProgressLoading(false); 
    } 
  } 
  async function loadPage(nextPage: number) { 
    setError(null); 
    setLoading(true); 
    try { 
      const supabase = getSupabase(); 
      const search = q.trim(); 
      let countQuery = supabase.from("client_registrations").select("id", { count: "exact", head: true }).neq("status", "deleted"); /* CHANGE: exclude deleted */ 
      if (search) countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`); 
      const { count, error: cErr } = await countQuery; 
      if (cErr) throw cErr; 
      setTotal(count ?? 0); 
      
      // Fetch all status counts
      let allStatusQuery = supabase.from("client_registrations").select("status, client_status").neq("status", "deleted"); /* CHANGE: exclude deleted */
      if (search) allStatusQuery = allStatusQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data: allStatusData, error: statusErr } = await allStatusQuery;
      if (statusErr) throw statusErr;
      
      const counts: Record<string, number> = {};
      (allStatusData ?? []).forEach((row: any) => {
        const status = row.status;
        const clientStatus = row.client_status;
        if (status) counts[`status_${status}`] = (counts[`status_${status}`] || 0) + 1;
        if (clientStatus) counts[`client_status_${clientStatus}`] = (counts[`client_status_${clientStatus}`] || 0) + 1;
      });
      setStatusCounts(counts);
      
      const from = nextPage * ALL_PAGE_SIZE; 
      const to = from + ALL_PAGE_SIZE - 1; 
      let dataQuery = supabase.from("client_registrations").select("*").neq("status", "deleted").range(from, to); /* CHANGE: exclude deleted */ 
      if (search) dataQuery = dataQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`); 
      dataQuery = applySort(dataQuery, sortAll); 
      const { data, error } = await dataQuery; 
      if (error) throw error; 
      setRecords(data ?? []); 
      setPage(nextPage); 
      setPageJump(String(nextPage + 1)); 
    } catch (e: any) { 
      setError(e?.message ?? "Failed to load records"); 
    } finally { 
      setLoading(false); 
    } 
  } 
  async function updateCell(id: string, key: string, rawValue: string) { 
    setSavingId(id); 
    setError(null); 
    try { 
      const supabase = getSupabase(); 
      const payload: any = {}; 
      const isDateOnly = DATE_ONLY_KEYS.has(key); 
      const isDateTime = DATE_TIME_KEYS.has(key); 
      payload[key] = isDateTime ? fromLocalInput(rawValue) : isDateOnly ? fromLocalDate(rawValue) : ARRAY_COLS.has(key) ? (rawValue?.trim() ? rawValue.split(",").map((s: string) => s.trim()).filter(Boolean) : []) : rawValue?.trim() ? rawValue : null; /* CHANGE: handle ARRAY_COLS */ 
      const { error } = await supabase.from("client_registrations").update(payload).eq("id", id); 
      if (error) throw error; 
      const patch = (prev: Row[]) => prev.map((r) => (String(r.id) === String(id) ? { ...r, [key]: payload[key] } : r)); 
      setRecords(patch); 
      setUpcoming(patch); 
    } catch (e: any) { 
      setError(e?.message ?? "Update failed"); 
      throw e; 
    } finally { 
      setSavingId(null); 
    } 
  } 
  function clearSaveState() {
    setPendingEdits({});
    setSelectedRecordId(null);
    setResetDraftsToken((t) => t + 1);
  }

  function handleRowSelect(id: string) {
    setSelectedRecordId((cur) => {
      if (String(cur ?? '') !== String(id)) {
        // Switching rows clears any unsaved edits
        setPendingEdits({});
        setResetDraftsToken((t) => t + 1);
      }
      return id;
    });
  }

  function handlePendingChange(id: string, key: string, value: string) {
    // Always track changes for the row being edited
    // The selectedRecordId will be set by handleRowSelect when the row is clicked
    const baseRow = (records ?? []).find((r) => String(r.id) === String(id));
    if (!baseRow) return;
    
    const baseVal = String(getRowInputString(baseRow, key) ?? '');
    const newVal = String(value ?? '');
    
    setPendingEdits((prev) => {
      const next = { ...prev };
      const rowEdits = { ...(next[id] || {}) };
      
      // Check if value has actually changed
      if (newVal === baseVal || (!newVal && !baseVal)) {
        delete rowEdits[key];
      } else {
        rowEdits[key] = newVal;
      }
      
      if (Object.keys(rowEdits).length === 0) delete next[id];
      else next[id] = rowEdits;
      return next;
    });
    
    // Also ensure this row is selected
    setSelectedRecordId(id);
  }

  async function saveSelectedRecord() {
    if (!selectedRecordId) return;
    const edits = pendingEdits[selectedRecordId];
    if (!edits || Object.keys(edits).length === 0) return;
    setBatchSaving(true);
    setSavingId(selectedRecordId);
    setError(null);
    try {
      const supabase = getSupabase();
      const payload: any = {};
      for (const [key, rawValue] of Object.entries(edits)) {
        const isDateOnly = DATE_ONLY_KEYS.has(key);
        const isDateTime = DATE_TIME_KEYS.has(key);
        
        if (isDateTime) {
          const converted = fromLocalInput(String(rawValue ?? ''));
          payload[key] = converted;
        } else if (isDateOnly) {
          payload[key] = fromLocalDate(String(rawValue ?? ''));
        } else if (ARRAY_COLS.has(key)) {
          /* CHANGE: convert comma-separated string to array for array columns */
          const str = String(rawValue ?? '').trim();
          payload[key] = str ? str.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
        } else {
          payload[key] = String(rawValue ?? '').trim() ? String(rawValue) : null;
        }
      }
      
      const { error } = await supabase
        .from('client_registrations')
        .update(payload)
        .eq('id', selectedRecordId);
      if (error) throw error;

      // Fetch the saved record to get exact database values
      const { data: savedRecord, error: fetchError } = await supabase
        .from('client_registrations')
        .select('*')
        .eq('id', selectedRecordId)
        .single();
      
      // Use savedRecord if available, otherwise fall back to payload
      const updatedData = savedRecord || payload;

      const patch = (prev: Row[]) =>
        prev.map((r) =>
          String(r.id) === String(selectedRecordId) 
            ? { ...r, ...updatedData } 
            : r
        );
      setRecords(patch);
      setUpcoming(patch);
      
      // Reload the current page to get fresh data from database
      await loadPage(page);
      
      // Refresh Client Progress Summary if date fields were updated
      const hasDateUpdates = Object.keys(edits).some(key => 
        key === 'CalledOn' || key === 'BOP_Date' || key === 'Followup_Date'
      );
      if (hasDateUpdates) {
        await fetchProgressSummary();
      }
      
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[selectedRecordId];
        return next;
      });
      setResetDraftsToken((t) => t + 1);
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
      throw e;
    } finally {
      setBatchSaving(false);
      setSavingId(null);
    }
  }

  /* --- BEGIN CHANGE: Create New Client function --- */
  async function createNewClient() {
    const firstName = (newClientForm.first_name ?? "").trim();
    const lastName = (newClientForm.last_name ?? "").trim();
    if (!firstName || !lastName) {
      setNewClientError("First Name and Last Name are required.");
      return;
    }
    setNewClientSaving(true);
    setNewClientError(null);
    setNewClientMsg(null);
    try {
      const supabase = getSupabase();
      const emailVal = (newClientForm.email ?? "").trim() || "chidam.alagar@gmail.com";
      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone: (newClientForm.phone ?? "").trim() || "000-000-0000",
        email: emailVal,
        interest_type: newClientForm.interest_type || "Both",
        business_opportunities: Array.isArray(newClientForm.business_opportunities)
          ? newClientForm.business_opportunities
          : ["financial_freedom"],
        wealth_solutions: Array.isArray(newClientForm.wealth_solutions)
          ? newClientForm.wealth_solutions
          : ["protection_planning"],
        referred_by: (newClientForm.referred_by ?? "").trim() || "Chidam Alagar",
        preferred_days: Array.isArray(newClientForm.preferred_days)
          ? newClientForm.preferred_days
          : ["Monday"],
        preferred_time: newClientForm.preferred_time || "PM",
        status: "New Client",
        client_status: "New Client",
      };
      const { error: insertErr } = await supabase.from("client_registrations").insert(payload);
      if (insertErr) throw insertErr;
      setNewClientMsg(`New Client ${firstName} ${lastName} created`);
      setNewClientOpen(false);
      setNewClientForm({ ...NEW_CLIENT_DEFAULTS });
      await loadPage(0);
      setTimeout(() => setNewClientMsg(null), 5000);
    } catch (e: any) {
      setNewClientError(e?.message ?? "Failed to create client");
    } finally {
      setNewClientSaving(false);
    }
  }
  /* --- END CHANGE: Create New Client --- */

  /* --- BEGIN CHANGE: Soft Delete Client function --- */
  async function softDeleteClient(id: string) {
    setDeleting(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: delErr } = await supabase
        .from("client_registrations")
        .update({ status: "deleted" })
        .eq("id", id);
      if (delErr) throw delErr;
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      clearSaveState();
      await loadPage(page);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete client");
    } finally {
      setDeleting(false);
    }
  }
  /* --- END CHANGE: Soft Delete --- */


  const totalPages = Math.max(1, Math.ceil((total ?? 0) / ALL_PAGE_SIZE)); 
  const canPrev = page > 0; 
  const canNext = (page + 1) * ALL_PAGE_SIZE < total; 
  const exportUpcomingXlsx = () => { 
    const ws = XLSX.utils.json_to_sheet(upcoming); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Upcoming_BOP"); 
    XLSX.writeFile(wb, `Upcoming_${rangeStart}_to_${rangeEnd}.xlsx`); 
  }; 
  const extraClientCol = useMemo(() => [{ label: "Client Name", sortable: "client" as SortKey, render: (r: Row) => clientName(r) }], []); 
  const progressFilteredSorted = useMemo(() => { 
    const needle = progressFilter.trim().toLowerCase(); 
    const filtered = (progressRows ?? []).filter((r) => (!needle ? true : String(r.client_name ?? "").toLowerCase().includes(needle))); 
    const dirMul = progressSort.dir === "asc" ? 1 : -1; 
    const asNum = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; }; 
    const asTime = (v: any) => { if (!v) return 0; const d = new Date(v); const t = d.getTime(); return Number.isFinite(t) ? t : 0; }; 
    filtered.sort((a, b) => { 
      const k = progressSort.key; 
      if (k === "client_name") return String(a.client_name ?? "").localeCompare(String(b.client_name ?? "")) * dirMul; 
      if (k === "call_attempts" || k === "bop_attempts" || k === "followup_attempts") return (asNum(a[k]) - asNum(b[k])) * dirMul; 
      return (asTime(a[k]) - asTime(b[k])) * dirMul; 
    }); 
    return filtered; 
  }, [progressRows, progressFilter, progressSort]); 
  const progressTotalPages = Math.max(1, Math.ceil(progressFilteredSorted.length / PROGRESS_PAGE_SIZE)); 
  const progressPageSafe = Math.min(progressTotalPages - 1, Math.max(0, progressPage)); 
  const progressSlice = progressFilteredSorted.slice(progressPageSafe * PROGRESS_PAGE_SIZE, progressPageSafe * PROGRESS_PAGE_SIZE + PROGRESS_PAGE_SIZE); 
  
  // Debug logging in useEffect
  useEffect(() => {
    if (progressFilteredSorted.length > 0) {
      console.log('Progress Pagination:', {
        totalRecords: progressFilteredSorted.length,
        pageSize: PROGRESS_PAGE_SIZE,
        totalPages: progressTotalPages,
        currentPage: progressPageSafe + 1,
        sliceSize: progressSlice.length
      });
    }
  }, [progressFilteredSorted.length, progressTotalPages, progressPageSafe, progressSlice.length]);
  
  // Pagination for Upcoming Meetings
  const upcomingTotalPages = Math.max(1, Math.ceil(upcoming.length / UPCOMING_PAGE_SIZE));
  const upcomingPageSafe = Math.min(upcomingTotalPages - 1, Math.max(0, upcomingPage));
  const upcomingSlice = upcoming.slice(upcomingPageSafe * UPCOMING_PAGE_SIZE, upcomingPageSafe * UPCOMING_PAGE_SIZE + UPCOMING_PAGE_SIZE);
  
  const allVisible = trendsVisible && upcomingVisible && progressVisible && recordsVisible; 
  const toggleAllCards = () => { 
    const target = !allVisible; 
    setTrendsVisible(target); 
    setUpcomingVisible(target); 
    setProgressVisible(target); 
    setRecordsVisible(target); 
    
    // Fetch data when showing cards
    if (target) {
      fetchTrends();
      fetchUpcoming();
      fetchProgressSummary();
      // Records are already loaded in loadPage
    }
  }; 
  const hideZeroFormatter = (val: any) => { const n = Number(val); return Number.isFinite(n) && n === 0 ? "" : val; }; 
  
  // Apply column filters to Clients List records
  const filteredRecords = useMemo(() => {
    if (Object.keys(recordsColumnFilters).length === 0) return records;
    
    return records.filter(record => {
      // Check each column filter
      for (const [columnKey, selectedValues] of Object.entries(recordsColumnFilters)) {
        if (selectedValues.size === 0) continue; // No filter for this column
        
        const recordValue = String(record[columnKey] ?? '');
        if (!selectedValues.has(recordValue)) {
          return false; // Record doesn't match this column's filter
        }
      }
      return true; // Record passes all filters
    });
  }, [records, recordsColumnFilters]);
  
  return ( 
    <div className="min-h-screen"> 
      <div className="max-w-[1600px] mx-auto p-4 space-y-4"> 
        <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"> 
          <div className="flex items-center justify-between gap-2"> 
            <div className="flex items-center gap-2"> 
              <img src="/anunathan-logo.png" className="h-16 w-auto" alt="Logo" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} /> 
              <div> 
                <div className="text-lg text-blue-700 font-bold  whitespace-nowrap">Dashboard - Clients Report</div>
                <div className="text-sm font-semibold whitespace-nowrap" style={{ color: "#808000" }}>Build your career. Protect their future</div>
              </div> 
            </div> 
            
            <div className="flex items-center gap-2"> 
  {(() => {
    const successfulClientsCount = statusCounts["status_Successful Client"] || 0;
    const newClientsCount = statusCounts["client_status_New Client"] || 0;
    const latestIssuedDate = records.map(r => r.Issued).filter(Boolean).map(d => new Date(d)).sort((a,b)=>b.getTime()-a.getTime())[0];
     
    const cycleStart = latestIssuedDate ? latestIssuedDate.toLocaleDateString() : "—";
    const cycleEnd = latestIssuedDate ? new Date(latestIssuedDate.getTime() + 30 * 60 * 60 * 1000).toLocaleDateString() : "—";

    const cycleDays = latestIssuedDate ? Math.floor((Date.now()-latestIssuedDate.getTime())/(1000*60*60*24)) : 0;
    const today = new Date().toISOString().split("T")[0];
    const meetingTodayCount = records.filter(r => r.BOP_Date?.startsWith(today) || r.Followup_Date?.startsWith(today)).length;
     
    return (
      <>
        <div className="px-2 py-2 bg-gray-200 text-xs rounded text-center whitespace-nowrap">
          Successful Client👍 {successfulClientsCount}
        </div>
        <div className="px-2 py-2 bg-gray-200 text-xs rounded text-center whitespace-nowrap">
          New Clients✏️ {newClientsCount}
        </div>
        <div className="px-2 py-2 bg-gray-200 text-xs rounded text-center whitespace-nowrap">
          Cycle Start on↪️ {cycleStart}
        </div>
        <div className="px-2 py-2 bg-gray-200 text-xs rounded text-center whitespace-nowrap">
          Cycle End on↩️ {cycleEnd}
        </div>
        <div className="px-2 py-2 bg-gray-200 text-xs rounded text-center whitespace-nowrap">
          Cycle Days🔄 {cycleDays}
        </div>
        <div className="px-2 py-2 bg-gray-200 text-xs rounded text-center whitespace-nowrap">
          Today Meetings📣 {meetingTodayCount}
        </div>
      </>
    );
  })()}
              <Button variant="secondary" onClick={toggleAllCards}>
                <span className="text-xs whitespace-nowrap">{allVisible ? "Hide Cards📦" : "Show Cards🗃️"}</span>
              </Button> 
              <Button variant="secondary" onClick={logout}> 
                <span className="text-xs whitespace-nowrap">Logout ➜</span>
              </Button> 
            </div> 
          </div> 
        </header> 
        {error && (<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>)} 
        {/* --- BEGIN CHANGE: New Client success message --- */}
        {newClientMsg && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 flex items-center justify-between">
            <span>{newClientMsg}</span>
            <button className="ml-4 text-green-500 hover:text-green-800 font-bold" onClick={() => setNewClientMsg(null)}>✕</button>
          </div>
        )}
        {/* --- END CHANGE --- */}
        <Card title="Trends 📊"> 
  <div className="mb-2">
    <Button variant="secondary" onClick={() => {
      const willShow = !trendsVisible;
      setTrendsVisible(willShow);
      if (willShow && monthly12.length === 0) {
        fetchTrends();
      }
    }}>
      {trendsVisible ? "Hide 📊" : "Show 📊"}
    </Button>
  </div>
          {trendsVisible ? ( 
            <> 
              <div className="text-xs font-semibold text-black mb-2">Rolling 12 Months</div> 
              <div className="h-64"> 
                <ResponsiveContainer width="100%" height="100%"> 
                  <BarChart data={monthly12}> 
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} /> 
                    <YAxis allowDecimals={false} /> 
                    <Tooltip /> 
                    <Bar dataKey="calls" fill="#2563eb"> 
                      <LabelList dataKey="calls" position="top" fill="#0f172a" formatter={hideZeroFormatter} /> 
                    </Bar> 
                    <Bar dataKey="bops" fill="#f97316"> 
                      <LabelList dataKey="bops" position="top" fill="#0f172a" formatter={hideZeroFormatter} /> 
                    </Bar> 
                    <Bar dataKey="followups" fill="#10b981"> 
                      <LabelList dataKey="followups" position="top" fill="#0f172a" formatter={hideZeroFormatter} /> 
                    </Bar> 
                  </BarChart> 
                </ResponsiveContainer> 
              </div> 
              {trendLoading && <div className="mt-2 text-xs text-black">Loading…</div>} 
            </> 
          ) : ( 
            <div className="text-sm text-black">Results are hidden.</div> 
          )} 
        </Card> 
        <Card title="Upcoming Meetings📣"> 
          <div className="grid md:grid-cols-5 gap-3 items-end"> 
            <label className="block md:col-span-1"> 
              <div className="text-xs font-semibold text-black mb-1">Start</div> 
              <input type="date" className="w-32 border border-slate-300 px-2 py-1" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} /> 
            </label> 
            <label className="block md:col-span-1"> 
              <div className="text-xs font-semibold text-black mb-1">End</div> 
              <input type="date" className="w-32 border border-slate-300 px-2 py-1" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} /> 
            </label> 
            <div className="flex gap-2 md:col-span-3"> 
              <Button variant="secondary" onClick={() => fetchUpcoming()} disabled={!upcomingVisible}><b>➡️</b></Button> 
              <Button 
                variant="secondary" 
                onClick={() => { 
                  const today = new Date(); 
                  const start = format(today, "yyyy-MM-dd"); 
                  const end = format(addDays(today, 30), "yyyy-MM-dd"); 
                  setRangeStart(start); 
                  setRangeEnd(end); 
                  fetchUpcoming(); 
                }} 
                disabled={upcomingLoading || !upcomingVisible} 
              > 
                {upcomingLoading ? "Refreshing…" : "🔄"} 
              </Button> 
             <Button variant="secondary" onClick={exportUpcomingXlsx} disabled={upcoming.length === 0}>📤</Button> 
             <Button variant="secondary" onClick={() => {
               const willShow = !upcomingVisible;
               setUpcomingVisible(willShow);
               if (willShow && upcoming.length === 0) {
                 fetchUpcoming();
               }
             }}> 
                <span className={upcomingVisible ? "text-black" : undefined}> 
                  {upcomingVisible ? "Hide🗂️" : "Show🗂️"} 
                </span> 
              </Button> 
              <div className="flex items-center gap-2 border border-slate-300 px-2 py-1 bg-white">
                <span className="text-xs font-semibold text-black">Go Page</span>
                <input 
                  type="number" 
                  min={1} 
                  max={upcomingTotalPages} 
                  className="w-16 border border-slate-300 px-2 py-1 text-sm" 
                  value={upcomingPageJump} 
                  onChange={(e) => setUpcomingPageJump(e.target.value)} 
                />
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    const n = Number(upcomingPageJump); 
                    if (!Number.isFinite(n)) return; 
                    const p = Math.min(upcomingTotalPages, Math.max(1, Math.floor(n))); 
                    setUpcomingPage(p - 1); 
                  }} 
                  disabled={!upcomingVisible || upcomingTotalPages <= 1}
                >➡️</Button>
              </div>
              <Button variant="secondary" onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))} disabled={!upcomingVisible || upcomingPageSafe <= 0}>◀️</Button>
              <Button variant="secondary" onClick={() => setUpcomingPage((p) => Math.min(upcomingTotalPages - 1, p + 1))} disabled={!upcomingVisible || upcomingPageSafe >= upcomingTotalPages - 1}>▶️</Button>
            </div> 
          </div> 
          <div className="flex items-center justify-between mb-2 mt-3"> 
            <div className="text-sm text-black">Table supports vertical + horizontal scrolling.</div> 
            <div className="text-xs text-black"> 
              Click headers to sort: <b>Client Name</b>, <b>Created Date</b>, <b>BOP Date</b>, <b>BOP Status</b>, <b>Follow-Up Date</b>, <b>Status</b>. 
            </div> 
          </div> 
          {upcomingVisible && ( 
            <ExcelTableEditable 
              rows={upcomingSlice} 
              savingId={savingId} 
              onUpdate={updateCell} 
              preferredOrder={[ 
                "created_at", "client_status", "first_name", "last_name", "interest_type", "business_opportunities", "wealth_solutions", 
                "CalledOn", "BOP_Date", "BOP_Status", "Followup_Date", "FollowUp_Status", "FNA_Date", "FNA_Status", "Product", "Comment", "Remark", 
                "status", "phone", "email", 
                "spouse_name", "date_of_birth", "children", "city", "state", "profession", "work_details", "immigration_status", 
                "referred_by", "preferred_days", "preferred_time", 
              ]} 
              extraLeftCols={[{ label: "Client Name", sortable: "client", render: (r) => clientName(r) }]} 
              maxHeightClass="max-h-[420px]" 
              sortState={sortUpcoming} 
              onSortChange={(k) => setSortUpcoming((cur) => toggleSort(cur, k))} 
              stickyLeftCount={1} 
              nonEditableKeys={new Set(["spouse_name", "date_of_birth", "children", "city", "work_details"])} 
              viewOnlyPopupKeys={new Set(["work_details"])} 
            /> 
          )} 
          {upcomingVisible && (
            <div className="mt-2 text-xs text-black">
              Page {upcomingPageSafe + 1} of {upcomingTotalPages} • Showing {upcomingSlice.length} of {upcoming.length} records • {UPCOMING_PAGE_SIZE} per page
            </div>
          )} 
        </Card> 
        <Card title="Client Progress Summary📑"> 
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2"> 
            <input className="w-72 border border-slate-300 px-3 py-2" placeholder="Filter by client name..." value={progressFilter} onChange={(e) => { setProgressFilter(e.target.value); setProgressPage(0); }} /> 
            <Button variant="secondary" onClick={() => setProgressVisible(true)} disabled={!progressVisible}>➡️</Button> 
            <Button variant="secondary" onClick={() => { setProgressFilter(""); fetchProgressSummary().then(() => setProgressVisible(true)); }} disabled={progressLoading || !progressVisible}>{progressLoading ? "Loading…" : "🔄"}</Button> 
            <Button variant="secondary" onClick={() => {
              const willShow = !progressVisible;
              setProgressVisible(willShow);
              if (willShow && progressRows.length === 0) {
                fetchProgressSummary();
              }
            }}>{progressVisible ? "Hide🗂️" : "Show🗂️"}</Button> 
            <div className="md:ml-auto flex items-center gap-2"> 
              <div className="flex items-center gap-2 border border-slate-300 px-2 py-1 bg-white">
                <span className="text-xs font-semibold text-black">Go Page</span>
                <input 
                  type="number" 
                  min={1} 
                  max={progressTotalPages} 
                  className="w-16 border border-slate-300 px-2 py-1 text-sm" 
                  value={progressPageJump} 
                  onChange={(e) => setProgressPageJump(e.target.value)} 
                />
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    const n = Number(progressPageJump); 
                    if (!Number.isFinite(n)) return; 
                    const p = Math.min(progressTotalPages, Math.max(1, Math.floor(n))); 
                    setProgressPage(p - 1); 
                  }} 
                  disabled={!progressVisible || progressTotalPages <= 1}
                >➡️</Button>
              </div>
              <Button variant="secondary" onClick={() => setProgressPage((p) => Math.max(0, p - 1))} disabled={!progressVisible || progressPageSafe <= 0}>◀️ Previous</Button> 
              <Button variant="secondary" onClick={() => setProgressPage((p) => Math.min(progressTotalPages - 1, p + 1))} disabled={!progressVisible || progressPageSafe >= progressTotalPages - 1}>Next ▶️</Button> 
            </div> 
          </div> 
          <div className="text-xs text-black mb-2">Click headers to sort.</div> 
          {progressVisible && (<ProgressSummaryTable rows={progressSlice} sortState={progressSort} onSortChange={(k) => setProgressSort((cur) => toggleProgressSort(cur, k))} />)} 
          {progressVisible && (
            <div className="mt-2 text-xs text-black">
              Page {progressPageSafe + 1} of {progressTotalPages} • Showing {progressSlice.length} of {progressFilteredSorted.length} records • {PROGRESS_PAGE_SIZE} per page
            </div>
          )} 
        </Card> 
        <Card title="Clients List 🧑🏻‍🤝‍🧑🏻"> 
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-2"> 
            <div className="flex flex-col md:flex-row md:items-center gap-2 w-full"> 
              <input className="w-80 border border-slate-300 px-3 py-2" placeholder="Search by first name, last name, or phone" value={q} onChange={(e) => setQ(e.target.value)} /> 
              <Button variant="secondary" onClick={() => loadPage(0)} disabled={!recordsVisible}>➡️</Button> 
              <Button variant="secondary" onClick={() => { clearSaveState(); setQ(""); loadPage(0); }} disabled={!recordsVisible}>🔄</Button> 
              <Button variant="secondary" onClick={saveSelectedRecord} disabled={!saveEnabled || batchSaving || !selectedRecordId}>Save</Button> 
              {/* --- BEGIN CHANGE: New Client + Delete buttons --- */}
              <Button variant="secondary" onClick={() => { setNewClientOpen(true); setNewClientError(null); setNewClientForm({ ...NEW_CLIENT_DEFAULTS }); }}>
                <span className="text-xs whitespace-nowrap">+ New Client</span>
              </Button>
              <Button variant="secondary" onClick={() => {
                if (!selectedRecordId) return;
                const row = records.find((r) => String(r.id) === String(selectedRecordId));
                const name = row ? `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() : "";
                setDeleteConfirmName(name);
                setDeleteConfirmId(selectedRecordId);
              }} disabled={!selectedRecordId || batchSaving}>
                <span className="text-xs whitespace-nowrap">Delete 🗑️</span>
              </Button>
              {/* --- END CHANGE --- */}
              <Button variant="secondary" onClick={() => {
                const willShow = !recordsVisible;
                setRecordsVisible(willShow);
                if (willShow && records.length === 0) {
                  loadPage(0);
                }
              }}>{recordsVisible ? "Hide🗂️" : "Show🗂️"}</Button> 
            </div> 
            <div className="flex items-center gap-2"> 
              <div className="flex items-center gap-2 border border-slate-300 px-4 py-3 bg-white"> 
                <span className="text-xs font-semibold text-black">Go Page</span>
                <input type="number" min={1} max={totalPages} className="w-20 border border-slate-300 px-3 py-2 text-sm" value={pageJump} onChange={(e) => setPageJump(e.target.value)} /> 
                <Button variant="secondary" onClick={() => { const n = Number(pageJump); if (!Number.isFinite(n)) return; const p = Math.min(totalPages, Math.max(1, Math.floor(n))); loadPage(p - 1); }} disabled={loading || totalPages <= 1}>➡️</Button> 
              </div> 
              <Button variant="secondary" onClick={() => loadPage(Math.max(0, page - 1))} disabled={!canPrev || loading}>◀️</Button> 
              <Button variant="secondary" onClick={() => loadPage(page + 1)} disabled={!canNext || loading}>▶️</Button> 
            </div> 
          </div> 
          <div className="text-sm text-black mb-2">{total.toLocaleString()} records • showing {ALL_PAGE_SIZE} per page</div> 
   
<div className="flex gap-4 mb-2 text-xs font-semibold text-black">
  <div className="px-3 py-1 text-xs font-bold rounded text-center">Client Status:</div>
  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-[#B1FB17] rounded"></span>New Client {records.filter(r => r.client_status === "New Client").length} / {statusCounts["client_status_New Client"] || 0}</div>
  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-[#728FCE] rounded"></span>Interested {records.filter(r => r.client_status === "Interested").length} / {statusCounts["client_status_Interested"] || 0}</div>
  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-[#ADDFFF] rounded"></span>In-Progress {records.filter(r => r.client_status === "In-Progress").length} / {statusCounts["client_status_In-Progress"] || 0}</div>
  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-[#C9BE62] rounded"></span>On Hold {records.filter(r => r.client_status === "On Hold").length} / {statusCounts["client_status_On Hold"] || 0}</div>
  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-[#E6BF83] rounded"></span>Closed {records.filter(r => r.client_status === "Closed").length} / {statusCounts["client_status_Closed"] || 0}</div>
  <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-[#3CB371] rounded"></span>Policy Issued {records.filter(r => r.client_status === "Policy Issued").length} / {statusCounts["client_status_Policy Issued"] || 0}</div>
</div>

{recordsVisible && ( 
            <> 
              {loading ? ( 
                <div className="text-black">Loading…</div> 
              ) : ( 
                <ExcelTableEditable 
                  rows={filteredRecords} 
                  allRows={records}
                  savingId={savingId} 
                  onUpdate={updateCell} 
                  preferredOrder={[ 
                    "created_at", "client_status", "first_name", "last_name", "interest_type", "business_opportunities", "wealth_solutions", 
                    "CalledOn", "BOP_Date", "BOP_Status", "Followup_Date", "FollowUp_Status", "FNA_Date", "FNA_Status", "Product", "Comment", "Remark", 
                    "status", "phone", "email", 
                    "spouse_name", "date_of_birth", "children", "city", "state", "profession", "work_details", "immigration_status", 
                    "referred_by", "preferred_days", "preferred_time", 
                  ]} 
                  extraLeftCols={[{ label: "Client Name", sortable: "client", render: (r) => clientName(r) }]} 
                  maxHeightClass="max-h-[560px]" 
                  sortState={sortAll} 
                  onSortChange={(k) => setSortAll((cur) => toggleSort(cur, k))} 
                  stickyLeftCount={1} 
                  viewOnlyPopupKeys={new Set()} 
                deferSave={true} 
                  onRowSelect={handleRowSelect} 
                  onPendingChange={handlePendingChange} 
                  resetDraftsToken={resetDraftsToken} 
                  columnFilters={recordsColumnFilters}
                  onColumnFilterChange={(key, values) => {
                    setRecordsColumnFilters(prev => {
                      const next = { ...prev };
                      if (values.size === 0) {
                        delete next[key];
                      } else {
                        next[key] = values;
                      }
                      return next;
                    });
                  }}
                /> 
              )} 
            </> 
          )} 
        </Card> 
        {/* --- BEGIN CHANGE: New Client Modal with multi-select checkboxes --- */}
        {newClientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-blue-700">New Client</h2>
                <button className="text-slate-400 hover:text-slate-700 text-xl font-bold" onClick={() => { setNewClientOpen(false); setNewClientError(null); }}>✕</button>
              </div>
              {newClientError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{newClientError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">First Name <span className="text-red-500">*</span></span>
                  <input type="text" className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.first_name ?? ""} onChange={(e) => setNewClientForm((f: any) => ({ ...f, first_name: e.target.value }))} placeholder="First Name" />
                </label>
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Last Name <span className="text-red-500">*</span></span>
                  <input type="text" className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.last_name ?? ""} onChange={(e) => setNewClientForm((f: any) => ({ ...f, last_name: e.target.value }))} placeholder="Last Name" />
                </label>
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Phone</span>
                  <input type="text" className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.phone ?? ""} onChange={(e) => setNewClientForm((f: any) => ({ ...f, phone: e.target.value }))} />
                </label>
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Email</span>
                  <input type="text" className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.email ?? ""} onChange={(e) => setNewClientForm((f: any) => ({ ...f, email: e.target.value }))} />
                </label>
                {/* Interest Type drives which multi-selects appear below */}
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Interest Type</span>
                  <select className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.interest_type ?? "Both"} onChange={(e) => {
                    const it = e.target.value;
                    setNewClientForm((f: any) => {
                      const opts = getMultiSelectOptions(it);
                      return {
                        ...f,
                        interest_type: it,
                        business_opportunities: opts.business_opportunities.length > 0
                          ? (f.business_opportunities ?? []).filter((v: string) => opts.business_opportunities.includes(v))
                          : [],
                        wealth_solutions: opts.wealth_solutions.length > 0
                          ? (f.wealth_solutions ?? []).filter((v: string) => opts.wealth_solutions.includes(v))
                          : [],
                      };
                    });
                  }}>
                    <option value="Both">Both</option>
                    <option value="Business">Business</option>
                    <option value="Wealth">Wealth</option>
                  </select>
                </label>
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Preferred Time</span>
                  <select className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.preferred_time ?? "PM"} onChange={(e) => setNewClientForm((f: any) => ({ ...f, preferred_time: e.target.value }))}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                </label>
                {/* Business Opportunities — multi-select checkboxes */}
                {newClientMultiOpts.business_opportunities.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-xs font-semibold text-black">Business Opportunities</span>
                    <div className="mt-1 border border-slate-300 rounded p-2 max-h-40 overflow-y-auto grid grid-cols-2 gap-1">
                      {newClientMultiOpts.business_opportunities.map((opt) => {
                        const selected = Array.isArray(newClientForm.business_opportunities) && newClientForm.business_opportunities.includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                            <input type="checkbox" checked={selected} onChange={() => {
                              setNewClientForm((f: any) => {
                                const cur: string[] = Array.isArray(f.business_opportunities) ? [...f.business_opportunities] : [];
                                const next = selected ? cur.filter((v) => v !== opt) : [...cur, opt];
                                return { ...f, business_opportunities: next };
                              });
                            }} className="accent-blue-600" />
                            <span className="select-none">{opt.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Wealth Solutions — multi-select checkboxes */}
                {newClientMultiOpts.wealth_solutions.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-xs font-semibold text-black">Wealth Solutions</span>
                    <div className="mt-1 border border-slate-300 rounded p-2 max-h-40 overflow-y-auto grid grid-cols-2 gap-1">
                      {newClientMultiOpts.wealth_solutions.map((opt) => {
                        const selected = Array.isArray(newClientForm.wealth_solutions) && newClientForm.wealth_solutions.includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                            <input type="checkbox" checked={selected} onChange={() => {
                              setNewClientForm((f: any) => {
                                const cur: string[] = Array.isArray(f.wealth_solutions) ? [...f.wealth_solutions] : [];
                                const next = selected ? cur.filter((v) => v !== opt) : [...cur, opt];
                                return { ...f, wealth_solutions: next };
                              });
                            }} className="accent-blue-600" />
                            <span className="select-none">{opt.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Referred By</span>
                  <input type="text" className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={newClientForm.referred_by ?? ""} onChange={(e) => setNewClientForm((f: any) => ({ ...f, referred_by: e.target.value }))} />
                </label>
                <label className="block col-span-1">
                  <span className="text-xs font-semibold text-black">Preferred Days</span>
                  <input type="text" className="w-full border border-slate-300 px-2 py-1 mt-1 text-sm" value={Array.isArray(newClientForm.preferred_days) ? newClientForm.preferred_days.join(", ") : newClientForm.preferred_days ?? ""} onChange={(e) => setNewClientForm((f: any) => ({ ...f, preferred_days: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) }))} />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 mt-5">
                <Button variant="secondary" onClick={() => { setNewClientOpen(false); setNewClientError(null); }}>Cancel</Button>
                <Button variant="secondary" onClick={createNewClient} disabled={newClientSaving}>
                  {newClientSaving ? "Saving…" : "Save New Client"}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* --- END CHANGE: New Client Modal --- */}
        {/* --- BEGIN CHANGE: Delete Confirmation Modal --- */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-red-600">Confirm Delete</h2>
                <button className="text-slate-400 hover:text-slate-700 text-xl font-bold" onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(""); }}>✕</button>
              </div>
              <p className="text-sm text-black mb-5">
                Are you sure you want to delete client <span className="font-bold">{deleteConfirmName || deleteConfirmId}</span>? This will mark the record as deleted.
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(""); }}>Cancel</Button>
                <button
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-50"
                  onClick={() => softDeleteClient(deleteConfirmId)}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* --- END CHANGE: Delete Confirmation Modal --- */}
      </div> 
    </div> 
  ); 
} 
function ProgressSummaryTable({ rows, sortState, onSortChange }: { rows: Row[]; sortState: { key: ProgressSortKey; dir: SortDir }; onSortChange: (k: ProgressSortKey) => void; }) { 
  const { widths, startResize } = useColumnResizer(); 
  const cols = useMemo(() => [ 
    { id: "client_name", label: "Client Name", key: "client_name" as ProgressSortKey, defaultW: 200 }, 
    { id: "first_name", label: "First Name", defaultW: 120 }, 
    { id: "last_name", label: "Last Name", defaultW: 130 }, 
    { id: "phone", label: "Phone", defaultW: 140 }, 
    { id: "email", label: "Email", defaultW: 280 }, 
    { id: "last_call_date", label: "Called On", key: "last_call_date" as ProgressSortKey, defaultW: 180 }, 
    { id: "call_attempts", label: "No of Calls", key: "call_attempts" as ProgressSortKey, defaultW: 90 }, 
    { id: "last_bop_date", label: "Last/Next BOP Call On", key: "last_bop_date" as ProgressSortKey, defaultW: 200 }, 
    { id: "bop_attempts", label: "No of BOP Calls", key: "bop_attempts" as ProgressSortKey, defaultW: 110 }, 
    { id: "last_followup_date", label: "Last/Next FollowUp On", key: "last_followup_date" as ProgressSortKey, defaultW: 200 }, 
    { id: "followup_attempts", label: "No of FollowUp Calls", key: "followup_attempts" as ProgressSortKey, defaultW: 140 }, 
  ], []); 
  const getW = (id: string, def: number) => widths[id] ?? def; 
  const stickyLeftPx = (colIndex: number) => (colIndex <= 0 ? 0 : 0); 
  const sortIcon = (k?: ProgressSortKey) => { if (!k) return null; if (sortState.key !== k) return <span className="ml-1 text-black">↕</span>; return <span className="ml-1 text-black">{sortState.dir === "asc" ? "↑" : "↓"}</span>; }; 
  const minWidth = cols.reduce((sum, c) => sum + getW(c.id, c.defaultW), 0); 
  
  // Format date as mm/dd/yyyy hh:mm PM/AM (matching Upcoming Meetings format)
  const fmtDate = (v: any) => { 
    if (!v) return "—"; 
    const d = new Date(v); 
    const t = d.getTime(); 
    if (!Number.isFinite(t)) return "—"; 
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`; 
  }; 
  
  // Check if date is in current month
  const isCurrentMonth = (v: any) => {
    if (!v) return false;
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  
  const fmtCount = (v: any) => { const n = Number(v); if (!Number.isFinite(n)) return "—"; return String(n); }; 
  return ( 
    <div className="overflow-auto border border-slate-500 bg-white max-h-[520px]"> 
      <table className="w-full table-fixed border-collapse" style={{ minWidth }}> 
        <thead className="sticky top-0 bg-slate-100 z-20"> 
          <tr className="text-left text-xs font-semibold text-black"> 
            {cols.map((c, idx) => { 
              const w = getW(c.id, c.defaultW); 
              const isSticky = idx === 0; 
              const style: React.CSSProperties = { 
                width: w, minWidth: w, maxWidth: w, position: isSticky ? "sticky" : undefined, left: isSticky ? stickyLeftPx(idx) : undefined, top: 0, zIndex: isSticky ? 40 : 20, background: isSticky ? "#f1f5f9" : undefined, 
              }; 
              return ( 
                <th key={c.id} className="border border-slate-500 px-2 py-2 whitespace-nowrap relative" style={style}> 
                  {"key" in c ? ( 
                    <button className="inline-flex items-center hover:underline" onClick={() => onSortChange((c as any).key!)} type="button"> 
                      {c.label} 
                      {sortIcon((c as any).key)} 
                    </button> 
                  ) : ( 
                    c.label 
                  )} 
                  <div className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none" onMouseDown={(e) => startResize(e, c.id, w)}> 
                    <div className="mx-auto h-full w-px bg-slate-300" /> 
                  </div> 
                </th> 
              ); 
            })} 
          </tr> 
        </thead> 
        <tbody> 
          {rows.map((r, ridx) => ( 
            <tr key={String((r as any).clientid ?? ridx)} className="hover:bg-slate-50"> 
              {cols.map((c, idx) => { 
                const w = getW(c.id, c.defaultW); 
                const isSticky = idx === 0; 
                const style: React.CSSProperties = { 
                  width: w, minWidth: w, maxWidth: w, position: isSticky ? "sticky" : undefined, left: isSticky ? stickyLeftPx(idx) : undefined, zIndex: isSticky ? 10 : 1, background: isSticky ? "#ffffff" : undefined, verticalAlign: "middle", 
                }; 
                let v = "—"; 
                let tdClass = "border border-slate-300 px-2 py-2 whitespace-nowrap"; 
                let highlightCurrentMonth = false;
                
                if (c.id === "client_name") v = String(r.client_name ?? "—"); 
                else if (c.id === "first_name") v = String(r.first_name ?? "—"); 
                else if (c.id === "last_name") v = String(r.last_name ?? "—"); 
                else if (c.id === "phone") v = String(r.phone ?? "—"); 
                else if (c.id === "email") v = String(r.email ?? "—"); 
                else if (c.id === "last_call_date") { 
                  v = fmtDate(r.last_call_date); 
                  highlightCurrentMonth = isCurrentMonth(r.last_call_date);
                } 
                else if (c.id === "call_attempts") { v = fmtCount(r.call_attempts); tdClass += " text-center align-middle"; } 
                else if (c.id === "last_bop_date") { 
                  v = fmtDate(r.last_bop_date); 
                  highlightCurrentMonth = isCurrentMonth(r.last_bop_date);
                } 
                else if (c.id === "bop_attempts") { v = fmtCount(r.bop_attempts); tdClass += " text-center align-middle"; } 
                else if (c.id === "last_followup_date") { 
                  v = fmtDate(r.last_followup_date); 
                  highlightCurrentMonth = isCurrentMonth(r.last_followup_date);
                } 
                else if (c.id === "followup_attempts") { v = fmtCount(r.followup_attempts); tdClass += " text-center align-middle"; } 
                
                if (highlightCurrentMonth) {
                  tdClass += " bg-yellow-100";
                }
                
                return (<td key={c.id} className={`${tdClass} ${isSticky ? "font-semibold text-black" : ""}`} style={style}>{v}</td>); 
              })} 
            </tr> 
          ))} 
        </tbody> 
      </table> 
    </div> 
  ); 
} 
function ExcelTableEditable({ 
  rows, allRows, savingId, onUpdate, extraLeftCols, maxHeightClass, sortState, onSortChange, preferredOrder, stickyLeftCount = 1, nonEditableKeys = new Set<string>(), viewOnlyPopupKeys = new Set<string>(), 
  deferSave = false, onRowSelect, onPendingChange, resetDraftsToken, columnFilters, onColumnFilterChange,
}: { 
  rows: Row[]; allRows?: Row[]; savingId: string | null; onUpdate: (id: string, key: string, value: string) => Promise<void>; 
  extraLeftCols: { label: string; render: (r: Row) => string; sortable?: SortKey }[]; maxHeightClass: string; 
  sortState: { key: SortKey; dir: SortDir }; onSortChange: (key: SortKey) => void; preferredOrder?: string[]; stickyLeftCount?: number; 
  nonEditableKeys?: Set<string>; viewOnlyPopupKeys?: Set<string>;
  deferSave?: boolean;
  onRowSelect?: (id: string) => void;
  onPendingChange?: (id: string, key: string, value: string) => void;
  resetDraftsToken?: number;
  columnFilters?: Record<string, Set<string>>;
  onColumnFilterChange?: (key: string, values: Set<string>) => void;
}) { 
  const { widths, startResize } = useColumnResizer(); 
  const [openCell, setOpenCell] = useState<string | null>(null); 
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  
  const sourceRows = allRows || rows; // Use allRows for filter values if provided
  
  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenFilterKey(null);
    if (openFilterKey) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openFilterKey]);
  
  useEffect(() => {
    if (resetDraftsToken === undefined) return;
    setDrafts({});
    setOpenCell(null);
  }, [resetDraftsToken]); 
  const sortIcon = (k?: SortKey) => { if (!k) return null; if (sortState.key !== k) return <span className="ml-1 text-black">↕</span>; return <span className="ml-1 text-black">{sortState.dir === "asc" ? "↑" : "↓"}</span>; }; 
  const keys = useMemo(() => { 
    if (!rows.length) return [] as string[]; 
    const baseKeys = Object.keys(rows[0]).filter((k) => k !== "id"); 
    if (!preferredOrder || !preferredOrder.length) return baseKeys; 
    const set = new Set(baseKeys); 
    const ordered: string[] = []; 
    for (const k of preferredOrder) if (set.has(k)) ordered.push(k); 
    for (const k of baseKeys) if (!ordered.includes(k)) ordered.push(k); 
    return ordered; 
  }, [rows, preferredOrder]); 
  const WRAP_KEYS = new Set(["referred_by", "Product", "Comment", "Remark", "product", "comment", "remark", "immigration_status", "work_details"]); 
  const SAVE_KEY_NORMALIZE: Record<string, string> = { comment: "Comment", remark: "Remark", product: "Product", Comment: "Comment", Remark: "Remark", Product: "Product", ReferredBy: "referred_by", referredby: "referred_by" }; 
  const columns = useMemo(() => { 
    const extra = extraLeftCols.map((c, i) => ({ id: `extra:${i}`, label: c.label, sortable: c.sortable, kind: "extra" as const, defaultW: c.label.toLowerCase().includes("client") ? 220 : 180 })); 
    const main = keys.map((k) => { 
      const label = labelFor(k); 
      const isDateTime = DATE_TIME_KEYS.has(k); 
      const isDateOnly = DATE_ONLY_KEYS.has(k); 
      const defaultW = k === "created_at" ? 120 : isDateTime ? 180 : isDateOnly ? 130 : k.toLowerCase().includes("email") ? 280 : k.toLowerCase().includes("phone") ? 140 : k.toLowerCase().includes("name") ? 150 : WRAP_KEYS.has(k) || READONLY_LIST_COLS.has(k) ? 260 : 160; 
      const sortable = k === "created_at" ? ("created_at" as SortKey) : k === "BOP_Date" ? ("BOP_Date" as SortKey) : k === "BOP_Status" ? ("BOP_Status" as SortKey) : k === "Followup_Date" ? ("Followup_Date" as SortKey) : k === "status" ? ("status" as SortKey) : k === "CalledOn" ? ("CalledOn" as SortKey) : k === "Issued" ? ("Issued" as SortKey) : undefined; 
      return { id: `col:${k}`, key: k, label, sortable, kind: "data" as const, defaultW }; 
    }); 
    return [...extra, ...main]; 
  }, [extraLeftCols, keys]); 
  const getW = (id: string, def: number) => widths[id] ?? def; 
  const stickyLeftPx = (colIndex: number) => { let left = 0; for (let i = 0; i < colIndex; i++) { const c = (columns as any)[i]; left += getW(c.id, c.defaultW ?? 160); } return left; }; 
  const minWidth = (columns as any).reduce((sum: number, c: any) => sum + getW(c.id, c.defaultW ?? 160), 0); 
  const getCellValueForInput = (r: Row, k: string) => { const isDateTime = DATE_TIME_KEYS.has(k); const isDateOnly = DATE_ONLY_KEYS.has(k); const val = r[k]; if (isDateTime) return toLocalInput(val); if (isDateOnly) return toLocalDateInput(val); return val ?? ""; }; 
  const shouldHighlight = (k: string, r: Row) => HIGHLIGHT_DATE_KEYS.has(k) && dateOnOrAfterToday(r[k]); 
  return ( 
    <div className={`overflow-auto border border-slate-500 bg-white ${maxHeightClass}`}> 
      <table className="w-full table-fixed border-collapse" style={{ minWidth }}> 
        <thead className="sticky top-0 bg-slate-100 z-20"> 
          <tr className="text-left text-xs font-semibold text-black"> 
            {(columns as any).map((c: any, colIndex: number) => { 
              const w = getW(c.id, c.defaultW ?? 160); 
              const isSticky = colIndex < stickyLeftCount; 
              const isTopLeft = isSticky; 
              const style: React.CSSProperties = { width: w, minWidth: w, maxWidth: w, position: isSticky ? "sticky" : undefined, left: isSticky ? stickyLeftPx(colIndex) : undefined, top: 0, zIndex: isTopLeft ? 50 : 20, background: isSticky ? "#f1f5f9" : undefined }; 
              const headerLabel = c.label; 
              const columnKey = c.key as string || c.id;
              const hasFilter = columnFilters && onColumnFilterChange;
              const activeFilter = columnFilters?.[columnKey];
              const isFiltered = !!(activeFilter && activeFilter.size > 0);
              
              // Compute unique values inline (no hook - just a regular computation)
              const uniqueValues: string[] = (() => {
                if (!hasFilter) return [];
                const values = new Set<string>();
                (sourceRows || []).forEach((row: any) => {
                  const val = row[columnKey];
                  if (val !== null && val !== undefined && String(val).trim() !== '') {
                    values.add(String(val));
                  }
                });
                return Array.from(values).sort().slice(0, 100);
              })();
              
              return ( 
                <th key={c.id} className="border border-slate-500 px-2 py-2 whitespace-nowrap relative" style={style}> 
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      {c.sortable ? ( 
                        <button className="inline-flex items-center hover:underline truncate" onClick={() => onSortChange(c.sortable)} type="button"> 
                          {headerLabel} 
                          {sortIcon(c.sortable)} 
                        </button> 
                      ) : ( 
                        <span className="truncate">{headerLabel}</span>
                      )} 
                    </div>
                    {hasFilter && uniqueValues.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterKey(openFilterKey === columnKey ? null : columnKey);
                          }}
                          className={`p-1 hover:bg-slate-200 rounded text-xs ${isFiltered ? 'text-blue-600' : 'text-slate-600'}`}
                          title="Filter"
                        >
                          ▼
                        </button>
                        {openFilterKey === columnKey && (
                          <div 
                            className="absolute top-full right-0 mt-1 bg-white border border-slate-300 shadow-lg rounded z-50 min-w-[200px] max-w-[300px] max-h-[400px] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-2 border-b border-slate-200 sticky top-0 bg-white flex justify-between items-center">
                              <button
                                onClick={() => {
                                  onColumnFilterChange?.(columnKey, new Set<string>());
                                  setOpenFilterKey(null);
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {isFiltered ? 'Clear Filter' : 'Select All'}
                              </button>
                              <button
                                onClick={() => setOpenFilterKey(null)}
                                className="text-xs text-slate-600 hover:text-slate-900"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="p-2">
                              {uniqueValues.map(value => {
                                const isChecked = !isFiltered || !!(activeFilter && activeFilter.has(value));
                                return (
                                  <label key={value} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer text-sm">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const newSet = new Set<string>(activeFilter || new Set<string>());
                                        if (isChecked && isFiltered) {
                                          newSet.delete(value);
                                        } else {
                                          newSet.add(value);
                                        }
                                        onColumnFilterChange?.(columnKey, newSet);
                                      }}
                                      className="cursor-pointer"
                                    />
                                    <span className="truncate">{value}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none" onMouseDown={(e) => startResize(e, c.id, w)}> 
                    <div className="mx-auto h-full w-px bg-slate-300" /> 
                  </div> 
                </th> 
              ); 
            })} 
          </tr> 
        </thead> 
        <tbody> 
          {rows.map((r, ridx) => ( 
            <tr key={String(r.id ?? ridx)} className={`hover:bg-slate-50 ${r.client_status === "New Client" ? "bg-[#B1FB17]" : r.client_status === "Interested" ? "bg-[#728FCE]" : r.client_status === "In-Progress" ? "bg-[#ADDFFF]" : r.client_status === "Closed" ? "bg-[#E6BF83]" : r.client_status === "On Hold" ? "bg-[#C9BE62]" : r.client_status === "Completed" ? "bg-[#3CB371] text-black" : ""}`} onClick={() => onRowSelect?.(String(r.id))}> 
              {(columns as any).map((c: any, colIndex: number) => { 
                const w = getW(c.id, c.defaultW ?? 160); 
                const isSticky = colIndex < stickyLeftCount; 
                const style: React.CSSProperties = { width: w, minWidth: w, maxWidth: w, position: isSticky ? "sticky" : undefined, left: isSticky ? stickyLeftPx(colIndex) : undefined, zIndex: isSticky ? 10 : 1, background: isSticky ? "#ffffff" : undefined }; 
                if (c.kind === "extra") { 
                  const idx = Number(String(c.id).split(":")[1] ?? "0"); 
                  const colDef = extraLeftCols[idx]; 
                  const v = colDef?.render ? colDef.render(r) : ""; 
                  return (<td key={c.id} className={`border border-slate-300 px-2 py-2 whitespace-nowrap font-semibold text-black ${shouldHighlight(c.key as string, r) ? "bg-yellow-200" : ""}`} style={style}>{v}</td>); 
                } 
                const k = c.key as string; 
                if (k === "created_at") { 
                  const d = new Date(r.created_at); 
                  const v = Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(); 
                  return (<td key={c.id} className={`border border-slate-300 px-2 py-2 whitespace-nowrap ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}>{v}</td>); 
                } 
                const cellId = `${r.id}:${k}`; 
                const statusOptions = optionsForKey(k); 
                if (statusOptions) { 
                  const value = drafts[cellId] !== undefined ? drafts[cellId] : String(getCellValueForInput(r, k)); 
                  return ( 
                    <td key={c.id} className={`border border-slate-300 px-2 py-2 ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}> 
                      <select 
                        className="w-full bg-transparent border-0 outline-none text-sm" 
                        value={value ?? ""} 
                        onChange={(e) => {
        const v = e.target.value;
        setDrafts((prev) => ({ ...prev, [cellId]: v }));
        if (deferSave) onPendingChange?.(String(r.id), k, String(v));
      }} 
                        onBlur={() => {
        if (deferSave) return;
        const v = drafts[cellId] ?? value ?? "";
        if (v !== undefined) onUpdate(String(r.id), k, String(v));
      }} 
                        disabled={savingId != null && String(savingId) === String(r.id)} 
                      > 
                        {statusOptions.map((opt, idx) => (<option key={`${k}:${idx}:${opt}`} value={opt}>{opt || "—"}</option>))} 
                      </select> 
                    </td> 
                  ); 
                } 
                // --- BEGIN CHANGE: Make list columns editable ---
                if (READONLY_LIST_COLS.has(k)) { 
                  const cellIdList = `${r.id}:${k}`; 
                  const items = asListItems(r[k]); 
                  const display = items.join(", "); 
                  const showPopup = openCell === cellIdList; 
                  const draftVal = drafts[cellIdList] ?? display;
                  return ( 
                    <td key={c.id} className={`border border-slate-300 px-2 py-2 align-top ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}> 
                      <div className="relative"> 
                        <button type="button" className="w-full text-left text-black whitespace-normal break-words" onClick={() => { setDrafts((prev) => ({ ...prev, [cellIdList]: drafts[cellIdList] ?? display })); setOpenCell((cur) => (cur === cellIdList ? null : cellIdList)); }}>{display || "—"}</button> 
                        {showPopup && ( 
                          <div className="absolute left-0 top-full mt-1 w-80 max-w-[80vw] bg-white border border-slate-500 shadow-xl z-40"> 
                            <div className="px-2 py-1 text-xs font-semibold text-black bg-slate-100 border-b border-slate-300">{labelFor(k)}</div> 
                            <div className="p-2"> 
                              <textarea rows={3} className="w-full border border-slate-300 px-2 py-1 text-sm whitespace-pre-wrap break-words resize-none overflow-auto" value={draftVal} onChange={(e) => setDrafts((prev) => ({ ...prev, [cellIdList]: e.target.value }))} />
                              <div className="text-xs text-slate-500 mt-1 mb-2">Separate multiple values with commas</div>
                              <div className="flex items-center gap-2"> 
                                <Button variant="secondary" onClick={async () => {
                                  const v = drafts[cellIdList] ?? "";
                                  if (deferSave) {
                                    onPendingChange?.(String(r.id), k, String(v));
                                    setOpenCell(null);
                                    setDrafts((prev) => { const next = { ...prev }; delete next[cellIdList]; return next; });
                                    return;
                                  }
                                  await onUpdate(String(r.id), k, String(v));
                                  setOpenCell(null);
                                  setDrafts((prev) => { const next = { ...prev }; delete next[cellIdList]; return next; });
                                }} disabled={savingId != null && String(savingId) === String(r.id)}>Save</Button>
                                <Button variant="secondary" onClick={() => { setOpenCell(null); setDrafts((prev) => { const next = { ...prev }; delete next[cellIdList]; return next; }); }}>Cancel</Button> 
                              </div> 
                            </div> 
                          </div> 
                        )} 
                      </div> 
                    </td> 
                  ); 
                } 
                // --- END CHANGE: Make list columns editable --- 
                if (WRAP_KEYS.has(k) && viewOnlyPopupKeys.has(k)) { 
                  const cellIdView = `${r.id}:${k}`; 
                  const showPopup = openCell === cellIdView; 
                  const baseVal = String(getCellValueForInput(r, k)); 
                  return ( 
                    <td key={c.id} className={`border border-slate-300 px-2 py-2 align-top ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}> 
                      <div className="relative"> 
                        <button type="button" className="w-full text-left text-black whitespace-normal break-words" onClick={() => setOpenCell((cur) => (cur === cellIdView ? null : cellIdView))}>{baseVal || "—"}</button> 
                        {showPopup && ( 
                          <div className="absolute left-0 top-full mt-1 w-80 max-w-[80vw] bg-white border border-slate-500 shadow-xl z-40"> 
                            <div className="px-2 py-1 text-xs font-semibold text-black bg-slate-100 border-b border-slate-300">{labelFor(k)}</div> 
                            <div className="p-2"> 
                              <textarea rows={5} readOnly className="w-full border border-slate-300 px-2 py-1 text-sm whitespace-pre-wrap break-words resize-none overflow-auto bg-slate-50" value={baseVal} /> 
                              <div className="mt-2"><Button variant="secondary" onClick={() => setOpenCell(null)}>Close</Button></div> 
                            </div> 
                          </div> 
                        )} 
                      </div> 
                    </td> 
                  ); 
                } 
                if (nonEditableKeys.has(k)) { 
                  const displayVal = DATE_ONLY_KEYS.has(k) ? (() => { 
                    if (!r[k] || r[k] === null || r[k] === undefined || String(r[k]).trim() === '') return "—";
                    const d = new Date(r[k]); 
                    const timestamp = d.getTime();
                    if (Number.isNaN(timestamp) || timestamp < 0) return "—";
                    const year = d.getFullYear();
                    if (year === 1969 || year === 1970) return "—"; // Reject epoch dates
                    return d.toLocaleDateString(); 
                  })() : String(getCellValueForInput(r, k)) || "—"; 
                  return (<td key={c.id} className={`border border-slate-300 px-2 py-2 whitespace-normal break-words ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}>{displayVal}</td>); 
                } 
                if (WRAP_KEYS.has(k)) { 
                  const cellIdWrap = `${r.id}:${k}`; 
                  const showPopup = openCell === cellIdWrap; 
                  const baseVal = String(getCellValueForInput(r, k)); 
                  return ( 
                    <td key={c.id} className={`border border-slate-300 px-2 py-2 align-top ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}> 
                      <div className="relative"> 
                        <button type="button" className="w-full text-left text-black whitespace-normal break-words" onClick={() => { setDrafts((prev) => ({ ...prev, [cellIdWrap]: drafts[cellIdWrap] ?? baseVal })); setOpenCell((cur) => (cur === cellIdWrap ? null : cellIdWrap)); }}>{baseVal || "—"}</button> 
                        {showPopup && ( 
                          <div className="absolute left-0 top-full mt-1 w-80 max-w-[80vw] bg-white border border-slate-500 shadow-xl z-40"> 
                            <div className="px-2 py-1 text-xs font-semibold text-black bg-slate-100 border-b border-slate-300">{labelFor(k)}</div> 
                            <div className="p-2"> 
                              <textarea rows={5} className="w-full border border-slate-300 px-2 py-1 text-sm whitespace-pre-wrap break-words resize-none overflow-auto" value={drafts[cellIdWrap] ?? ""} onChange={(e) => setDrafts((prev) => ({ ...prev, [cellIdWrap]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.stopPropagation(); } }} /> 
                              <div className="mt-2 flex items-center gap-2"> 
                                <Button
                variant="secondary"
                onClick={async () => {
                  const mappedKey = SAVE_KEY_NORMALIZE[k] ?? k;
                  const v = drafts[cellIdWrap] ?? "";
                  if (deferSave) {
                    onPendingChange?.(String(r.id), mappedKey, String(v));
                    setOpenCell(null);
                    setDrafts((prev) => {
                      const next = { ...prev };
                      delete next[cellIdWrap];
                      return next;
                    });
                    return;
                  }
                  await onUpdate(String(r.id), mappedKey, v);
                  setOpenCell(null);
                  setDrafts((prev) => {
                    const next = { ...prev };
                    delete next[cellIdWrap];
                    return next;
                  });
                }}
                disabled={savingId != null && String(savingId) === String(r.id)}
              >
                Save
              </Button> 
                                <Button variant="secondary" onClick={() => { setOpenCell(null); setDrafts((prev) => { const next = { ...prev }; delete next[cellIdWrap]; return next; }); }}>Cancel</Button> 
                              </div> 
                            </div> 
                          </div> 
                        )} 
                      </div> 
                    </td> 
                  ); 
                } 
                const cellIdInput = `${r.id}:${k}`; 
                const isDateTime = DATE_TIME_KEYS.has(k); 
                const isDateOnly = DATE_ONLY_KEYS.has(k); 
                const value = drafts[cellIdInput] !== undefined ? drafts[cellIdInput] : String(getCellValueForInput(r, k)); 
                const inputType = isDateTime ? "datetime-local" : isDateOnly ? "date" : "text"; 
                return ( 
                  <td key={c.id} className={`border border-slate-300 px-2 py-2 ${shouldHighlight(k, r) ? "bg-yellow-200" : ""}`} style={style}> 
                    <input 
                      type={inputType} 
                      step={isDateTime ? 60 : undefined} 
                      className="w-full bg-transparent border-0 outline-none text-sm" 
                      value={value} 
                      onChange={(e) => {
        const v = e.target.value;
        setDrafts((prev) => ({ ...prev, [cellIdInput]: v }));
        if (deferSave) onPendingChange?.(String(r.id), k, String(v));
      }} 
                      onBlur={() => {
        if (deferSave) return;
        const v = drafts[cellIdInput] ?? value ?? "";
        if (v !== undefined) onUpdate(String(r.id), k, String(v));
      }} 
                      disabled={savingId != null && String(savingId) === String(r.id)} 
                    /> 
                  </td> 
                ); 
              })} 
            </tr> 
          ))} 
        </tbody> 
      </table> 
    </div> 
  ); 
}

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = { headerBg: '#BDD7EE', yellowBg: '#FFFF00', lightYellowBg: '#FFFACD' };

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
  r7_him: boolean; r7_her: boolean; r7_notes: string; r7_present: number; // ESPP/RSU – auto
  // ── REAL ESTATE (USA) – manual projected ───────────────────────────────
  e1_him: boolean; e1_her: boolean; e1_notes: string; e1_present: number; e1_proj: number;
  e2_him: boolean; e2_her: boolean; e2_notes: string; e2_present: number; e2_proj: number;
  e3_him: boolean; e3_her: boolean; e3_notes: string; e3_present: number; e3_proj: number;
  e4_him: boolean; e4_her: boolean; e4_notes: string; e4_present: number; e4_proj: number;
  // ── STOCKS | BUSINESS | INCOME (USA) ───────────────────────────────────
  s1_him: boolean; s1_her: boolean; s1_notes: string; s1_present: number; // Stocks/MFs – auto
  s2_him: boolean; s2_her: boolean; s2_notes: string; s2_present: number; s2_proj: number; // Business – manual
  s3_him: boolean; s3_her: boolean; s3_notes: string; s3_present: number; // Alt Investments – auto
  s4_him: boolean; s4_her: boolean; s4_notes: string; s4_present: number; // CDs – auto
  s5_him: boolean; s5_her: boolean; s5_notes: string; s5_present: number; // Cash in Bank – auto
  s6_him: boolean; s6_her: boolean; s6_notes: string; s6_present: number; // Annual Income – N/A proj
  s7_him: boolean; s7_her: boolean; s7_notes: string; s7_present: number; s7_proj: number; // Annual Savings – manual
  // ── FAMILY PROTECTION & INSURANCE ──────────────────────────────────────
  f1_him: boolean; f1_her: boolean; f1_notes: string; f1_present: number; // Life Ins Work – N/A proj
  f2_him: boolean; f2_her: boolean; f2_notes: string; f2_present: number; f2_proj: number; // Life Ins Outside – manual
  f3_him: boolean; f3_her: boolean; f3_notes: string; f3_present: number; f3_proj: number; // Cash Value LI – manual
  f4_him: boolean; f4_her: boolean; f4_notes: string; // Which Company – N/A both
  f5_him: boolean; f5_her: boolean; f5_notes: string; // STD/LTD – N/A
  f6_him: boolean; f6_her: boolean; f6_notes: string; // LTC Outside – N/A
  f7_him: boolean; f7_her: boolean; f7_notes: string; f7_present: number; // HSA – auto
  f8_him: boolean; f8_her: boolean; f8_notes: string; // Mortgage Prot – N/A
  // ── COLLEGE PLANNING / ESTATE PLANNING ─────────────────────────────────
  c1_c1: boolean; c1_c2: boolean; c1_notes: string; c1_present: number; // 529 Plans – auto
  c2_c1: boolean; c2_c2: boolean; c2_notes: string; // Will & Trust – N/A
  // ── FOREIGN ASSETS ─────────────────────────────────────────────────────
  x1_him: boolean; x1_her: boolean; x1_notes: string; x1_present: number; // Foreign RE – auto
  x2_him: boolean; x2_her: boolean; x2_notes: string; x2_present: number; // Foreign Non-RE – auto
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
  healthcareExpenses: 315000, longTermCare: 0,
  healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS", healthcareNote2: "",
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
  r7_him:false, r7_her:false, r7_notes:"", r7_present:0,
  e1_him:false, e1_her:false, e1_notes:"", e1_present:0, e1_proj:0,
  e2_him:false, e2_her:false, e2_notes:"", e2_present:0, e2_proj:0,
  e3_him:false, e3_her:false, e3_notes:"", e3_present:0, e3_proj:0,
  e4_him:false, e4_her:false, e4_notes:"", e4_present:0, e4_proj:0,
  s1_him:false, s1_her:false, s1_notes:"", s1_present:0,
  s2_him:false, s2_her:false, s2_notes:"", s2_present:0, s2_proj:0,
  s3_him:false, s3_her:false, s3_notes:"", s3_present:0,
  s4_him:false, s4_her:false, s4_notes:"", s4_present:0,
  s5_him:false, s5_her:false, s5_notes:"", s5_present:0,
  s6_him:false, s6_her:false, s6_notes:"", s6_present:0,
  s7_him:false, s7_her:false, s7_notes:"", s7_present:0, s7_proj:0,
  f1_him:false, f1_her:false, f1_notes:"", f1_present:0,
  f2_him:false, f2_her:false, f2_notes:"", f2_present:0, f2_proj:0,
  f3_him:false, f3_her:false, f3_notes:"", f3_present:0, f3_proj:0,
  f4_him:false, f4_her:false, f4_notes:"",
  f5_him:false, f5_her:false, f5_notes:"",
  f6_him:false, f6_her:false, f6_notes:"",
  f7_him:false, f7_her:false, f7_notes:"", f7_present:0,
  f8_him:false, f8_her:false, f8_notes:"",
  c1_c1:false, c1_c2:false, c1_notes:"", c1_present:0,
  c2_c1:false, c2_c2:false, c2_notes:"",
  x1_him:false, x1_her:false, x1_notes:"", x1_present:0,
  x2_him:false, x2_her:false, x2_notes:"", x2_present:0,
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

const CurrencyInput: React.FC<{ value: number; onChange: (v: number) => void; placeholder?: string; className?: string }> =
  ({ value, onChange, placeholder = "$0.00", className = "" }) => {
    const [disp, setDisp] = useState("");
    const [focus, setFocus] = useState(false);
    useEffect(() => { if (!focus) setDisp(value > 0 ? formatCurrency(value) : ""); }, [value, focus]);
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FNAPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<FNAData>(initialData);
  const [assets, setAssets] = useState<AssetsData>(initialAssets);
  const [activeTab, setActiveTab] = useState<'goals' | 'assets'>('goals');
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [cardsExpanded, setCardsExpanded] = useState(false);
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
    const autoRows = [
      assets.r1_present, assets.r4_present, assets.r5_present, assets.r6_present, assets.r7_present,
      assets.s1_present, assets.s3_present, assets.s4_present, assets.s5_present,
      assets.f7_present, assets.c1_present, assets.x1_present, assets.x2_present,
    ].reduce((s, p) => s + autoProj(p), 0);
    const manualRows = [
      assets.e1_proj, assets.e2_proj, assets.e3_proj, assets.e4_proj,
      assets.s2_proj, assets.s7_proj,
      assets.f2_proj, assets.f3_proj,
    ].reduce((s, v) => s + (v || 0), 0);
    return autoRows + manualRows;
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
      healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS",
      plannedRetirementAge: 65, calculatedInterestPercentage: 6,
    }));
    await loadFNAData(clientId);
  };

  const loadFNAData = async (clientId: string) => {
    setLoading(true);
    try {
      const { data: rec, error: re } = await supabase
        .from('fna_records')
        .select('fna_id, analysis_date, spouse_name, dob, notes, planned_retirement_age, calculated_interest_percentage')
        .eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (re) throw re;
      if (!rec) { showMessage('No existing FNA data for this client', 'error'); return; }

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

      if (astRet) {
        // Try new full JSON format first, fall back to legacy columns
        if (astRet.assets_data) {
          setAssets({ ...initialAssets, ...astRet.assets_data });
        } else {
          setAssets(prev => ({
            ...prev,
            r1_him: astRet.current_401k_him || false,
            r1_her: astRet.current_401k_her || false,
            r1_notes: astRet.current_401k_notes || '',
            r1_present: astRet.current_401k_present_value || 0,
          }));
        }
      }
      showMessage('FNA data loaded!', 'success');
    } catch (err: any) {
      showMessage(`Error loading data: ${err.message}`, 'error');
    } finally { setLoading(false); }
  };

  // ── Goals recalculation ───────────────────────────────────────────────────
  useEffect(() => {
    const ytr  = data.currentAge > 0 ? Math.max(0, 65 - data.currentAge) : 0;
    const rYrs = data.currentAge > 0 ? Math.max(0, 85 - data.currentAge) : 0;
    const mri  = data.monthlyIncomeNeeded > 0 && ytr > 0
      ? data.monthlyIncomeNeeded * Math.pow(1.03, ytr) : 0;
    const ari  = mri * 12;
    const tri  = ari * rYrs;
    const ltc  = data.healthcareExpenses * 0.03 * (rYrs * 2);
    const total =
      data.child1CollegeAmount + data.child2CollegeAmount +
      data.child1WeddingAmount + data.child2WeddingAmount +
      tri + data.healthcareExpenses + ltc +
      data.travelBudget + data.vacationHome + data.charity + data.otherGoals +
      data.headstartFund + data.familyLegacy + data.familySupport;
    setData(prev => ({
      ...prev, yearsToRetirement: ytr, retirementYears: rYrs,
      monthlyRetirementIncome: mri, annualRetirementIncome: ari,
      totalRetirementIncome: tri, longTermCare: ltc, totalRequirement: total,
    }));
  }, [
    data.currentAge, data.monthlyIncomeNeeded, data.healthcareExpenses,
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
      // Save full assets as JSON + legacy column for backward compat
      ins.push(supabase.from('fna_ast_retirement').insert({
        fna_id: fnaId,
        current_401k_him: assets.r1_him, current_401k_her: assets.r1_her,
        current_401k_notes: assets.r1_notes, current_401k_present_value: assets.r1_present,
        current_401k_projected_value: autoProj(assets.r1_present),
        assets_data: assets,
      }));

      const results = await Promise.all(ins);
      const errs = results.filter(r => r.error);
      if (errs.length > 0) throw new Error(`Failed to save ${errs.length} record(s)`);
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

  // Projected cell: blue tint, auto-calculated, read-only display
  const AutoProjCell = ({ present }: { present: number }) => {
    const v = autoProj(present);
    return (
      <td className="border border-black px-2 py-1 text-xs text-right font-medium" style={{ backgroundColor: '#EBF5FB' }}>
        {v > 0 ? formatCurrency(v) : <span className="text-gray-400">—</span>}
      </td>
    );
  };

  // Manual projected cell: editable
  const ManualProjCell = ({ value, field }: { value: number; field: keyof AssetsData }) => (
    <td className="border border-black p-0">
      <CurrencyInput value={value} placeholder="$0.00"
        onChange={val => upd(field, val)}
        className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
    </td>
  );

  // N/A projected cell
  const NAProjCell = () => (
    <td className="border border-black px-2 py-1 text-xs text-center text-gray-400 bg-gray-50">N/A</td>
  );

  // ── NoteTd ─────────────────────────────────────────────────────────────────
  // Single-line preview → click → multi-line textarea with word-wrap
  const NoteTd = ({
    value, onChange, placeholder = "Add notes...", colSpan,
  }: { value: string; onChange: (v: string) => void; placeholder?: string; colSpan?: number }) => {
    const [editing, setEditing] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (editing && taRef.current) {
        taRef.current.focus();
        const len = taRef.current.value.length;
        taRef.current.setSelectionRange(len, len);
        // auto-size on open
        taRef.current.style.height = 'auto';
        taRef.current.style.height = taRef.current.scrollHeight + 'px';
      }
    }, [editing]);

    const autoResize = (el: HTMLTextAreaElement) => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };

    return (
      <td
        colSpan={colSpan}
        className="border border-black p-0 align-top"
        style={{ minWidth: 120 }}
      >
        {editing ? (
          <textarea
            ref={taRef}
            value={value}
            onChange={e => { onChange(e.target.value); autoResize(e.target); }}
            onBlur={() => setEditing(false)}
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
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: value ? '#111827' : '#9CA3AF',
            }}
          >
            {value || <span className="italic">{placeholder}</span>}
          </div>
        )}
      </td>
    );
  };

  // Standard HIM/HER + NOTES + PRESENT cells
  const StdCells = ({
    himKey, herKey, notesKey, presentKey,
  }: { himKey: keyof AssetsData; herKey: keyof AssetsData; notesKey: keyof AssetsData; presentKey: keyof AssetsData }) => (
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
        <CurrencyInput value={assets[presentKey] as number} placeholder="$0.00"
          onChange={val => upd(presentKey, val)}
          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
      </td>
    </>
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
  const AssetTHead = ({ projLabel = "PROJECTED VALUE" }: { projLabel?: string }) => (
    <thead>
      <tr style={{ backgroundColor: COLORS.headerBg }}>
        <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
        <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-12">HIM</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-12">HER</th>
        <th className="border border-black px-2 py-1 text-xs font-bold">NOTES</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-36">PRESENT VALUE</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-44">
          {projLabel} @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%)
          {yearsToRetirement > 0 && <span className="block font-normal text-gray-600">for {yearsToRetirement} yrs</span>}
        </th>
      </tr>
    </thead>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-3 py-2 mb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Image src="/anunathan-logo.png" alt="AnuNathan Financial Group" width={44} height={44} className="object-contain" />
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Client Financial Need Analysis</h1>
              <p className="text-xs text-gray-400">Build your career. Protect their future</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={handleToggleAllCards} disabled={loading} className={btnGhost}>
              {loading ? '⏳ Loading…' : cardsExpanded ? '🙈 Hide Cards' : '📊 Show Cards'}
            </button>
            <button onClick={handleClear} className={btnGhost}>🗑 Clear</button>
            <button onClick={handleLogout} className={btnGhost}>Logout ➜</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 pb-6" ref={contentRef}>

        {/* CLIENT INFORMATION */}
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
        </div>

        {/* SAVE BUTTON — below Client Information */}
        <div className="flex items-center justify-end gap-2 mb-3">
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
          {(['goals','assets'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-1.5 rounded font-semibold text-xs transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
              {tab === 'goals' ? '📊 FINANCIAL GOALS & PLANNING' : '💰 ASSETS'}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════ GOALS TAB ═══════════════ */}
        {activeTab === 'goals' && (
          <div className="space-y-3">

            {/* College */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🎓" title="KIDS COLLEGE PLANNING" cardKey="college"
                extra={<a href="https://educationdata.org/average-cost-of-college-by-state#tx" target="_blank" rel="noopener noreferrer" className={btnGhost}>💰 Cost of College</a>} />
              {cardVisibility.college && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">CHILD NAME</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
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
              <CardHeader emoji="💒" title="KIDS WEDDING" cardKey="wedding"
                extra={<a href="https://www.zola.com/expert-advice/whats-the-average-cost-of-a-wedding" target="_blank" rel="noopener noreferrer" className={btnGhost}>💍 Wedding Expenses</a>} />
              {cardVisibility.wedding && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">CHILD NAME</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
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
              <CardHeader emoji="🏖️" title="RETIREMENT PLANNING" cardKey="retirement" />
              {cardVisibility.retirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
                  </tr></thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#5</td>
                      <td className="border border-black px-2 py-1 text-xs">CURRENT AGE</td>
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
                      <td className="border border-black px-2 py-1 text-xs">YEARS TO RETIREMENT (65 - CURRENT AGE)</td>
                      <NoteTd value={data.retirementNote2} onChange={v => setData(p => ({ ...p, retirementNote2: v }))}/>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{data.yearsToRetirement}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#7</td>
                      <td className="border border-black px-2 py-1 text-xs">RETIREMENT YEARS (85 - CURRENT AGE)</td>
                      <NoteTd value={data.retirementNote3} onChange={v => setData(p => ({ ...p, retirementNote3: v }))}/>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{data.retirementYears}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#8</td>
                      <td className="border border-black px-2 py-1 text-xs">MONTHLY INCOME NEEDED (TODAY'S DOLLARS)</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Today's dollars</td>
                      <td className="border border-black p-0"><CurrencyInput value={data.monthlyIncomeNeeded} placeholder="$0.00" onChange={val => setData(p => ({ ...p, monthlyIncomeNeeded: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#9</td>
                      <td className="border border-black px-2 py-1 text-xs">MONTHLY INCOME NEEDED (AT RETIREMENT @ 3%)</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Auto-calculated @ 3% inflation</td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{formatCurrency(data.monthlyRetirementIncome)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#10</td>
                      <td className="border border-black px-2 py-1 text-xs">ANNUAL RETIREMENT INCOME NEEDED</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Monthly × 12</td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{formatCurrency(data.annualRetirementIncome)}</td>
                    </tr>
                    <tr style={{ backgroundColor: COLORS.lightYellowBg }}>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#11</td>
                      <td className="border border-black px-2 py-1 text-xs font-bold">TOTAL RETIREMENT INCOME NEEDED</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Annual × Retirement Years</td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-bold">{formatCurrency(data.totalRetirementIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Healthcare */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏥" title="HEALTHCARE PLANNING" cardKey="healthcare" />
              {cardVisibility.healthcare && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
                  </tr></thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#12</td>
                      <td className="border border-black px-2 py-1 text-xs">HEALTHCARE EXPENSES</td>
                      <NoteTd value={data.healthcareNote1} placeholder="~$315K FOR COUPLE" onChange={v => setData(p => ({ ...p, healthcareNote1: v }))} />
                      <td className="border border-black p-0"><CurrencyInput value={data.healthcareExpenses} placeholder="$315,000.00" onChange={val => setData(p => ({ ...p, healthcareExpenses: val }))} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#13</td>
                      <td className="border border-black px-2 py-1 text-xs">LONG-TERM CARE</td>
                      <NoteTd value={data.healthcareNote2} placeholder="3% of healthcare × years × 2" onChange={v => setData(p => ({ ...p, healthcareNote2: v }))} />
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{formatCurrency(data.longTermCare)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Life Goals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🌟" title="LIFE GOALS" cardKey="lifeGoals" />
              {cardVisibility.lifeGoals && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
                  </tr></thead>
                  <tbody>
                    {[{n:'#14',l:'TRAVEL BUDGET',nf:'travelNotes',nv:data.travelNotes,af:'travelBudget',av:data.travelBudget},
                      {n:'#15',l:'VACATION HOME',nf:'vacationNotes',nv:data.vacationNotes,af:'vacationHome',av:data.vacationHome},
                      {n:'#16',l:'CHARITY / GIVING',nf:'charityNotes',nv:data.charityNotes,af:'charity',av:data.charity},
                      {n:'#17',l:'OTHER GOALS',nf:'otherGoalsNotes',nv:data.otherGoalsNotes,af:'otherGoals',av:data.otherGoals},
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
              <CardHeader emoji="🎁" title="LEGACY PLANNING" cardKey="legacy" />
              {cardVisibility.legacy && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead><tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                    <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
                  </tr></thead>
                  <tbody>
                    {[{n:'#18',l:'HEADSTART FUND FOR GRANDKIDS',nf:'headstartNotes',nv:data.headstartNotes,af:'headstartFund',av:data.headstartFund},
                      {n:'#19',l:'FAMILY LEGACY',nf:'legacyNotes',nv:data.legacyNotes,af:'familyLegacy',av:data.familyLegacy},
                      {n:'#20',l:'FAMILY SUPPORT',nf:'supportNotes',nv:data.supportNotes,af:'familySupport',av:data.familySupport},
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
                <h3 className="text-xs font-bold">💰 TOTAL REQUIREMENT</h3>
                <button onClick={() => toggleCard('totalReq')} className={btnGhost}>{cardVisibility.totalReq ? 'Hide' : 'Show'}</button>
              </div>
              {cardVisibility.totalReq && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <tbody><tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-3 py-2 text-sm font-bold">💰 TOTAL REQUIREMENT</td>
                    <td className="border border-black px-3 py-2 text-right text-base font-bold text-green-700">{formatCurrency(data.totalRequirement)}</td>
                  </tr></tbody>
                </table>
              )}
            </div>

            <div className="bg-black text-white text-center py-1.5 rounded text-xs">⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE</div>
          </div>
        )}

        {/* ════════════════════════════════════════ ASSETS TAB ══════════════ */}
        {activeTab === 'assets' && (
          <div className="space-y-3">

            {/* ── RETIREMENT PLANNING (USA) ──────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏦" title="RETIREMENT PLANNING (USA)" cardKey="assetsRetirement" />
              {cardVisibility.assetsRetirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="PROJECTED VALUE" />
                  <tbody>
                    {/* r1 – 401K auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#1</td>
                      <td className="border border-black px-2 py-1 text-xs">CURRENT 401K | 403B</td>
                      <StdCells himKey="r1_him" herKey="r1_her" notesKey="r1_notes" presentKey="r1_present" />
                      <AutoProjCell present={assets.r1_present} />
                    </tr>
                    {/* r2 – Company Match N/A proj */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#2</td>
                      <td className="border border-black px-2 py-1 text-xs">COMPANY MATCH %</td>
                      <StdCells himKey="r2_him" herKey="r2_her" notesKey="r2_notes" presentKey="r2_present" />
                      <NAProjCell />
                    </tr>
                    {/* r3 – Max Funding N/A proj */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#3</td>
                      <td className="border border-black px-2 py-1 text-xs">ARE YOU MAX FUNDING (~$22.5K)?</td>
                      <StdCells himKey="r3_him" herKey="r3_her" notesKey="r3_notes" presentKey="r3_present" />
                      <NAProjCell />
                    </tr>
                    {/* r4 – Prev 401K auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#4</td>
                      <td className="border border-black px-2 py-1 text-xs">PREVIOUS 401K | ROLLOVER 401K</td>
                      <StdCells himKey="r4_him" herKey="r4_her" notesKey="r4_notes" presentKey="r4_present" />
                      <AutoProjCell present={assets.r4_present} />
                    </tr>
                    {/* r5 – Traditional IRA auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#5</td>
                      <td className="border border-black px-2 py-1 text-xs">TRADITIONAL IRA | SEP-IRA [TAX-DEFERRED]</td>
                      <StdCells himKey="r5_him" herKey="r5_her" notesKey="r5_notes" presentKey="r5_present" />
                      <AutoProjCell present={assets.r5_present} />
                    </tr>
                    {/* r6 – Roth IRA auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#6</td>
                      <td className="border border-black px-2 py-1 text-xs">ROTH IRA | ROTH 401K [TAX-FREE]</td>
                      <StdCells himKey="r6_him" herKey="r6_her" notesKey="r6_notes" presentKey="r6_present" />
                      <AutoProjCell present={assets.r6_present} />
                    </tr>
                    {/* r7 – ESPP/RSU auto */}
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#7</td>
                      <td className="border border-black px-2 py-1 text-xs">ESPP | RSU | ANNUITIES | PENSION</td>
                      <StdCells himKey="r7_him" herKey="r7_her" notesKey="r7_notes" presentKey="r7_present" />
                      <AutoProjCell present={assets.r7_present} />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── REAL ESTATE INVESTMENTS (USA) ──────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏠" title="REAL ESTATE INVESTMENTS (USA)" cardKey="assetsRealEstate" />
              {cardVisibility.assetsRealEstate && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="PROJECTED VALUE" />
                  <tbody>
                    {[
                      {n:'#8', l:'PERSONAL HOME',                   hk:'e1_him' as keyof AssetsData, ek:'e1_her' as keyof AssetsData, nk:'e1_notes' as keyof AssetsData, pk:'e1_present' as keyof AssetsData, pj:'e1_proj' as keyof AssetsData},
                      {n:'#9', l:'REAL ESTATE PROPERTIES | RENTALS', hk:'e2_him' as keyof AssetsData, ek:'e2_her' as keyof AssetsData, nk:'e2_notes' as keyof AssetsData, pk:'e2_present' as keyof AssetsData, pj:'e2_proj' as keyof AssetsData},
                      {n:'#10',l:'REAL ESTATE LAND PARCELS',         hk:'e3_him' as keyof AssetsData, ek:'e3_her' as keyof AssetsData, nk:'e3_notes' as keyof AssetsData, pk:'e3_present' as keyof AssetsData, pj:'e3_proj' as keyof AssetsData},
                      {n:'#11',l:'INHERITANCE IN THE USA',           hk:'e4_him' as keyof AssetsData, ek:'e4_her' as keyof AssetsData, nk:'e4_notes' as keyof AssetsData, pk:'e4_present' as keyof AssetsData, pj:'e4_proj' as keyof AssetsData},
                    ].map(r => (
                      <tr key={r.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{r.n}</td>
                        <td className="border border-black px-2 py-1 text-xs">{r.l}</td>
                        <StdCells himKey={r.hk} herKey={r.ek} notesKey={r.nk} presentKey={r.pk} />
                        <ManualProjCell value={assets[r.pj] as number} field={r.pj} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── STOCKS | BUSINESS | INCOME (USA) ─────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="📈" title="STOCKS | BUSINESS | INCOME (USA)" cardKey="assetsStocks" />
              {cardVisibility.assetsStocks && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="PROJECTED VALUE" />
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#12</td>
                      <td className="border border-black px-2 py-1 text-xs">STOCKS | MFs | BONDS | ETFs (OUTSIDE OF 401K)</td>
                      <StdCells himKey="s1_him" herKey="s1_her" notesKey="s1_notes" presentKey="s1_present" />
                      <AutoProjCell present={assets.s1_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#13</td>
                      <td className="border border-black px-2 py-1 text-xs">DO YOU OWN A BUSINESS?</td>
                      <StdCells himKey="s2_him" herKey="s2_her" notesKey="s2_notes" presentKey="s2_present" />
                      <ManualProjCell value={assets.s2_proj} field="s2_proj" />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#14</td>
                      <td className="border border-black px-2 py-1 text-xs">ALTERNATIVE INVESTMENTS (PRIVATE EQUITY, CROWD FUNDING, ETC.)</td>
                      <StdCells himKey="s3_him" herKey="s3_her" notesKey="s3_notes" presentKey="s3_present" />
                      <AutoProjCell present={assets.s3_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#15</td>
                      <td className="border border-black px-2 py-1 text-xs">CERTIFICATE OF DEPOSITS (BANK CDs)</td>
                      <StdCells himKey="s4_him" herKey="s4_her" notesKey="s4_notes" presentKey="s4_present" />
                      <AutoProjCell present={assets.s4_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#16</td>
                      <td className="border border-black px-2 py-1 text-xs">CASH IN BANK + EMERGENCY FUND</td>
                      <StdCells himKey="s5_him" herKey="s5_her" notesKey="s5_notes" presentKey="s5_present" />
                      <AutoProjCell present={assets.s5_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#17</td>
                      <td className="border border-black px-2 py-1 text-xs">ANNUAL HOUSE-HOLD INCOME</td>
                      <StdCells himKey="s6_him" herKey="s6_her" notesKey="s6_notes" presentKey="s6_present" />
                      <NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#18</td>
                      <td className="border border-black px-2 py-1 text-xs">ANNUAL SAVINGS GOING FORWARD</td>
                      <StdCells himKey="s7_him" herKey="s7_her" notesKey="s7_notes" presentKey="s7_present" />
                      <ManualProjCell value={assets.s7_proj} field="s7_proj" />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── FAMILY PROTECTION & INSURANCE ────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🛡️" title="FAMILY PROTECTION & INSURANCE" cardKey="assetsInsurance" />
              {cardVisibility.assetsInsurance && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-12">HIM</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-12">HER</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">NOTES</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">PRESENT CASH VALUE</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-40">FUTURE LEGACY VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#19</td>
                      <td className="border border-black px-2 py-1 text-xs">LIFE INSURANCE AT WORK</td>
                      <StdCells himKey="f1_him" herKey="f1_her" notesKey="f1_notes" presentKey="f1_present" />
                      <NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#20</td>
                      <td className="border border-black px-2 py-1 text-xs">LIFE INSURANCE OUTSIDE WORK</td>
                      <StdCells himKey="f2_him" herKey="f2_her" notesKey="f2_notes" presentKey="f2_present" />
                      <ManualProjCell value={assets.f2_proj} field="f2_proj" />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#21</td>
                      <td className="border border-black px-2 py-1 text-xs">IS IT CASH VALUE LIFE INSURANCE?</td>
                      <StdCells himKey="f3_him" herKey="f3_her" notesKey="f3_notes" presentKey="f3_present" />
                      <ManualProjCell value={assets.f3_proj} field="f3_proj" />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#22</td>
                      <td className="border border-black px-2 py-1 text-xs">WHICH COMPANY? HOW LONG?</td>
                      <td className="border border-black text-center py-1 w-12"><input type="checkbox" checked={assets.f4_him} className="w-4 h-4" onChange={e => upd('f4_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1 w-12"><input type="checkbox" checked={assets.f4_her} className="w-4 h-4" onChange={e => upd('f4_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f4_notes} onChange={v => upd('f4_notes', v)} />
                      <td className="border border-black px-2 py-1 text-xs text-center text-gray-400 bg-gray-50">N/A</td>
                      <NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#23</td>
                      <td className="border border-black px-2 py-1 text-xs">SHORT TERM | LONG TERM DISABILITY AT WORK</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f5_him} className="w-4 h-4" onChange={e => upd('f5_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f5_her} className="w-4 h-4" onChange={e => upd('f5_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f5_notes} onChange={v => upd('f5_notes', v)} />
                      <NAProjCell /><NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#24</td>
                      <td className="border border-black px-2 py-1 text-xs">LONG TERM CARE OUTSIDE OF WORK</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f6_him} className="w-4 h-4" onChange={e => upd('f6_him', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.f6_her} className="w-4 h-4" onChange={e => upd('f6_her', e.target.checked)} /></td>
                      <NoteTd value={assets.f6_notes} onChange={v => upd('f6_notes', v)} />
                      <NAProjCell /><NAProjCell />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#25</td>
                      <td className="border border-black px-2 py-1 text-xs">HEALTH SAVINGS ACCOUNT (HSA)</td>
                      <StdCells himKey="f7_him" herKey="f7_her" notesKey="f7_notes" presentKey="f7_present" />
                      <AutoProjCell present={assets.f7_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#26</td>
                      <td className="border border-black px-2 py-1 text-xs">MORTGAGE PROTECTION INSURANCE</td>
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
              <CardHeader emoji="🎓" title="COLLEGE PLANNING / ESTATE PLANNING" cardKey="assetsCollege" />
              {cardVisibility.assetsCollege && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-16">CHILD 1</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-16">CHILD 2</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">NOTES</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">PRESENT VALUE</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-40">
                        PROJECTED VALUE @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%)
                        {yearsToRetirement > 0 && <span className="block font-normal text-gray-600">for {yearsToRetirement} yrs</span>}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#27</td>
                      <td className="border border-black px-2 py-1 text-xs">529 PLANS | STATE PRE-PAID PLANS</td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.c1_c1} className="w-4 h-4" onChange={e => upd('c1_c1', e.target.checked)} /></td>
                      <td className="border border-black text-center py-1"><input type="checkbox" checked={assets.c1_c2} className="w-4 h-4" onChange={e => upd('c1_c2', e.target.checked)} /></td>
                      <NoteTd value={assets.c1_notes} onChange={v => upd('c1_notes', v)} />
                      <td className="border border-black p-0"><CurrencyInput value={assets.c1_present} placeholder="$0.00" onChange={val => upd('c1_present', val)} className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" /></td>
                      <AutoProjCell present={assets.c1_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#28</td>
                      <td className="border border-black px-2 py-1 text-xs">WILL &amp; TRUST (ESTATE PLANNING)</td>
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
              <CardHeader emoji="🌏" title="FOREIGN ASSETS (OUTSIDE OF THE USA)" cardKey="assetsForeign" />
              {cardVisibility.assetsForeign && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <AssetTHead projLabel="PROJECTED VALUE" />
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#29</td>
                      <td className="border border-black px-2 py-1 text-xs">REAL ESTATE ASSETS</td>
                      <StdCells himKey="x1_him" herKey="x1_her" notesKey="x1_notes" presentKey="x1_present" />
                      <AutoProjCell present={assets.x1_present} />
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#30</td>
                      <td className="border border-black px-2 py-1 text-xs">NON-REAL ESTATE ASSETS (FIXED DEPOSITS, STOCKS, LOANS, JEWELLERY, INVESTMENTS)</td>
                      <StdCells himKey="x2_him" herKey="x2_her" notesKey="x2_notes" presentKey="x2_present" />
                      <AutoProjCell present={assets.x2_present} />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* ── TOTALS ────────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-xs font-bold">💰 TOTAL ASSETS</h3>
                <button onClick={() => toggleCard('totalAssets')} className={btnGhost}>{cardVisibility.totalAssets ? 'Hide' : 'Show'}</button>
              </div>
              {cardVisibility.totalAssets && (
                <table className="w-full border-2 border-black" style={{ borderCollapse:'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: COLORS.yellowBg }}>
                      <td className="border border-black px-3 py-2 text-sm font-bold">💰 TOTAL ASSETS</td>
                      <td className="border border-black px-3 py-2">
                        <div className="text-right text-sm font-bold text-green-700">Present Value: {formatCurrency(totalPresent)}</div>
                        <div className="text-right text-sm font-bold text-blue-700 mt-0.5">
                          Projected @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%){yearsToRetirement > 0 ? ` for ${yearsToRetirement} yrs` : ''}: {formatCurrency(totalProjected)}
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
            <div className="bg-black text-white text-center py-1.5 rounded text-xs">⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE</div>
          </div>
        )}
      </main>
    </div>
  );
}

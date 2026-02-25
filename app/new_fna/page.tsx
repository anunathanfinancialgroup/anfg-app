"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = {
  headerBg: '#BDD7EE',
  yellowBg: '#FFFF00',
  lightYellowBg: '#FFFACD',
};

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  spouse_name: string;
  city: string;
  state: string;
  date_of_birth: string;
}

interface FNAData {
  fnaId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  spouseName: string;
  city: string;
  state: string;
  clientDob: string;
  analysisDate: string;

  // NEW FIELDS
  dob: string;
  notes: string;
  plannedRetirementAge: number;
  calculatedInterestPercentage: number;

  child1CollegeName: string;
  child1CollegeNotes: string;
  child1CollegeAmount: number;
  child2CollegeName: string;
  child2CollegeNotes: string;
  child2CollegeAmount: number;

  child1WeddingNotes: string;
  child1WeddingAmount: number;
  child2WeddingNotes: string;
  child2WeddingAmount: number;

  currentAge: number;
  yearsToRetirement: number;
  retirementYears: number;
  monthlyIncomeNeeded: number;
  monthlyRetirementIncome: number;
  annualRetirementIncome: number;
  totalRetirementIncome: number;
  retirementNote1: string;
  retirementNote2: string;
  retirementNote3: string;

  healthcareExpenses: number;
  longTermCare: number;
  healthcareNote1: string;
  healthcareNote2: string;

  travelBudget: number;
  travelNotes: string;
  vacationHome: number;
  vacationNotes: string;
  charity: number;
  charityNotes: string;
  otherGoals: number;
  otherGoalsNotes: string;

  headstartFund: number;
  headstartNotes: string;
  familyLegacy: number;
  legacyNotes: string;
  familySupport: number;
  supportNotes: string;

  totalRequirement: number;
}

interface AssetsData {
  ret1_him: boolean;
  ret1_her: boolean;
  ret1_notes: string;
  ret1_present: number;
  ret1_projected: number;
  totalPresent: number;
  totalProjected: number;
}

interface CardVisibility {
  clientInfo: boolean;
  college: boolean;
  wedding: boolean;
  retirement: boolean;
  healthcare: boolean;
  lifeGoals: boolean;
  legacy: boolean;
  totalReq: boolean;
  assetsRetirement: boolean;
  totalAssets: boolean;
}

const initialData: FNAData = {
  clientId: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  spouseName: "",
  city: "",
  state: "",
  clientDob: "",
  analysisDate: new Date().toISOString().split('T')[0],
  dob: "",
  notes: "",
  plannedRetirementAge: 65,
  calculatedInterestPercentage: 6,
  child1CollegeName: "",
  child1CollegeNotes: "",
  child1CollegeAmount: 0,
  child2CollegeName: "",
  child2CollegeNotes: "",
  child2CollegeAmount: 0,
  child1WeddingNotes: "",
  child1WeddingAmount: 0,
  child2WeddingNotes: "",
  child2WeddingAmount: 0,
  currentAge: 0,
  yearsToRetirement: 0,
  retirementYears: 0,
  monthlyIncomeNeeded: 0,
  monthlyRetirementIncome: 0,
  annualRetirementIncome: 0,
  totalRetirementIncome: 0,
  retirementNote1: "",
  retirementNote2: "",
  retirementNote3: "",
  healthcareExpenses: 315000,
  longTermCare: 0,
  healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS",
  healthcareNote2: "",
  travelBudget: 0,
  travelNotes: "",
  vacationHome: 0,
  vacationNotes: "",
  charity: 0,
  charityNotes: "",
  otherGoals: 0,
  otherGoalsNotes: "",
  headstartFund: 0,
  headstartNotes: "",
  familyLegacy: 0,
  legacyNotes: "",
  familySupport: 0,
  supportNotes: "",
  totalRequirement: 0
};

const initialAssets: AssetsData = {
  ret1_him: false,
  ret1_her: false,
  ret1_notes: "",
  ret1_present: 0,
  ret1_projected: 0,
  totalPresent: 0,
  totalProjected: 0
};

const formatCurrency = (value: number): string => {
  if (value === 0) return "";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const CurrencyInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "$0.00", className = "" }) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value) : "");
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setDisplayValue(value > 0 ? value.toString() : "");
    setTimeout(() => e.target.select(), 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(displayValue.replace(/[^0-9.-]/g, '')) || 0;
    onChange(numValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value.replace(/[^0-9.-]/g, ''));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
      e.key === 'Escape' || e.key === 'Enter' || e.key === '.' || e.key === '-' ||
      e.key === 'ArrowLeft' || e.key === 'ArrowRight' || (e.key >= '0' && e.key <= '9')
    ) return;
    if (!e.ctrlKey && !e.metaKey) e.preventDefault();
  };

  return (
    <input type="text" value={displayValue} onChange={handleChange}
      onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown}
      placeholder={placeholder} className={className} />
  );
};

// ── Shared button style constants ─────────────────────────────────────────────
const btnOutline = "px-2.5 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors";
const btnBlue    = "px-3 py-1.5 text-xs font-semibold rounded border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm";

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

  const [cardVisibility, setCardVisibility] = useState<CardVisibility>({
    clientInfo: true, college: false, wedding: false, retirement: false,
    healthcare: false, lifeGoals: false, legacy: false, totalReq: false,
    assetsRetirement: false, totalAssets: false,
  });

  useEffect(() => {
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('canfs_auth='));
    if (!authCookie) router.push('/');
    else loadClients();
  }, [router]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data: clientData, error } = await supabase
        .from('client_registrations')
        .select('id, first_name, last_name, phone, email, spouse_name, city, state, date_of_birth')
        .order('first_name', { ascending: true });
      if (error) throw error;
      setClients(clientData || []);
    } catch {
      showMessage('Error loading clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = async (clientId: string) => {
    if (!clientId) { setData(initialData); setAssets(initialAssets); return; }
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setData(prev => ({
      ...initialData,
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      clientPhone: client.phone || '',
      clientEmail: client.email || '',
      spouseName: client.spouse_name || '',
      city: client.city || '',
      state: client.state || '',
      clientDob: client.date_of_birth || '',
      analysisDate: new Date().toISOString().split('T')[0],
      healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS",
      plannedRetirementAge: 65,
      calculatedInterestPercentage: 6,
    }));
    await loadFNAData(clientId);
  };

  const loadFNAData = async (clientId: string) => {
    setLoading(true);
    try {
      const { data: fnaRecord, error: fnaError } = await supabase
        .from('fna_records')
        .select('fna_id, analysis_date, spouse_name, dob, notes, planned_retirement_age, calculated_interest_percentage')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      if (fnaError) throw fnaError;
      if (!fnaRecord) { showMessage('No existing FNA data for this client', 'error'); return; }

      const fnaId = fnaRecord.fna_id;
      const [
        { data: collegeData }, { data: weddingData }, { data: retirementData },
        { data: healthcareData }, { data: lifeGoalsData }, { data: legacyData },
        { data: assetsRetirementData }
      ] = await Promise.all([
        supabase.from('fna_college').select('*').eq('fna_id', fnaId),
        supabase.from('fna_wedding').select('*').eq('fna_id', fnaId),
        supabase.from('fna_retirement').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_healthcare').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_life_goals').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_legacy').select('*').eq('fna_id', fnaId).maybeSingle(),
        supabase.from('fna_ast_retirement').select('*').eq('fna_id', fnaId).maybeSingle()
      ]);

      const child1College = collegeData?.find((c: any) => c.child_number === 1);
      const child2College = collegeData?.find((c: any) => c.child_number === 2);
      const child1Wedding = weddingData?.find((w: any) => w.child_number === 1);
      const child2Wedding = weddingData?.find((w: any) => w.child_number === 2);

      setData(prev => ({
        ...prev, fnaId,
        spouseName: fnaRecord.spouse_name || prev.spouseName,
        analysisDate: fnaRecord.analysis_date || prev.analysisDate,
        dob: fnaRecord.dob || '',
        notes: fnaRecord.notes || '',
        plannedRetirementAge: fnaRecord.planned_retirement_age || 65,
        calculatedInterestPercentage: fnaRecord.calculated_interest_percentage || 6,
        child1CollegeName: child1College?.child_name || '',
        child1CollegeNotes: child1College?.notes || '',
        child1CollegeAmount: child1College?.amount || 0,
        child2CollegeName: child2College?.child_name || '',
        child2CollegeNotes: child2College?.notes || '',
        child2CollegeAmount: child2College?.amount || 0,
        child1WeddingNotes: child1Wedding?.notes || '',
        child1WeddingAmount: child1Wedding?.amount || 0,
        child2WeddingNotes: child2Wedding?.notes || '',
        child2WeddingAmount: child2Wedding?.amount || 0,
        currentAge: retirementData?.current_age || 0,
        monthlyIncomeNeeded: retirementData?.monthly_income_needed || 0,
        healthcareExpenses: healthcareData?.healthcare_expenses || 315000,
        travelBudget: lifeGoalsData?.travel_budget || 0,
        vacationHome: lifeGoalsData?.vacation_home || 0,
        charity: lifeGoalsData?.charity || 0,
        otherGoals: lifeGoalsData?.other_goals || 0,
        headstartFund: legacyData?.headstart_fund || 0,
        familyLegacy: legacyData?.family_legacy || 0,
        familySupport: legacyData?.family_support || 0,
      }));

      if (assetsRetirementData) {
        setAssets({
          ret1_him: assetsRetirementData.current_401k_him || false,
          ret1_her: assetsRetirementData.current_401k_her || false,
          ret1_notes: assetsRetirementData.current_401k_notes || '',
          ret1_present: assetsRetirementData.current_401k_present_value || 0,
          ret1_projected: assetsRetirementData.current_401k_projected_value || 0,
          totalPresent: assetsRetirementData.current_401k_present_value || 0,
          totalProjected: assetsRetirementData.current_401k_projected_value || 0,
        });
      }
      showMessage('FNA data loaded successfully!', 'success');
    } catch (error: any) {
      console.error('Load error:', error);
      showMessage(`Error loading data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-recalculate projected value
  useEffect(() => {
    if (assets.ret1_present > 0 && data.currentAge > 0 && data.plannedRetirementAge > 0) {
      const years = Math.max(0, data.plannedRetirementAge - data.currentAge);
      const rate  = data.calculatedInterestPercentage / 100;
      const projected = assets.ret1_present * Math.pow(1 + rate, years);
      setAssets(prev => ({ ...prev, ret1_projected: projected, totalProjected: projected }));
    }
  }, [data.calculatedInterestPercentage, data.currentAge, data.plannedRetirementAge, assets.ret1_present]);

  useEffect(() => {
    const ytr = data.currentAge > 0 ? Math.max(0, 65 - data.currentAge) : 0;
    const rYrs = data.currentAge > 0 ? Math.max(0, 85 - data.currentAge) : 0;
    const mri = data.monthlyIncomeNeeded > 0 && ytr > 0
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
      ...prev,
      yearsToRetirement: ytr, retirementYears: rYrs,
      monthlyRetirementIncome: mri, annualRetirementIncome: ari,
      totalRetirementIncome: tri, longTermCare: ltc, totalRequirement: total
    }));
  }, [
    data.currentAge, data.monthlyIncomeNeeded, data.healthcareExpenses,
    data.child1CollegeAmount, data.child2CollegeAmount,
    data.child1WeddingAmount, data.child2WeddingAmount,
    data.travelBudget, data.vacationHome, data.charity, data.otherGoals,
    data.headstartFund, data.familyLegacy, data.familySupport
  ]);

  const handleSave = async () => {
    if (!data.clientId) { showMessage("Please select a client first", 'error'); return; }
    setSaving(true);
    try {
      let fnaId = data.fnaId;
      if (!fnaId) {
        const { data: fnaRecord, error: fnaError } = await supabase
          .from('fna_records')
          .insert([{
            client_id: data.clientId,
            analysis_date: data.analysisDate,
            spouse_name: data.spouseName,
            dob: data.dob || null,
            notes: data.notes || null,
            planned_retirement_age: data.plannedRetirementAge,
            calculated_interest_percentage: data.calculatedInterestPercentage,
          }]).select().single();
        if (fnaError) throw fnaError;
        fnaId = fnaRecord.fna_id;
        setData(prev => ({ ...prev, fnaId }));
      } else {
        const { error: updateError } = await supabase.from('fna_records').update({
          analysis_date: data.analysisDate,
          spouse_name: data.spouseName,
          dob: data.dob || null,
          notes: data.notes || null,
          planned_retirement_age: data.plannedRetirementAge,
          calculated_interest_percentage: data.calculatedInterestPercentage,
          updated_at: new Date().toISOString()
        }).eq('fna_id', fnaId);
        if (updateError) throw updateError;
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

      const ins = [];
      if (data.child1CollegeName || data.child1CollegeAmount > 0)
        ins.push(supabase.from('fna_college').insert({ fna_id: fnaId, child_number: 1, child_name: data.child1CollegeName || '', notes: data.child1CollegeNotes || '', amount: data.child1CollegeAmount || 0 }));
      if (data.child2CollegeName || data.child2CollegeAmount > 0)
        ins.push(supabase.from('fna_college').insert({ fna_id: fnaId, child_number: 2, child_name: data.child2CollegeName || '', notes: data.child2CollegeNotes || '', amount: data.child2CollegeAmount || 0 }));
      if (data.child1WeddingAmount > 0)
        ins.push(supabase.from('fna_wedding').insert({ fna_id: fnaId, child_number: 1, child_name: data.child1CollegeName || '', notes: data.child1WeddingNotes || '', amount: data.child1WeddingAmount || 0 }));
      if (data.child2WeddingAmount > 0)
        ins.push(supabase.from('fna_wedding').insert({ fna_id: fnaId, child_number: 2, child_name: data.child2CollegeName || '', notes: data.child2WeddingNotes || '', amount: data.child2WeddingAmount || 0 }));
      ins.push(supabase.from('fna_retirement').insert({ fna_id: fnaId, current_age: data.currentAge || 0, monthly_income_needed: data.monthlyIncomeNeeded || 0 }));
      ins.push(supabase.from('fna_healthcare').insert({ fna_id: fnaId, healthcare_expenses: data.healthcareExpenses || 0 }));
      ins.push(supabase.from('fna_life_goals').insert({ fna_id: fnaId, travel_budget: data.travelBudget || 0, vacation_home: data.vacationHome || 0, charity: data.charity || 0, other_goals: data.otherGoals || 0 }));
      ins.push(supabase.from('fna_legacy').insert({ fna_id: fnaId, headstart_fund: data.headstartFund || 0, family_legacy: data.familyLegacy || 0, family_support: data.familySupport || 0 }));
      ins.push(supabase.from('fna_ast_retirement').insert({ fna_id: fnaId, current_401k_him: assets.ret1_him || false, current_401k_her: assets.ret1_her || false, current_401k_notes: assets.ret1_notes || '', current_401k_present_value: assets.ret1_present || 0, current_401k_projected_value: assets.ret1_projected || 0 }));

      const results = await Promise.all(ins);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(`Failed to save ${errors.length} record(s)`);
      showMessage('✅ FNA saved successfully!', 'success');
    } catch (error: any) {
      showMessage(`❌ Save failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleLogout = () => {
    document.cookie = "canfs_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  const handleClear = () => {
    if (confirm('Clear all data? This will reset the form except Client Information.')) {
      setData(prev => ({
        ...initialData,
        clientId: prev.clientId, clientName: prev.clientName,
        clientPhone: prev.clientPhone, clientEmail: prev.clientEmail,
        spouseName: prev.spouseName, city: prev.city, state: prev.state,
        clientDob: prev.clientDob, analysisDate: prev.analysisDate,
        dob: prev.dob, notes: prev.notes,
        plannedRetirementAge: prev.plannedRetirementAge,
        calculatedInterestPercentage: prev.calculatedInterestPercentage,
        healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS"
      }));
      setAssets(initialAssets);
      showMessage("Form cleared (Client Information retained)", 'success');
    }
  };

  // Show all cards; if a client is selected, refresh its data too
  const handleShowAllCards = async () => {
    setCardVisibility({
      clientInfo: true, college: true, wedding: true, retirement: true,
      healthcare: true, lifeGoals: true, legacy: true, totalReq: true,
      assetsRetirement: true, totalAssets: true,
    });
    if (data.clientId) {
      await loadFNAData(data.clientId);
    }
  };

  const toggleCard = (card: keyof CardVisibility) => {
    setCardVisibility(prev => ({ ...prev, [card]: !prev[card] }));
  };

  // ── Reusable card header ───────────────────────────────────────────────────
  const CardHeader = ({
    emoji, title, cardKey, extra
  }: { emoji: string; title: string; cardKey: keyof CardVisibility; extra?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.headerBg }}>
          {emoji} {title}
        </h3>
        <button onClick={() => toggleCard(cardKey)} className={btnOutline}>
          {cardVisibility[cardKey] ? 'Hide' : 'Show'}
        </button>
      </div>
      {extra}
    </div>
  );

  // ── Shared table header row ────────────────────────────────────────────────
  const TableHead4 = ({ col2 = "DESCRIPTION" }: { col2?: string }) => (
    <thead>
      <tr style={{ backgroundColor: COLORS.headerBg }}>
        <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
        <th className="border border-black px-2 py-1 text-xs font-bold">{col2}</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
        <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
      </tr>
    </thead>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-3 py-2 mb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Logo + Title */}
          <div className="flex items-center gap-2">
            <Image src="/anunathan-logo.png" alt="AnuNathan Financial Group"
              width={44} height={44} className="object-contain" />
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                Client Financial Need Analysis
              </h1>
              <p className="text-xs text-gray-400">Build your career. Protect their future</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={handleShowAllCards} disabled={loading} className={btnOutline}>
              📊 {loading ? 'Loading…' : 'Show Cards'}
            </button>
            <button onClick={handleClear} className={btnOutline}>
              🗑 Clear
            </button>
            <button onClick={handleSave} disabled={saving || loading || !data.clientId} className={btnBlue}>
              {saving ? '💾 Saving…' : '💾 Save FNA'}
            </button>
            <button onClick={handleLogout} className={btnOutline}>
              Logout ➜
            </button>

            {message && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                messageType === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>{message}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 pb-6" ref={contentRef}>

        {/* ── CLIENT INFORMATION ──────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
          <h3 className="text-xs font-bold text-gray-800 mb-2 pb-1 border-b">📋 Client Information</h3>

          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Client Name *</label>
              <select value={data.clientId} onChange={(e) => handleClientSelect(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none">
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Phone Number</label>
              <input type="text" value={data.clientPhone} readOnly
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Email</label>
              <input type="text" value={data.clientEmail} readOnly
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Spouse Name</label>
              <input type="text" value={data.spouseName}
                onChange={(e) => setData(prev => ({ ...prev, spouseName: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">City</label>
              <input type="text" value={data.city} readOnly
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">State</label>
              <input type="text" value={data.state} readOnly
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Analysis Date</label>
              <input type="date" value={data.analysisDate}
                onChange={(e) => setData(prev => ({ ...prev, analysisDate: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          {/* Row 3 – NEW FIELDS */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Date of Birth</label>
              <input type="date" value={data.dob}
                onChange={(e) => setData(prev => ({ ...prev, dob: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Planned Retirement Age</label>
              <select value={data.plannedRetirementAge}
                onChange={(e) => setData(prev => ({ ...prev, plannedRetirementAge: parseInt(e.target.value) || 65 }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none">
                {Array.from({ length: 58 }, (_, i) => i + 50).map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Interest% to calculate</label>
              <select value={data.calculatedInterestPercentage}
                onChange={(e) => setData(prev => ({ ...prev, calculatedInterestPercentage: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none">
                {[3,4,5,6,7,8,9,10,11,12,13,14,15].map(p => (
                  <option key={p} value={p}>{p}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">Note</label>
              <input type="text" value={data.notes}
                onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes..."
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* ── TAB BUTTONS ─────────────────────────────────────────────────── */}
        <div className="mb-3 flex gap-2">
          <button onClick={() => setActiveTab('goals')}
            className={`flex-1 px-3 py-1.5 rounded font-semibold text-xs transition-all ${
              activeTab === 'goals'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}>
            📊 FINANCIAL GOALS &amp; PLANNING
          </button>
          <button onClick={() => setActiveTab('assets')}
            className={`flex-1 px-3 py-1.5 rounded font-semibold text-xs transition-all ${
              activeTab === 'assets'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}>
            💰 ASSETS
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            GOALS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'goals' && (
          <div className="space-y-3">

            {/* College */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🎓" title="KIDS COLLEGE PLANNING" cardKey="college"
                extra={
                  <a href="https://educationdata.org/average-cost-of-college-by-state#tx"
                    target="_blank" rel="noopener noreferrer" className={btnOutline}>
                    💰 Cost of College
                  </a>
                }
              />
              {cardVisibility.college && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">CHILD NAME</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { n:'#1', nameFld:'child1CollegeName', name:data.child1CollegeName, notesFld:'child1CollegeNotes', notes:data.child1CollegeNotes, amtFld:'child1CollegeAmount', amt:data.child1CollegeAmount },
                      { n:'#2', nameFld:'child2CollegeName', name:data.child2CollegeName, notesFld:'child2CollegeNotes', notes:data.child2CollegeNotes, amtFld:'child2CollegeAmount', amt:data.child2CollegeAmount },
                    ].map(row => (
                      <tr key={row.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{row.n}</td>
                        <td className="border border-black p-0">
                          <input type="text" value={row.name} placeholder="Enter child's name"
                            onChange={(e) => setData(prev => ({ ...prev, [row.nameFld]: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
                        <td className="border border-black p-0">
                          <input type="text" value={row.notes} placeholder="Add notes..."
                            onChange={(e) => setData(prev => ({ ...prev, [row.notesFld]: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
                        <td className="border border-black p-0">
                          <CurrencyInput value={row.amt} placeholder="$0.00"
                            onChange={(val) => setData(prev => ({ ...prev, [row.amtFld]: val }))}
                            className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Wedding */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="💒" title="KIDS WEDDING" cardKey="wedding"
                extra={
                  <a href="https://www.zola.com/expert-advice/whats-the-average-cost-of-a-wedding"
                    target="_blank" rel="noopener noreferrer" className={btnOutline}>
                    💍 Wedding Expenses
                  </a>
                }
              />
              {cardVisibility.wedding && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">CHILD NAME</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-44">NOTES</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { n:'#3', label: data.child1CollegeName || '(From College #1)', notesFld:'child1WeddingNotes', notes:data.child1WeddingNotes, amtFld:'child1WeddingAmount', amt:data.child1WeddingAmount },
                      { n:'#4', label: data.child2CollegeName || '(From College #2)', notesFld:'child2WeddingNotes', notes:data.child2WeddingNotes, amtFld:'child2WeddingAmount', amt:data.child2WeddingAmount },
                    ].map(row => (
                      <tr key={row.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{row.n}</td>
                        <td className="border border-black px-2 py-1 text-xs bg-gray-50">{row.label}</td>
                        <td className="border border-black p-0">
                          <input type="text" value={row.notes} placeholder="Add notes..."
                            onChange={(e) => setData(prev => ({ ...prev, [row.notesFld]: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
                        <td className="border border-black p-0">
                          <CurrencyInput value={row.amt} placeholder="$0.00"
                            onChange={(val) => setData(prev => ({ ...prev, [row.amtFld]: val }))}
                            className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
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
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <TableHead4 />
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#5</td>
                      <td className="border border-black px-2 py-1 text-xs">CURRENT AGE</td>
                      <td className="border border-black p-0">
                        <input type="text" value={data.retirementNote1} placeholder="Add notes..."
                          onChange={(e) => setData(prev => ({ ...prev, retirementNote1: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                      <td className="border border-black p-0">
                        <select value={data.currentAge || ''}
                          onChange={(e) => setData(prev => ({ ...prev, currentAge: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300">
                          <option value="">Select Age</option>
                          {Array.from({ length: 120 }, (_, i) => i + 1).map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#6</td>
                      <td className="border border-black px-2 py-1 text-xs">YEARS TO RETIREMENT (65 - CURRENT AGE)</td>
                      <td className="border border-black p-0">
                        <input type="text" value={data.retirementNote2} placeholder="Add notes..."
                          onChange={(e) => setData(prev => ({ ...prev, retirementNote2: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{data.yearsToRetirement}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#7</td>
                      <td className="border border-black px-2 py-1 text-xs">RETIREMENT YEARS (85 - CURRENT AGE)</td>
                      <td className="border border-black p-0">
                        <input type="text" value={data.retirementNote3} placeholder="Add notes..."
                          onChange={(e) => setData(prev => ({ ...prev, retirementNote3: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                      <td className="border border-black px-2 py-1 text-xs text-right font-semibold bg-gray-100">{data.retirementYears}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#8</td>
                      <td className="border border-black px-2 py-1 text-xs">MONTHLY INCOME NEEDED (TODAY'S DOLLARS)</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Today's dollars</td>
                      <td className="border border-black p-0">
                        <CurrencyInput value={data.monthlyIncomeNeeded} placeholder="$0.00"
                          onChange={(val) => setData(prev => ({ ...prev, monthlyIncomeNeeded: val }))}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#9</td>
                      <td className="border border-black px-2 py-1 text-xs">MONTHLY INCOME NEEDED (AT RETIREMENT @ 3%)</td>
                      <td className="border border-black px-2 py-1 text-xs text-gray-400 italic">Auto-calculated with 3% inflation</td>
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
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <TableHead4 />
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#12</td>
                      <td className="border border-black px-2 py-1 text-xs">HEALTHCARE EXPENSES</td>
                      <td className="border border-black p-0">
                        <input type="text" value={data.healthcareNote1}
                          placeholder="~$315K FOR COUPLE IN TODAY'S DOLLARS"
                          onChange={(e) => setData(prev => ({ ...prev, healthcareNote1: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput value={data.healthcareExpenses} placeholder="$315,000.00"
                          onChange={(val) => setData(prev => ({ ...prev, healthcareExpenses: val }))}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#13</td>
                      <td className="border border-black px-2 py-1 text-xs">LONG-TERM CARE</td>
                      <td className="border border-black p-0">
                        <input type="text" value={data.healthcareNote2}
                          placeholder="3% of healthcare × years × 2"
                          onChange={(e) => setData(prev => ({ ...prev, healthcareNote2: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
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
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <TableHead4 />
                  <tbody>
                    {[
                      { n:'#14', label:'TRAVEL BUDGET',    notesFld:'travelNotes',     notes:data.travelNotes,     amtFld:'travelBudget',  amt:data.travelBudget },
                      { n:'#15', label:'VACATION HOME',    notesFld:'vacationNotes',   notes:data.vacationNotes,   amtFld:'vacationHome',  amt:data.vacationHome },
                      { n:'#16', label:'CHARITY / GIVING', notesFld:'charityNotes',    notes:data.charityNotes,    amtFld:'charity',       amt:data.charity },
                      { n:'#17', label:'OTHER GOALS',      notesFld:'otherGoalsNotes', notes:data.otherGoalsNotes, amtFld:'otherGoals',    amt:data.otherGoals },
                    ].map(row => (
                      <tr key={row.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{row.n}</td>
                        <td className="border border-black px-2 py-1 text-xs">{row.label}</td>
                        <td className="border border-black p-0">
                          <input type="text" value={row.notes} placeholder="Add notes..."
                            onChange={(e) => setData(prev => ({ ...prev, [row.notesFld]: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
                        <td className="border border-black p-0">
                          <CurrencyInput value={row.amt} placeholder="$0.00"
                            onChange={(val) => setData(prev => ({ ...prev, [row.amtFld]: val }))}
                            className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
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
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <TableHead4 />
                  <tbody>
                    {[
                      { n:'#18', label:'HEADSTART FUND FOR GRANDKIDS', notesFld:'headstartNotes', notes:data.headstartNotes, amtFld:'headstartFund', amt:data.headstartFund },
                      { n:'#19', label:'FAMILY LEGACY',                notesFld:'legacyNotes',    notes:data.legacyNotes,    amtFld:'familyLegacy', amt:data.familyLegacy },
                      { n:'#20', label:'FAMILY SUPPORT',               notesFld:'supportNotes',   notes:data.supportNotes,   amtFld:'familySupport',amt:data.familySupport },
                    ].map(row => (
                      <tr key={row.n}>
                        <td className="border border-black px-2 py-1 text-xs text-center font-semibold">{row.n}</td>
                        <td className="border border-black px-2 py-1 text-xs">{row.label}</td>
                        <td className="border border-black p-0">
                          <input type="text" value={row.notes} placeholder="Add notes..."
                            onChange={(e) => setData(prev => ({ ...prev, [row.notesFld]: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
                        <td className="border border-black p-0">
                          <CurrencyInput value={row.amt} placeholder="$0.00"
                            onChange={(val) => setData(prev => ({ ...prev, [row.amtFld]: val }))}
                            className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </td>
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
                <button onClick={() => toggleCard('totalReq')} className={btnOutline}>
                  {cardVisibility.totalReq ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.totalReq && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: COLORS.yellowBg }}>
                      <td className="border border-black px-3 py-2 text-sm font-bold">💰 TOTAL REQUIREMENT</td>
                      <td className="border border-black px-3 py-2 text-right text-base font-bold text-green-700">
                        {formatCurrency(data.totalRequirement)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-black text-white text-center py-1.5 rounded text-xs">
              ⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ASSETS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'assets' && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <CardHeader emoji="🏦" title="RETIREMENT PLANNING (USA)" cardKey="assetsRetirement" />
              {cardVisibility.assetsRetirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-10">#</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold">DESCRIPTION</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-12">HIM</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-12">HER</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-40">NOTES</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-36">PRESENT VALUE</th>
                      <th className="border border-black px-2 py-1 text-xs font-bold w-40">
                        PROJECTED @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1 text-xs text-center font-semibold">#1</td>
                      <td className="border border-black px-2 py-1 text-xs">CURRENT 401K | 403B</td>
                      <td className="border border-black text-center py-1">
                        <input type="checkbox" checked={assets.ret1_him}
                          onChange={(e) => setAssets(prev => ({ ...prev, ret1_him: e.target.checked }))}
                          className="w-4 h-4" />
                      </td>
                      <td className="border border-black text-center py-1">
                        <input type="checkbox" checked={assets.ret1_her}
                          onChange={(e) => setAssets(prev => ({ ...prev, ret1_her: e.target.checked }))}
                          className="w-4 h-4" />
                      </td>
                      <td className="border border-black p-0">
                        <input type="text" value={assets.ret1_notes} placeholder="Add notes..."
                          onChange={(e) => setAssets(prev => ({ ...prev, ret1_notes: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput value={assets.ret1_present} placeholder="$0.00"
                          onChange={(val) => setAssets(prev => ({ ...prev, ret1_present: val, totalPresent: val }))}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput value={assets.ret1_projected} placeholder="$0.00"
                          onChange={(val) => setAssets(prev => ({ ...prev, ret1_projected: val, totalProjected: val }))}
                          className="w-full px-2 py-1 text-xs text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-xs font-bold">💰 TOTAL ASSETS</h3>
                <button onClick={() => toggleCard('totalAssets')} className={btnOutline}>
                  {cardVisibility.totalAssets ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.totalAssets && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: COLORS.yellowBg }}>
                      <td className="border border-black px-3 py-2 text-sm font-bold">💰 TOTAL ASSETS</td>
                      <td className="border border-black px-3 py-2">
                        <div className="text-right text-sm font-bold text-green-700">
                          Present Value: {formatCurrency(assets.totalPresent)}
                        </div>
                        <div className="text-right text-sm font-bold text-blue-700 mt-0.5">
                          Projected @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%): {formatCurrency(assets.totalProjected)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-black text-white text-center py-1.5 rounded text-xs">
              ⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

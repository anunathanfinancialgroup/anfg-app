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
  // NEW FIELDS
  dob: "",
  notes: "",
  plannedRetirementAge: 65,
  calculatedInterestPercentage: 6,
  // existing fields
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
    const input = e.target.value;
    const sanitized = input.replace(/[^0-9.-]/g, '');
    setDisplayValue(sanitized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === '.' ||
      e.key === '-' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      (e.key >= '0' && e.key <= '9')
    ) {
      return;
    }
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

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
  const [exporting, setExporting] = useState(false);

  const [cardVisibility, setCardVisibility] = useState<CardVisibility>({
    clientInfo: true,
    college: false,
    wedding: false,
    retirement: false,
    healthcare: false,
    lifeGoals: false,
    legacy: false,
    totalReq: false,
    assetsRetirement: false,
    totalAssets: false,
  });

  useEffect(() => {
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('canfs_auth='));
    if (!authCookie) {
      router.push('/');
    } else {
      loadClients();
    }
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
    } catch (error: any) {
      showMessage('Error loading clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = async (clientId: string) => {
    if (!clientId) {
      setData(initialData);
      setAssets(initialAssets);
      return;
    }

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
        .limit(1)
        .maybeSingle();

      if (fnaError) throw fnaError;

      if (!fnaRecord) {
        showMessage('No existing FNA data for this client', 'error');
        return;
      }

      const fnaId = fnaRecord.fna_id;

      const [
        { data: collegeData },
        { data: weddingData },
        { data: retirementData },
        { data: healthcareData },
        { data: lifeGoalsData },
        { data: legacyData },
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
        ...prev,
        fnaId: fnaId,
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

  // Recalculate assets when interest percentage or retirement age changes
  useEffect(() => {
    if (assets.ret1_present > 0 && data.currentAge > 0 && data.plannedRetirementAge > 0) {
      const yearsToRetirement = Math.max(0, data.plannedRetirementAge - data.currentAge);
      const interestRate = data.calculatedInterestPercentage / 100;
      const projectedValue = assets.ret1_present * Math.pow(1 + interestRate, yearsToRetirement);

      setAssets(prev => ({
        ...prev,
        ret1_projected: projectedValue,
        totalProjected: projectedValue
      }));
    }
  }, [data.calculatedInterestPercentage, data.currentAge, data.plannedRetirementAge, assets.ret1_present]);

  useEffect(() => {
    const yearsToRetirement = data.currentAge > 0 ? Math.max(0, 65 - data.currentAge) : 0;
    const retirementYears = data.currentAge > 0 ? Math.max(0, 85 - data.currentAge) : 0;

    const inflationRate = 0.03;
    const monthlyRetirementIncome = data.monthlyIncomeNeeded > 0 && yearsToRetirement > 0
      ? data.monthlyIncomeNeeded * Math.pow(1 + inflationRate, yearsToRetirement)
      : 0;

    const annualRetirementIncome = monthlyRetirementIncome * 12;
    const totalRetirementIncome = annualRetirementIncome * retirementYears;
    const longTermCare = data.healthcareExpenses * 0.03 * (retirementYears * 2);

    const totalRequirement =
      data.child1CollegeAmount +
      data.child2CollegeAmount +
      data.child1WeddingAmount +
      data.child2WeddingAmount +
      totalRetirementIncome +
      data.healthcareExpenses +
      longTermCare +
      data.travelBudget +
      data.vacationHome +
      data.charity +
      data.otherGoals +
      data.headstartFund +
      data.familyLegacy +
      data.familySupport;

    setData(prev => ({
      ...prev,
      yearsToRetirement,
      retirementYears,
      monthlyRetirementIncome,
      annualRetirementIncome,
      totalRetirementIncome,
      longTermCare,
      totalRequirement
    }));
  }, [
    data.currentAge,
    data.monthlyIncomeNeeded,
    data.healthcareExpenses,
    data.child1CollegeAmount,
    data.child2CollegeAmount,
    data.child1WeddingAmount,
    data.child2WeddingAmount,
    data.travelBudget,
    data.vacationHome,
    data.charity,
    data.otherGoals,
    data.headstartFund,
    data.familyLegacy,
    data.familySupport
  ]);

  const handleSave = async () => {
    if (!data.clientId) {
      showMessage("Please select a client first", 'error');
      return;
    }

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
          }])
          .select()
          .single();

        if (fnaError) throw fnaError;
        fnaId = fnaRecord.fna_id;
        setData(prev => ({ ...prev, fnaId }));
      } else {
        const { error: updateError } = await supabase
          .from('fna_records')
          .update({
            analysis_date: data.analysisDate,
            spouse_name: data.spouseName,
            dob: data.dob || null,
            notes: data.notes || null,
            planned_retirement_age: data.plannedRetirementAge,
            calculated_interest_percentage: data.calculatedInterestPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('fna_id', fnaId);

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

      const insertPromises = [];

      if (data.child1CollegeName || data.child1CollegeAmount > 0) {
        insertPromises.push(
          supabase.from('fna_college').insert({
            fna_id: fnaId,
            child_number: 1,
            child_name: data.child1CollegeName || '',
            notes: data.child1CollegeNotes || '',
            amount: data.child1CollegeAmount || 0
          })
        );
      }
      if (data.child2CollegeName || data.child2CollegeAmount > 0) {
        insertPromises.push(
          supabase.from('fna_college').insert({
            fna_id: fnaId,
            child_number: 2,
            child_name: data.child2CollegeName || '',
            notes: data.child2CollegeNotes || '',
            amount: data.child2CollegeAmount || 0
          })
        );
      }

      if (data.child1WeddingAmount > 0) {
        insertPromises.push(
          supabase.from('fna_wedding').insert({
            fna_id: fnaId,
            child_number: 1,
            child_name: data.child1CollegeName || '',
            notes: data.child1WeddingNotes || '',
            amount: data.child1WeddingAmount || 0
          })
        );
      }
      if (data.child2WeddingAmount > 0) {
        insertPromises.push(
          supabase.from('fna_wedding').insert({
            fna_id: fnaId,
            child_number: 2,
            child_name: data.child2CollegeName || '',
            notes: data.child2WeddingNotes || '',
            amount: data.child2WeddingAmount || 0
          })
        );
      }

      insertPromises.push(
        supabase.from('fna_retirement').insert({
          fna_id: fnaId,
          current_age: data.currentAge || 0,
          monthly_income_needed: data.monthlyIncomeNeeded || 0
        })
      );

      insertPromises.push(
        supabase.from('fna_healthcare').insert({
          fna_id: fnaId,
          healthcare_expenses: data.healthcareExpenses || 0
        })
      );

      insertPromises.push(
        supabase.from('fna_life_goals').insert({
          fna_id: fnaId,
          travel_budget: data.travelBudget || 0,
          vacation_home: data.vacationHome || 0,
          charity: data.charity || 0,
          other_goals: data.otherGoals || 0
        })
      );

      insertPromises.push(
        supabase.from('fna_legacy').insert({
          fna_id: fnaId,
          headstart_fund: data.headstartFund || 0,
          family_legacy: data.familyLegacy || 0,
          family_support: data.familySupport || 0
        })
      );

      insertPromises.push(
        supabase.from('fna_ast_retirement').insert({
          fna_id: fnaId,
          current_401k_him: assets.ret1_him || false,
          current_401k_her: assets.ret1_her || false,
          current_401k_notes: assets.ret1_notes || '',
          current_401k_present_value: assets.ret1_present || 0,
          current_401k_projected_value: assets.ret1_projected || 0
        })
      );

      const results = await Promise.all(insertPromises);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Insert errors:', errors);
        throw new Error(`Failed to save ${errors.length} record(s)`);
      }

      showMessage('✅ FNA saved successfully!', 'success');
    } catch (error: any) {
      console.error('Save error:', error);
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
        clientId: prev.clientId,
        clientName: prev.clientName,
        clientPhone: prev.clientPhone,
        clientEmail: prev.clientEmail,
        spouseName: prev.spouseName,
        city: prev.city,
        state: prev.state,
        clientDob: prev.clientDob,
        analysisDate: prev.analysisDate,
        dob: prev.dob,
        notes: prev.notes,
        plannedRetirementAge: prev.plannedRetirementAge,
        calculatedInterestPercentage: prev.calculatedInterestPercentage,
        healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS"
      }));
      setAssets(initialAssets);
      showMessage("Form cleared (Client Information retained)", 'success');
    }
  };

  const handleShowAllCards = () => {
    setCardVisibility({
      clientInfo: true,
      college: true,
      wedding: true,
      retirement: true,
      healthcare: true,
      lifeGoals: true,
      legacy: true,
      totalReq: true,
      assetsRetirement: true,
      totalAssets: true,
    });
  };

  const toggleCard = (card: keyof CardVisibility) => {
    setCardVisibility(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  const handleExportPDF = async () => {
    if (!data.clientName) {
      showMessage("Please select a client first", 'error');
      return;
    }

    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const element = contentRef.current;
      if (!element) return;

      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const yyyy = today.getFullYear();
      const filename = `${data.clientName.replace(/\s/g, '_')}_FNA_${mm}-${dd}-${yyyy}.pdf`;

      const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      showMessage('✅ PDF exported successfully!', 'success');
    } catch (error: any) {
      console.error('Export error:', error);
      showMessage(`❌ Export failed: ${error.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 mx-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/anunathan-logo.png"
              alt="AnuNathan Financial Group"
              width={70}
              height={70}
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Financial Need Analysis</h1>
              <p className="text-sm text-gray-600">Build your career. Protect their future</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShowAllCards}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
            >
              📊 Show Cards
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
            >
              🗑️ Clear
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
            >
              Logout ➜
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4" ref={contentRef}>
        <div className="mb-4 flex justify-end gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exporting || !data.clientId}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
          >
            {exporting ? "📄 Exporting..." : "📄 Export PDF"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !data.clientId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
          >
            {saving ? "💾 Saving..." : "💾 Save FNA"}
          </button>
          {message && (
            <div className={`px-4 py-3 rounded-lg font-medium ${
              messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* ── CLIENT INFORMATION CARD ── */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="text-xl font-bold">📋 Client Information</h3>
            <a
              href="https://www.calculator.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors font-medium"
            >
              🧮 Calculator
            </a>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Client Name *</label>
              <select
                value={data.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="">-- Select Client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Phone Number</label>
              <input type="text" value={data.clientPhone} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Email</label>
              <input type="text" value={data.clientEmail} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Spouse Name</label>
              <input
                type="text"
                value={data.spouseName}
                onChange={(e) => setData(prev => ({ ...prev, spouseName: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">City</label>
              <input type="text" value={data.city} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">State</label>
              <input type="text" value={data.state} readOnly className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Analysis Date</label>
              <input
                type="date"
                value={data.analysisDate}
                onChange={(e) => setData(prev => ({ ...prev, analysisDate: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3 – NEW FIELDS */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={data.dob}
                onChange={(e) => setData(prev => ({ ...prev, dob: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Planned Retirement Age</label>
              <select
                value={data.plannedRetirementAge}
                onChange={(e) => setData(prev => ({ ...prev, plannedRetirementAge: parseInt(e.target.value) || 65 }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {Array.from({ length: 58 }, (_, i) => i + 50).map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Interest% to calculate</label>
              <select
                value={data.calculatedInterestPercentage}
                onChange={(e) => setData(prev => ({ ...prev, calculatedInterestPercentage: parseInt(e.target.value) }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(percent => (
                  <option key={percent} value={percent}>{percent}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Note</label>
              <input
                type="text"
                value={data.notes}
                onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Add notes..."
              />
            </div>
          </div>
        </div>

        {/* ── TAB BUTTONS ── */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all text-lg ${
              activeTab === 'goals'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            📊 FINANCIAL GOALS & PLANNING
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all text-lg ${
              activeTab === 'assets'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            💰 ASSETS
          </button>
        </div>

        {/* ── GOALS TAB ── */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {/* College */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                    🎓 KIDS COLLEGE PLANNING
                  </h3>
                  <button
                    onClick={() => toggleCard('college')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {cardVisibility.college ? 'Hide' : 'Show'}
                  </button>
                </div>
                <a
                  href="https://educationdata.org/average-cost-of-college-by-state#tx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors font-medium"
                >
                  💰 Cost of College
                </a>
              </div>
              {cardVisibility.college && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold">CHILD NAME</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#1</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.child1CollegeName}
                          onChange={(e) => setData(prev => ({ ...prev, child1CollegeName: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Enter child's name"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.child1CollegeNotes}
                          onChange={(e) => setData(prev => ({ ...prev, child1CollegeNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.child1CollegeAmount}
                          onChange={(val) => setData(prev => ({ ...prev, child1CollegeAmount: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#2</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.child2CollegeName}
                          onChange={(e) => setData(prev => ({ ...prev, child2CollegeName: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Enter child's name"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.child2CollegeNotes}
                          onChange={(e) => setData(prev => ({ ...prev, child2CollegeNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.child2CollegeAmount}
                          onChange={(val) => setData(prev => ({ ...prev, child2CollegeAmount: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Wedding */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                    💒 KIDS WEDDING
                  </h3>
                  <button
                    onClick={() => toggleCard('wedding')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {cardVisibility.wedding ? 'Hide' : 'Show'}
                  </button>
                </div>
                <a
                  href="https://www.zola.com/expert-advice/whats-the-average-cost-of-a-wedding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors font-medium"
                >
                  💍 Wedding Expenses
                </a>
              </div>
              {cardVisibility.wedding && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold">CHILD NAME</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#3</td>
                      <td className="border border-black px-3 py-2 text-sm bg-gray-50">
                        {data.child1CollegeName || '(From College #1)'}
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.child1WeddingNotes}
                          onChange={(e) => setData(prev => ({ ...prev, child1WeddingNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.child1WeddingAmount}
                          onChange={(val) => setData(prev => ({ ...prev, child1WeddingAmount: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#4</td>
                      <td className="border border-black px-3 py-2 text-sm bg-gray-50">
                        {data.child2CollegeName || '(From College #2)'}
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.child2WeddingNotes}
                          onChange={(e) => setData(prev => ({ ...prev, child2WeddingNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.child2WeddingAmount}
                          onChange={(val) => setData(prev => ({ ...prev, child2WeddingAmount: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Retirement */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                  🏖️ RETIREMENT PLANNING
                </h3>
                <button
                  onClick={() => toggleCard('retirement')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.retirement ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.retirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#5</td>
                      <td className="border border-black px-3 py-2 text-sm">CURRENT AGE</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.retirementNote1}
                          onChange={(e) => setData(prev => ({ ...prev, retirementNote1: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <select
                          value={data.currentAge || ''}
                          onChange={(e) => setData(prev => ({ ...prev, currentAge: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="">Select Age</option>
                          {Array.from({ length: 120 }, (_, i) => i + 1).map(age => (
                            <option key={age} value={age}>{age}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#6</td>
                      <td className="border border-black px-3 py-2 text-sm">YEARS TO RETIREMENT (65 - CURRENT AGE)</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.retirementNote2}
                          onChange={(e) => setData(prev => ({ ...prev, retirementNote2: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                        {data.yearsToRetirement}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#7</td>
                      <td className="border border-black px-3 py-2 text-sm">RETIREMENT YEARS (85 - CURRENT AGE)</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.retirementNote3}
                          onChange={(e) => setData(prev => ({ ...prev, retirementNote3: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                        {data.retirementYears}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#8</td>
                      <td className="border border-black px-3 py-2 text-sm">MONTHLY INCOME NEEDED (TODAY'S DOLLARS)</td>
                      <td className="border border-black px-3 py-2 text-xs text-gray-500 italic">
                        Today's dollars
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.monthlyIncomeNeeded}
                          onChange={(val) => setData(prev => ({ ...prev, monthlyIncomeNeeded: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#9</td>
                      <td className="border border-black px-3 py-2 text-sm">MONTHLY INCOME NEEDED (AT RETIREMENT @ 3%)</td>
                      <td className="border border-black px-3 py-2 text-xs text-gray-500 italic">
                        Auto-calculated with 3% inflation
                      </td>
                      <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                        {formatCurrency(data.monthlyRetirementIncome)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#10</td>
                      <td className="border border-black px-3 py-2 text-sm">ANNUAL RETIREMENT INCOME NEEDED</td>
                      <td className="border border-black px-3 py-2 text-xs text-gray-500 italic">
                        Monthly × 12
                      </td>
                      <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                        {formatCurrency(data.annualRetirementIncome)}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: COLORS.lightYellowBg }}>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#11</td>
                      <td className="border border-black px-3 py-2 text-sm font-bold">TOTAL RETIREMENT INCOME NEEDED</td>
                      <td className="border border-black px-3 py-2 text-xs text-gray-500 italic">
                        Annual × Retirement Years
                      </td>
                      <td className="border border-black px-3 py-2 text-sm text-right font-bold">
                        {formatCurrency(data.totalRetirementIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Healthcare */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                  🏥 HEALTHCARE PLANNING
                </h3>
                <button
                  onClick={() => toggleCard('healthcare')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.healthcare ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.healthcare && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#12</td>
                      <td className="border border-black px-3 py-2 text-sm">HEALTHCARE EXPENSES</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.healthcareNote1}
                          onChange={(e) => setData(prev => ({ ...prev, healthcareNote1: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="~$315K FOR COUPLE IN TODAY'S DOLLARS"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.healthcareExpenses}
                          onChange={(val) => setData(prev => ({ ...prev, healthcareExpenses: val }))}
                          placeholder="$315,000.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#13</td>
                      <td className="border border-black px-3 py-2 text-sm">LONG-TERM CARE</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.healthcareNote2}
                          onChange={(e) => setData(prev => ({ ...prev, healthcareNote2: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="3% of healthcare × years × 2"
                        />
                      </td>
                      <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                        {formatCurrency(data.longTermCare)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Life Goals */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                  🌟 LIFE GOALS
                </h3>
                <button
                  onClick={() => toggleCard('lifeGoals')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.lifeGoals ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.lifeGoals && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#14</td>
                      <td className="border border-black px-3 py-2 text-sm">TRAVEL BUDGET</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.travelNotes}
                          onChange={(e) => setData(prev => ({ ...prev, travelNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.travelBudget}
                          onChange={(val) => setData(prev => ({ ...prev, travelBudget: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#15</td>
                      <td className="border border-black px-3 py-2 text-sm">VACATION HOME</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.vacationNotes}
                          onChange={(e) => setData(prev => ({ ...prev, vacationNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.vacationHome}
                          onChange={(val) => setData(prev => ({ ...prev, vacationHome: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#16</td>
                      <td className="border border-black px-3 py-2 text-sm">CHARITY / GIVING</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.charityNotes}
                          onChange={(e) => setData(prev => ({ ...prev, charityNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.charity}
                          onChange={(val) => setData(prev => ({ ...prev, charity: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#17</td>
                      <td className="border border-black px-3 py-2 text-sm">OTHER GOALS</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.otherGoalsNotes}
                          onChange={(e) => setData(prev => ({ ...prev, otherGoalsNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.otherGoals}
                          onChange={(val) => setData(prev => ({ ...prev, otherGoals: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Legacy */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                  🎁 LEGACY PLANNING
                </h3>
                <button
                  onClick={() => toggleCard('legacy')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.legacy ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.legacy && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#18</td>
                      <td className="border border-black px-3 py-2 text-sm">HEADSTART FUND FOR GRANDKIDS</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.headstartNotes}
                          onChange={(e) => setData(prev => ({ ...prev, headstartNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.headstartFund}
                          onChange={(val) => setData(prev => ({ ...prev, headstartFund: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#19</td>
                      <td className="border border-black px-3 py-2 text-sm">FAMILY LEGACY</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.legacyNotes}
                          onChange={(e) => setData(prev => ({ ...prev, legacyNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.familyLegacy}
                          onChange={(val) => setData(prev => ({ ...prev, familyLegacy: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#20</td>
                      <td className="border border-black px-3 py-2 text-sm">FAMILY SUPPORT</td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={data.supportNotes}
                          onChange={(e) => setData(prev => ({ ...prev, supportNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={data.familySupport}
                          onChange={(val) => setData(prev => ({ ...prev, familySupport: val }))}
                          placeholder="$0.00"
                          className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Total Requirement */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg">💰 TOTAL REQUIREMENT</h3>
                <button
                  onClick={() => toggleCard('totalReq')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.totalReq ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.totalReq && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: COLORS.yellowBg }}>
                      <td className="border border-black px-4 py-4 text-xl font-bold">💰 TOTAL REQUIREMENT</td>
                      <td className="border border-black px-4 py-4 text-right text-2xl font-bold text-green-700">
                        {formatCurrency(data.totalRequirement)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-black text-white text-center py-3 rounded-lg font-medium">
              ⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}

        {/* ── ASSETS TAB ── */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                  🏦 RETIREMENT PLANNING (USA)
                </h3>
                <button
                  onClick={() => toggleCard('assetsRetirement')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.assetsRetirement ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.assetsRetirement && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.headerBg }}>
                      <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                      <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                      <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                      <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                      <th className="border border-black px-2 py-2 text-sm font-bold w-48">NOTES</th>
                      <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                      <th className="border border-black px-2 py-2 text-sm font-bold w-40">
                        PROJECTED @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-2 text-sm text-center font-semibold">#1</td>
                      <td className="border border-black px-2 py-2 text-sm">CURRENT 401K | 403B</td>
                      <td className="border border-black text-center">
                        <input
                          type="checkbox"
                          checked={assets.ret1_him}
                          onChange={(e) => setAssets(prev => ({ ...prev, ret1_him: e.target.checked }))}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="border border-black text-center">
                        <input
                          type="checkbox"
                          checked={assets.ret1_her}
                          onChange={(e) => setAssets(prev => ({ ...prev, ret1_her: e.target.checked }))}
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          value={assets.ret1_notes}
                          onChange={(e) => setAssets(prev => ({ ...prev, ret1_notes: e.target.value }))}
                          className="w-full px-2 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={assets.ret1_present}
                          onChange={(val) => setAssets(prev => ({ ...prev, ret1_present: val, totalPresent: val }))}
                          placeholder="$0.00"
                          className="w-full px-2 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <CurrencyInput
                          value={assets.ret1_projected}
                          onChange={(val) => setAssets(prev => ({ ...prev, ret1_projected: val, totalProjected: val }))}
                          placeholder="$0.00"
                          className="w-full px-2 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg">💰 TOTAL ASSETS</h3>
                <button
                  onClick={() => toggleCard('totalAssets')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {cardVisibility.totalAssets ? 'Hide' : 'Show'}
                </button>
              </div>
              {cardVisibility.totalAssets && (
                <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: COLORS.yellowBg }}>
                      <td className="border border-black px-4 py-4 text-xl font-bold">💰 TOTAL ASSETS</td>
                      <td className="border border-black px-4 py-4">
                        <div className="text-right text-lg font-bold text-green-700">
                          Present Value: {formatCurrency(assets.totalPresent)}
                        </div>
                        <div className="text-right text-lg font-bold text-blue-700 mt-1">
                          Projected @ {data.plannedRetirementAge} ({data.calculatedInterestPercentage}%): {formatCurrency(assets.totalProjected)}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-black text-white text-center py-3 rounded-lg font-medium">
              ⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

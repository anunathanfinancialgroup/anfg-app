"use client";

/**
 * Complete Financial Need Analysis (FNA) Calculator
 * Part 1 of 3: Imports, Interfaces, Initial Data, Component Setup
 * 
 * Features:
 * - FINANCIAL GOALS & PLANNING (19 rows)
 * - ASSETS (31 rows from PDF)
 * - Tab navigation
 * - PDF export: ClientName-FNA-YYYY-MM-DD.pdf
 * - Single save for all data
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = {
  headerBg: '#BDD7EE',
  whiteBg: '#FFFFFF',
  yellowBg: '#FFFF00',
  border: '#000000',
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

// FINANCIAL GOALS DATA INTERFACE
interface FNAData {
  fnaId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  spouseName: string;
  spousePhone: string;
  spouseEmail: string;
  clientDob: string;
  city: string;
  state: string;
  analysisDate: string;
  
  child1CollegeName: string;
  child1CollegeYear: string;
  child1CollegeAmount: number;
  child2CollegeName: string;
  child2CollegeYear: string;
  child2CollegeAmount: number;
  
  child1WeddingAmount: number;
  child1WeddingYear: string;
  child2WeddingAmount: number;
  child2WeddingYear: string;
  
  collegeNote1: string;
  collegeNote2: string;
  weddingNote1: string;
  weddingNote2: string;
  retirementNote1: string;
  retirementNote2: string;
  retirementNote3: string;
  healthcareNote1: string;
  healthcareNote2: string;
  lifeGoalsNote1: string;
  lifeGoalsNote2: string;
  lifeGoalsNote3: string;
  lifeGoalsNote4: string;
  legacyNote1: string;
  legacyNote2: string;
  legacyNote3: string;
  
  currentAge: number;
  yearsToRetirement: number;
  retirementYears: number;
  monthlyIncomeNeeded: number;
  monthlyRetirementIncome: number;
  annualRetirementIncome: number;
  totalRetirementIncome: number;
  
  healthcareExpenses: number;
  longTermCare: number;
  
  travelBudget: number;
  vacationHome: number;
  charity: number;
  otherGoals: number;
  
  headstartFund: number;
  familyLegacy: number;
  familySupport: number;
  
  totalRequirement: number;
}

// ASSETS DATA INTERFACE (from PDF)
interface AssetsData {
  // RETIREMENT PLANNING (7 rows)
  ret1_him: boolean;
  ret1_her: boolean;
  ret1_notes: string;
  ret1_present: number;
  ret1_projected: number;
  
  ret2_him: boolean;
  ret2_her: boolean;
  ret2_notes: string;
  
  ret3_notes: string;
  ret3_projected: number;
  
  ret4_him: boolean;
  ret4_her: boolean;
  ret4_notes: string;
  ret4_present: number;
  ret4_projected: number;
  
  ret5_him: boolean;
  ret5_her: boolean;
  ret5_notes: string;
  ret5_present: number;
  ret5_projected: number;
  
  ret6_him: boolean;
  ret6_her: boolean;
  ret6_notes: string;
  ret6_present: number;
  ret6_projected: number;
  
  ret7_him: boolean;
  ret7_her: boolean;
  ret7_notes: string;
  ret7_present: number;
  ret7_projected: number;
  
  // REAL ESTATE (4 rows)
  re1_him: boolean;
  re1_her: boolean;
  re1_notes: string;
  re1_present: number;
  re1_projected: number;
  
  re2_him: boolean;
  re2_her: boolean;
  re2_notes: string;
  re2_present: number;
  re2_projected: number;
  
  re3_him: boolean;
  re3_her: boolean;
  re3_notes: string;
  re3_present: number;
  re3_projected: number;
  
  re4_him: boolean;
  re4_her: boolean;
  re4_notes: string;
  re4_present: number;
  re4_projected: number;
  
  // STOCKS/BUSINESS/INCOME (7 rows)
  sb1_him: boolean;
  sb1_her: boolean;
  sb1_notes: string;
  sb1_present: number;
  sb1_projected: number;
  
  sb2_him: boolean;
  sb2_her: boolean;
  sb2_notes: string;
  sb2_present: number;
  sb2_projected: number;
  
  sb3_him: boolean;
  sb3_her: boolean;
  sb3_notes: string;
  sb3_present: number;
  sb3_projected: number;
  
  sb4_him: boolean;
  sb4_her: boolean;
  sb4_notes: string;
  sb4_present: number;
  sb4_projected: number;
  
  sb5_him: boolean;
  sb5_her: boolean;
  sb5_notes: string;
  sb5_present: number;
  sb5_projected: number;
  
  sb6_him: boolean;
  sb6_her: boolean;
  sb6_notes: string;
  sb6_amount: number;
  
  sb7_him: boolean;
  sb7_her: boolean;
  sb7_notes: string;
  sb7_amount: number;
  sb7_projected: number;
  
  // FAMILY PROTECTION (8 rows)
  fp1_him: boolean;
  fp1_her: boolean;
  fp1_notes: string;
  fp1_cash: number;
  fp1_legacy: number;
  
  fp2_him: boolean;
  fp2_her: boolean;
  fp2_notes: string;
  fp2_cash: number;
  fp2_legacy: number;
  
  fp3_him: boolean;
  fp3_her: boolean;
  fp3_notes: string;
  
  fp4_notes: string;
  
  fp5_him: boolean;
  fp5_her: boolean;
  fp5_notes: string;
  
  fp6_him: boolean;
  fp6_her: boolean;
  fp6_notes: string;
  fp6_present: number;
  
  fp7_him: boolean;
  fp7_her: boolean;
  fp7_notes: string;
  fp7_present: number;
  fp7_projected: number;
  
  fp8_him: boolean;
  fp8_her: boolean;
  fp8_notes: string;
  
  // COLLEGE/ESTATE (2 rows)
  ce1_child1: boolean;
  ce1_child2: boolean;
  ce1_notes: string;
  ce1_present: number;
  ce1_projected: number;
  
  ce2_him: boolean;
  ce2_her: boolean;
  ce2_notes: string;
  
  // FOREIGN ASSETS (2 rows)
  fa1_him: boolean;
  fa1_her: boolean;
  fa1_notes: string;
  fa1_present: number;
  fa1_projected: number;
  
  fa2_him: boolean;
  fa2_her: boolean;
  fa2_notes: string;
  fa2_present: number;
  fa2_projected: number;
  
  totalPresent: number;
  totalProjected: number;
}

// INITIAL FINANCIAL GOALS DATA
const initialData: FNAData = {
  clientId: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  spouseName: "",
  spousePhone: "",
  spouseEmail: "",
  clientDob: "",
  city: "",
  state: "",
  analysisDate: new Date().toISOString().split('T')[0],
  child1CollegeName: "",
  child1CollegeYear: "",
  child1CollegeAmount: 0,
  child2CollegeName: "",
  child2CollegeYear: "",
  child2CollegeAmount: 0,
  child1WeddingAmount: 0,
  child1WeddingYear: "",
  child2WeddingAmount: 0,
  child2WeddingYear: "",
  collegeNote1: "",
  collegeNote2: "",
  weddingNote1: "",
  weddingNote2: "",
  retirementNote1: "",
  retirementNote2: "",
  retirementNote3: "PROPERTY TAXES + CARS + INSURANCE + FOOD + REPAIRS + UTILITIES + LIVING",
  healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS",
  healthcareNote2: "",
  lifeGoalsNote1: "your travel plan expenses after retirement per year",
  lifeGoalsNote2: "",
  lifeGoalsNote3: "",
  lifeGoalsNote4: "",
  legacyNote1: "",
  legacyNote2: "",
  legacyNote3: "",
  currentAge: 0,
  yearsToRetirement: 0,
  retirementYears: 0,
  monthlyIncomeNeeded: 0,
  monthlyRetirementIncome: 0,
  annualRetirementIncome: 0,
  totalRetirementIncome: 0,
  healthcareExpenses: 315000,
  longTermCare: 0,
  travelBudget: 0,
  vacationHome: 0,
  charity: 0,
  otherGoals: 0,
  headstartFund: 0,
  familyLegacy: 0,
  familySupport: 0,
  totalRequirement: 0
};

// INITIAL ASSETS DATA
const initialAssets: AssetsData = {
  ret1_him: false, ret1_her: false, ret1_notes: "", ret1_present: 0, ret1_projected: 0,
  ret2_him: false, ret2_her: false, ret2_notes: "",
  ret3_notes: "", ret3_projected: 0,
  ret4_him: false, ret4_her: false, ret4_notes: "", ret4_present: 0, ret4_projected: 0,
  ret5_him: false, ret5_her: false, ret5_notes: "", ret5_present: 0, ret5_projected: 0,
  ret6_him: false, ret6_her: false, ret6_notes: "", ret6_present: 0, ret6_projected: 0,
  ret7_him: false, ret7_her: false, ret7_notes: "", ret7_present: 0, ret7_projected: 0,
  re1_him: false, re1_her: false, re1_notes: "", re1_present: 0, re1_projected: 0,
  re2_him: false, re2_her: false, re2_notes: "", re2_present: 0, re2_projected: 0,
  re3_him: false, re3_her: false, re3_notes: "", re3_present: 0, re3_projected: 0,
  re4_him: false, re4_her: false, re4_notes: "", re4_present: 0, re4_projected: 0,
  sb1_him: false, sb1_her: false, sb1_notes: "", sb1_present: 0, sb1_projected: 0,
  sb2_him: false, sb2_her: false, sb2_notes: "", sb2_present: 0, sb2_projected: 0,
  sb3_him: false, sb3_her: false, sb3_notes: "", sb3_present: 0, sb3_projected: 0,
  sb4_him: false, sb4_her: false, sb4_notes: "", sb4_present: 0, sb4_projected: 0,
  sb5_him: false, sb5_her: false, sb5_notes: "", sb5_present: 0, sb5_projected: 0,
  sb6_him: false, sb6_her: false, sb6_notes: "", sb6_amount: 0,
  sb7_him: false, sb7_her: false, sb7_notes: "", sb7_amount: 0, sb7_projected: 0,
  fp1_him: false, fp1_her: false, fp1_notes: "", fp1_cash: 0, fp1_legacy: 0,
  fp2_him: false, fp2_her: false, fp2_notes: "", fp2_cash: 0, fp2_legacy: 0,
  fp3_him: false, fp3_her: false, fp3_notes: "",
  fp4_notes: "",
  fp5_him: false, fp5_her: false, fp5_notes: "",
  fp6_him: false, fp6_her: false, fp6_notes: "", fp6_present: 0,
  fp7_him: false, fp7_her: false, fp7_notes: "", fp7_present: 0, fp7_projected: 0,
  fp8_him: false, fp8_her: false, fp8_notes: "",
  ce1_child1: false, ce1_child2: false, ce1_notes: "", ce1_present: 0, ce1_projected: 0,
  ce2_him: false, ce2_her: false, ce2_notes: "",
  fa1_him: false, fa1_her: false, fa1_notes: "", fa1_present: 0, fa1_projected: 0,
  fa2_him: false, fa2_her: false, fa2_notes: "", fa2_present: 0, fa2_projected: 0,
  totalPresent: 0,
  totalProjected: 0
};


// ========================================
// HELPER COMPONENTS (defined outside main component for performance)
// ========================================

const ResizableHeader = ({ children, column, width }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const diff = e.clientX - startX.current;
        handleColumnResize(column, startWidth.current + diff);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <th 
      className="border border-black px-2 py-2 text-left text-sm font-bold relative"
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      {children}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500"
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      />
    </th>
  );
};

// EXCEL TEXT INPUT - FIXED for multi-character entry
const ExcelTextInput = ({ value, onChange, readOnly = false }: any) => {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused ? localValue : (value || '');

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value || '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!readOnly) {
      onChange(localValue);
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      readOnly={readOnly}
      className={`w-full px-2 py-1 text-sm ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
      style={{ 
        fontFamily: 'Arial, sans-serif', 
        outline: 'none',
        border: 'none'
      }}
    />
  );
};

// EXCEL NUMBER INPUT - FIXED for multi-digit entry
const ExcelNumberInput = ({ value, onChange, readOnly = false, calculated = false }: any) => {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused 
    ? localValue 
    : (value === 0 && !calculated ? '' : formatCurrency(value));

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value === 0 ? '' : value.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!readOnly) {
      onChange(localValue);
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      readOnly={readOnly}
      className={`w-full px-2 py-1 text-sm text-right ${
        readOnly || calculated ? 'bg-gray-100 font-semibold' : 'bg-white'
      }`}
      style={{ 
        fontFamily: 'Arial, sans-serif', 
        outline: 'none',
        border: 'none'
      }}
      placeholder="$0"
    />
  );
};

export default function FNAPage() {
  const router = useRouter();
  const [data, setData] = useState<FNAData>(initialData);
  const [assets, setAssets] = useState<AssetsData>(initialAssets);
  const [activeTab, setActiveTab] = useState<'goals' | 'assets'>('goals');
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const [columnWidths, setColumnWidths] = useState({
    col1: 60,
    col2: 400,
    col3: 180,
    col4: 180,
  });

  // AUTH CHECK
  useEffect(() => {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('canfs_auth='));
    
    if (!authCookie) {
      router.push('/');
    } else {
      loadClients();
    }
  }, [router]);

  // LOAD CLIENTS
  const loadClients = async () => {
    setLoading(true);
    try {
      const { data: clientData, error } = await supabase
        .from('client_registrations')
        .select('id, first_name, last_name, phone, email, spouse_name, city, state, date_of_birth')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setClients(clientData || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // CLIENT SELECT HANDLER
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: `${client.first_name} ${client.last_name}`,
        clientPhone: client.phone || '',
        clientEmail: client.email || '',
        spouseName: client.spouse_name || '',
        city: client.city || '',
        state: client.state || '',
        clientDob: client.date_of_birth || '',
        spousePhone: '',
        spouseEmail: ''
      }));
    }
  };

  // AUTO-CALCULATE GOALS FORMULAS
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

  // AUTO-CALCULATE ASSETS TOTALS
  useEffect(() => {
    const totalPresent = 
      assets.ret1_present +
      assets.ret4_present +
      assets.ret5_present +
      assets.ret6_present +
      assets.ret7_present +
      assets.re1_present +
      assets.re2_present +
      assets.re3_present +
      assets.re4_present +
      assets.sb1_present +
      assets.sb2_present +
      assets.sb3_present +
      assets.sb4_present +
      assets.sb5_present +
      assets.fp6_present +
      assets.fp7_present +
      assets.ce1_present +
      assets.fa1_present +
      assets.fa2_present;
    
    const totalProjected =
      assets.ret1_projected +
      assets.ret3_projected +
      assets.ret4_projected +
      assets.ret5_projected +
      assets.ret6_projected +
      assets.ret7_projected +
      assets.re1_projected +
      assets.re2_projected +
      assets.re3_projected +
      assets.re4_projected +
      assets.sb1_projected +
      assets.sb2_projected +
      assets.sb3_projected +
      assets.sb4_projected +
      assets.sb5_projected +
      assets.sb7_projected +
      assets.fp7_projected +
      assets.ce1_projected +
      assets.fa1_projected +
      assets.fa2_projected;
    
    setAssets(prev => ({
      ...prev,
      totalPresent,
      totalProjected
    }));
  }, [
    assets.ret1_present, assets.ret1_projected,
    assets.ret3_projected,
    assets.ret4_present, assets.ret4_projected,
    assets.ret5_present, assets.ret5_projected,
    assets.ret6_present, assets.ret6_projected,
    assets.ret7_present, assets.ret7_projected,
    assets.re1_present, assets.re1_projected,
    assets.re2_present, assets.re2_projected,
    assets.re3_present, assets.re3_projected,
    assets.re4_present, assets.re4_projected,
    assets.sb1_present, assets.sb1_projected,
    assets.sb2_present, assets.sb2_projected,
    assets.sb3_present, assets.sb3_projected,
    assets.sb4_present, assets.sb4_projected,
    assets.sb5_present, assets.sb5_projected,
    assets.sb7_projected,
    assets.fp6_present,
    assets.fp7_present, assets.fp7_projected,
    assets.ce1_present, assets.ce1_projected,
    assets.fa1_present, assets.fa1_projected,
    assets.fa2_present, assets.fa2_projected
  ]);

  // CURRENCY FORMATTER
  const formatCurrency = (value: number): string => {
    if (value === 0) return "";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // NUMBER INPUT HANDLER FOR GOALS
  const handleNumberInput = (field: keyof FNAData, value: string) => {
    const cleanValue = value.replace(/[$,]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  // NUMBER INPUT HANDLER FOR ASSETS
  const handleAssetsNumberInput = (field: keyof AssetsData, value: string) => {
    const cleanValue = value.replace(/[$,]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    setAssets(prev => ({ ...prev, [field]: numValue }));
  };

// SAVE FUNCTION - Will be in Part 2
// HELPER FUNCTIONS - Will be in Part 2
// UI COMPONENTS - Will be in Part 2



  // SAVE FUNCTION - SAVES BOTH GOALS AND ASSETS
  const handleSave = async () => {
    if (!data.clientId) {
      showMessage("Please select a client", 'error');
      return;
    }

    setSaving(true);
    try {
      // 1. Create FNA record
      const { data: fnaRecord, error: fnaError } = await supabase
        .from('fna_records')
        .insert([{
          client_id: data.clientId,
          analysis_date: data.analysisDate,
          spouse_name: data.spouseName,
          client_dob: data.clientDob || null,
          city: data.city,
          state: data.state,
          mobile_phone: data.clientPhone,
          personal_email: data.clientEmail,
          spouse_mobile_phone: data.spousePhone,
          spouse_email: data.spouseEmail,
          notes: `FNA for ${data.clientName}`
        }])
        .select()
        .single();

      if (fnaError) throw fnaError;
      const fnaId = fnaRecord.fna_id;

      // 2. Save GOALS data (7 tables)
      await Promise.all([
        supabase.from('fna_college').insert([
          {
            fna_id: fnaId,
            child_number: 1,
            child_name: data.child1CollegeName,
            year_from_today: data.child1CollegeYear ? parseInt(data.child1CollegeYear) - new Date().getFullYear() : 0,
            amount: data.child1CollegeAmount
          },
          {
            fna_id: fnaId,
            child_number: 2,
            child_name: data.child2CollegeName,
            year_from_today: data.child2CollegeYear ? parseInt(data.child2CollegeYear) - new Date().getFullYear() : 0,
            amount: data.child2CollegeAmount
          }
        ]),
        supabase.from('fna_wedding').insert([
          { fna_id: fnaId, child_number: 1, child_name: data.child1CollegeName, amount: data.child1WeddingAmount },
          { fna_id: fnaId, child_number: 2, child_name: data.child2CollegeName, amount: data.child2WeddingAmount }
        ]),
        supabase.from('fna_retirement').insert([{
          fna_id: fnaId,
          current_age: data.currentAge,
          years_to_retirement: data.yearsToRetirement,
          retirement_years: data.retirementYears,
          monthly_income_needed: data.monthlyIncomeNeeded,
          monthly_retirement_income: data.monthlyRetirementIncome,
          annual_retirement_income: data.annualRetirementIncome,
          total_retirement_income: data.totalRetirementIncome
        }]),
        supabase.from('fna_healthcare').insert([{
          fna_id: fnaId,
          healthcare_expenses: data.healthcareExpenses,
          long_term_care: data.longTermCare
        }]),
        supabase.from('fna_life_goals').insert([{
          fna_id: fnaId,
          travel_budget: data.travelBudget,
          vacation_home: data.vacationHome,
          charity: data.charity,
          other_goals: data.otherGoals
        }]),
        supabase.from('fna_legacy').insert([{
          fna_id: fnaId,
          headstart_fund: data.headstartFund,
          family_legacy: data.familyLegacy,
          family_support: data.familySupport
        }])
      ]);

      // 3. Save ASSETS data (6 tables)
      await Promise.all([
        // Retirement Assets
        supabase.from('fna_ast_retirement').insert([{
          fna_id: fnaId,
          current_401k_him: assets.ret1_him,
          current_401k_her: assets.ret1_her,
          current_401k_notes: assets.ret1_notes,
          current_401k_present_value: assets.ret1_present,
          current_401k_projected_value: assets.ret1_projected,
          company_match_him: assets.ret2_him,
          company_match_her: assets.ret2_her,
          company_match_notes: assets.ret2_notes,
          max_funding_notes: assets.ret3_notes,
          max_funding_projected_value: assets.ret3_projected,
          rollover_401k_him: assets.ret4_him,
          rollover_401k_her: assets.ret4_her,
          rollover_401k_notes: assets.ret4_notes,
          rollover_401k_present_value: assets.ret4_present,
          rollover_401k_projected_value: assets.ret4_projected,
          traditional_ira_him: assets.ret5_him,
          traditional_ira_her: assets.ret5_her,
          traditional_ira_notes: assets.ret5_notes,
          traditional_ira_present_value: assets.ret5_present,
          traditional_ira_projected_value: assets.ret5_projected,
          roth_ira_him: assets.ret6_him,
          roth_ira_her: assets.ret6_her,
          roth_ira_notes: assets.ret6_notes,
          roth_ira_present_value: assets.ret6_present,
          roth_ira_projected_value: assets.ret6_projected,
          espp_rsu_him: assets.ret7_him,
          espp_rsu_her: assets.ret7_her,
          espp_rsu_notes: assets.ret7_notes,
          espp_rsu_present_value: assets.ret7_present,
          espp_rsu_projected_value: assets.ret7_projected
        }]),
        
        // Real Estate Assets
        supabase.from('fna_ast_real_estate').insert([{
          fna_id: fnaId,
          personal_home_him: assets.re1_him,
          personal_home_her: assets.re1_her,
          personal_home_notes: assets.re1_notes,
          personal_home_present_value: assets.re1_present,
          personal_home_projected_value: assets.re1_projected,
          rental_properties_him: assets.re2_him,
          rental_properties_her: assets.re2_her,
          rental_properties_notes: assets.re2_notes,
          rental_properties_present_value: assets.re2_present,
          rental_properties_projected_value: assets.re2_projected,
          land_parcels_him: assets.re3_him,
          land_parcels_her: assets.re3_her,
          land_parcels_notes: assets.re3_notes,
          land_parcels_present_value: assets.re3_present,
          land_parcels_projected_value: assets.re3_projected,
          inheritance_him: assets.re4_him,
          inheritance_her: assets.re4_her,
          inheritance_notes: assets.re4_notes,
          inheritance_present_value: assets.re4_present,
          inheritance_projected_value: assets.re4_projected
        }]),
        
        // Income Assets
        supabase.from('fna_ast_income').insert([{
          fna_id: fnaId,
          stocks_him: assets.sb1_him,
          stocks_her: assets.sb1_her,
          stocks_notes: assets.sb1_notes,
          stocks_present_value: assets.sb1_present,
          stocks_projected_value: assets.sb1_projected,
          business_him: assets.sb2_him,
          business_her: assets.sb2_her,
          business_notes: assets.sb2_notes,
          business_present_value: assets.sb2_present,
          business_projected_value: assets.sb2_projected,
          alternative_inv_him: assets.sb3_him,
          alternative_inv_her: assets.sb3_her,
          alternative_inv_notes: assets.sb3_notes,
          alternative_inv_present_value: assets.sb3_present,
          alternative_inv_projected_value: assets.sb3_projected,
          cds_him: assets.sb4_him,
          cds_her: assets.sb4_her,
          cds_notes: assets.sb4_notes,
          cds_present_value: assets.sb4_present,
          cds_projected_value: assets.sb4_projected,
          cash_emergency_him: assets.sb5_him,
          cash_emergency_her: assets.sb5_her,
          cash_emergency_notes: assets.sb5_notes,
          cash_emergency_present_value: assets.sb5_present,
          cash_emergency_projected_value: assets.sb5_projected,
          annual_income_him: assets.sb6_him,
          annual_income_her: assets.sb6_her,
          annual_income_notes: assets.sb6_notes,
          annual_income_amount: assets.sb6_amount,
          annual_savings_him: assets.sb7_him,
          annual_savings_her: assets.sb7_her,
          annual_savings_notes: assets.sb7_notes,
          annual_savings_amount: assets.sb7_amount,
          annual_savings_projected: assets.sb7_projected
        }]),
        
        // Protection Assets
        supabase.from('fna_ast_protection').insert([{
          fna_id: fnaId,
          life_insurance_work_him: assets.fp1_him,
          life_insurance_work_her: assets.fp1_her,
          life_insurance_work_notes: assets.fp1_notes,
          life_insurance_work_cash_value: assets.fp1_cash,
          life_insurance_work_legacy_value: assets.fp1_legacy,
          life_insurance_outside_him: assets.fp2_him,
          life_insurance_outside_her: assets.fp2_her,
          life_insurance_outside_notes: assets.fp2_notes,
          life_insurance_outside_cash_value: assets.fp2_cash,
          life_insurance_outside_legacy_value: assets.fp2_legacy,
          cash_value_insurance_him: assets.fp3_him,
          cash_value_insurance_her: assets.fp3_her,
          cash_value_insurance_notes: assets.fp3_notes,
          insurance_company_notes: assets.fp4_notes,
          disability_work_him: assets.fp5_him,
          disability_work_her: assets.fp5_her,
          disability_work_notes: assets.fp5_notes,
          long_term_care_him: assets.fp6_him,
          long_term_care_her: assets.fp6_her,
          long_term_care_notes: assets.fp6_notes,
          long_term_care_present_value: assets.fp6_present,
          hsa_him: assets.fp7_him,
          hsa_her: assets.fp7_her,
          hsa_notes: assets.fp7_notes,
          hsa_present_value: assets.fp7_present,
          hsa_projected_value: assets.fp7_projected,
          mortgage_protection_him: assets.fp8_him,
          mortgage_protection_her: assets.fp8_her,
          mortgage_protection_notes: assets.fp8_notes
        }]),
        
        // College/Estate Assets
        supabase.from('fna_ast_college_estate').insert([{
          fna_id: fnaId,
          plan_529_child1: assets.ce1_child1,
          plan_529_child2: assets.ce1_child2,
          plan_529_notes: assets.ce1_notes,
          plan_529_present_value: assets.ce1_present,
          plan_529_projected_value: assets.ce1_projected,
          will_trust_him: assets.ce2_him,
          will_trust_her: assets.ce2_her,
          will_trust_notes: assets.ce2_notes
        }]),
        
        // Foreign Assets
        supabase.from('fna_ast_foreign').insert([{
          fna_id: fnaId,
          foreign_real_estate_him: assets.fa1_him,
          foreign_real_estate_her: assets.fa1_her,
          foreign_real_estate_notes: assets.fa1_notes,
          foreign_real_estate_present_value: assets.fa1_present,
          foreign_real_estate_projected_value: assets.fa1_projected,
          foreign_non_real_estate_him: assets.fa2_him,
          foreign_non_real_estate_her: assets.fa2_her,
          foreign_non_real_estate_notes: assets.fa2_notes,
          foreign_non_real_estate_present_value: assets.fa2_present,
          foreign_non_real_estate_projected_value: assets.fa2_projected
        }])
      ]);

      showMessage('FNA and Assets saved successfully!', 'success');
      setData(prev => ({ ...prev, fnaId }));
    } catch (error: any) {
      console.error('Save error:', error);
      showMessage(`Error: ${error.message}`, 'error');
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

  const handleRefresh = () => {
    loadClients();
    showMessage("Data refreshed", 'success');
  };

  const handleExportPDF = () => {
    const clientNameForFile = data.clientName.replace(/\s+/g, '-') || 'Client';
    const today = new Date().toISOString().split('T')[0];
    const filename = `${clientNameForFile}-FNA-${today}`;
    document.title = filename;
    window.print();
    setTimeout(() => {
      document.title = 'Client Financial Need Analysis';
    }, 100);
  };

  const handleColumnResize = (column: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(50, newWidth)
    }));
  };

  // RESIZABLE HEADER COMPONENT



  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 mx-4 mt-4 no-print">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image 
              src="/anunathan-logo.png" 
              alt="AnuNathan Financial Group" 
              width={60} 
              height={60}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Client Financial Need Analysis</h1>
              <p className="text-xs text-gray-600">Build your career. Protect their future</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            Logout ➜
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Action Buttons */}
        <div className="mb-4 flex justify-end gap-3 no-print">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? "Saving..." : "💾 Save"}
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
          >
            📄 Export
          </button>
          {message && (
            <div className={`px-4 py-2 rounded ${
              messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Client Information - Shared across both tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Client Information</h3>
            <button
              onClick={() => window.open('https://www.calculator.net/', '_blank')}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm no-print"
            >
              🧮 Calculator
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Client Name *</label>
              <select
                value={data.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone Number</label>
              <input type="text" value={data.clientPhone} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input type="text" value={data.clientEmail} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Spouse Name</label>
              <input type="text" value={data.spouseName} onChange={(e) => setData(prev => ({ ...prev, spouseName: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Spouse Phone</label>
              <input type="text" value={data.spousePhone} onChange={(e) => setData(prev => ({ ...prev, spousePhone: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Spouse Email</label>
              <input type="text" value={data.spouseEmail} onChange={(e) => setData(prev => ({ ...prev, spouseEmail: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Date of Birth</label>
              <input type="date" value={data.clientDob} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">City</label>
              <input type="text" value={data.city} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">State</label>
              <input type="text" value={data.state} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Analysis Date</label>
              <input type="date" value={data.analysisDate} onChange={(e) => setData(prev => ({ ...prev, analysisDate: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION - Two Cards */}
        <div className="mb-4 flex gap-2 no-print">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
              activeTab === 'goals'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📊 FINANCIAL GOALS & PLANNING
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
              activeTab === 'assets'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            💰 ASSETS
          </button>
        </div>

        {/* FINANCIAL GOALS & PLANNING TAB CONTENT */}
        {activeTab === 'goals' && (
          <>
            {/* College Planning */}
            <div className="mb-2 flex justify-end no-print">
              <button onClick={() => window.open('https://educationdata.org/average-cost-of-college-by-state#tx', '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm">
                📚 Cost of College
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <ResizableHeader column="col1" width={columnWidths.col1}>#</ResizableHeader>
                    <ResizableHeader column="col2" width={columnWidths.col2}>KIDS COLLEGE PLANNING</ResizableHeader>
                    <ResizableHeader column="col3" width={columnWidths.col3}>YEARS FROM TODAY</ResizableHeader>
                    <ResizableHeader column="col4" width={columnWidths.col4}>AMOUNT</ResizableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold" style={{ width: `${columnWidths.col1}px` }}>#1</td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col2}px` }}>
                      <ExcelTextInput value={data.child1CollegeName} onChange={(val: string) => setData(prev => ({ ...prev, child1CollegeName: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col3}px` }}>
                      <ExcelTextInput value={data.child1CollegeYear} onChange={(val: string) => setData(prev => ({ ...prev, child1CollegeYear: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col4}px` }}>
                      <ExcelNumberInput value={data.child1CollegeAmount} onChange={(val: string) => handleNumberInput('child1CollegeAmount', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#2</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.child2CollegeName} onChange={(val: string) => setData(prev => ({ ...prev, child2CollegeName: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.child2CollegeYear} onChange={(val: string) => setData(prev => ({ ...prev, child2CollegeYear: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.child2CollegeAmount} onChange={(val: string) => handleNumberInput('child2CollegeAmount', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Wedding Planning */}
            <div className="mb-2 flex justify-end no-print">
              <button onClick={() => window.open('https://www.zola.com/expert-advice/whats-the-average-cost-of-a-wedding', '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm">
                💒 Wedding Expenses
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <ResizableHeader column="col1" width={columnWidths.col1}>#</ResizableHeader>
                    <ResizableHeader column="col2" width={columnWidths.col2}>KIDS WEDDING PLANNING</ResizableHeader>
                    <ResizableHeader column="col3" width={columnWidths.col3}>YEARS FROM TODAY</ResizableHeader>
                    <ResizableHeader column="col4" width={columnWidths.col4}>AMOUNT</ResizableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold" style={{ width: `${columnWidths.col1}px` }}>#3</td>
                    <td className="border border-black px-2 py-1 text-sm" style={{ width: `${columnWidths.col2}px` }}>{data.child1CollegeName || 'CHILD 1'}</td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col3}px` }}>
                      <ExcelTextInput value={data.child1WeddingYear} onChange={(val: string) => setData(prev => ({ ...prev, child1WeddingYear: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col4}px` }}>
                      <ExcelNumberInput value={data.child1WeddingAmount} onChange={(val: string) => handleNumberInput('child1WeddingAmount', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#4</td>
                    <td className="border border-black px-2 py-1 text-sm">{data.child2CollegeName || 'CHILD 2'}</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.child2WeddingYear} onChange={(val: string) => setData(prev => ({ ...prev, child2WeddingYear: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.child2WeddingAmount} onChange={(val: string) => handleNumberInput('child2WeddingAmount', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Retirement Planning */}
            <div className="mb-2 flex justify-end no-print">
              <button onClick={() => window.open('https://www.calculator.net/retirement-calculator.html', '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm">
                🏖️ Retirement Calculator
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <ResizableHeader column="col1" width={columnWidths.col1}>#</ResizableHeader>
                    <ResizableHeader column="col2" width={columnWidths.col2}>RETIREMENT PLANNING</ResizableHeader>
                    <ResizableHeader column="col3" width={columnWidths.col3}>NOTES</ResizableHeader>
                    <ResizableHeader column="col4" width={columnWidths.col4}>AMOUNT</ResizableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold" style={{ width: `${columnWidths.col1}px` }}>#5</td>
                    <td className="border border-black px-2 py-1 text-sm" style={{ width: `${columnWidths.col2}px` }}>NUMBER OF YEARS TO RETIREMENT AGE OF 65</td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col3}px` }}>
                      <ExcelTextInput value={data.retirementNote1} onChange={(val: string) => setData(prev => ({ ...prev, retirementNote1: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col4}px` }}>
                      <div className="flex border-0">
                        <input type="text" value={data.currentAge || ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setData(prev => ({ ...prev, currentAge: parseInt(val) || 0 })); }} className="w-1/2 px-2 py-1 text-sm text-center bg-white" placeholder="Current Age" style={{ outline: 'none', borderRight: '1px solid black' }} />
                        <div className="w-1/2 px-2 py-1 bg-gray-100 text-sm text-center font-semibold">{data.yearsToRetirement}</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#6</td>
                    <td className="border border-black px-2 py-1 text-sm">NUMBER OF YEARS IN RETIREMENT (*UNTIL AGE 85 OR 90)</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.retirementNote2} onChange={(val: string) => setData(prev => ({ ...prev, retirementNote2: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <div className="flex border-0">
                        <div className="w-1/2 px-2 py-1 text-sm text-center bg-gray-100" style={{ borderRight: '1px solid black' }}>{data.currentAge || ''}</div>
                        <div className="w-1/2 px-2 py-1 bg-gray-100 text-sm text-center font-semibold">{data.retirementYears}</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#7</td>
                    <td className="border border-black px-2 py-1 text-sm">MONTHLY INCOME NEEDED IN TODAY'S DOLLARS (PRE-TAX)</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.retirementNote3} onChange={(val: string) => setData(prev => ({ ...prev, retirementNote3: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.monthlyIncomeNeeded} onChange={(val: string) => handleNumberInput('monthlyIncomeNeeded', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#8</td>
                    <td className="border border-black px-2 py-1 text-sm">MONTHLY RETIREMENT INCOME @ 65 w-INFLATION 3%</td>
                    <td className="border border-black"></td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.monthlyRetirementIncome} readOnly calculated />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#9</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL RETIREMENT INCOME @ 65 w-INFLATION 3%</td>
                    <td className="border border-black"></td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.annualRetirementIncome} readOnly calculated />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#10</td>
                    <td className="border border-black px-2 py-1 text-sm font-bold">TOTAL RETIREMENT INCOME</td>
                    <td className="border border-black"></td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.totalRetirementIncome} readOnly calculated />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Healthcare */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <ResizableHeader column="col1" width={columnWidths.col1}>#</ResizableHeader>
                    <ResizableHeader column="col2" width={columnWidths.col2}>HEALTH CARE AND LONG TERM CARE PLANNING</ResizableHeader>
                    <ResizableHeader column="col3" width={columnWidths.col3}>NOTES</ResizableHeader>
                    <ResizableHeader column="col4" width={columnWidths.col4}>AMOUNT</ResizableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold" style={{ width: `${columnWidths.col1}px` }}>#11</td>
                    <td className="border border-black px-2 py-1 text-sm" style={{ width: `${columnWidths.col2}px` }}>HEALTH CARE OUT-OF-POCKET EXPENSES (PLAN FOR ~20+ YRS)</td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col3}px` }}>
                      <ExcelTextInput value={data.healthcareNote1} onChange={(val: string) => setData(prev => ({ ...prev, healthcareNote1: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col4}px` }}>
                      <ExcelNumberInput value={data.healthcareExpenses} onChange={(val: string) => handleNumberInput('healthcareExpenses', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#12</td>
                    <td className="border border-black px-2 py-1 text-sm">LONG TERM CARE | DISABILITY (PLAN FOR ATLEAST 2+ YRS EACH)</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.healthcareNote2} onChange={(val: string) => setData(prev => ({ ...prev, healthcareNote2: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.longTermCare} readOnly calculated />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Life Goals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <ResizableHeader column="col1" width={columnWidths.col1}>#</ResizableHeader>
                    <ResizableHeader column="col2" width={columnWidths.col2}>LIFE GOALS PLANNING</ResizableHeader>
                    <ResizableHeader column="col3" width={columnWidths.col3}>NOTES</ResizableHeader>
                    <ResizableHeader column="col4" width={columnWidths.col4}>AMOUNT</ResizableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold" style={{ width: `${columnWidths.col1}px` }}>#13</td>
                    <td className="border border-black px-2 py-1 text-sm" style={{ width: `${columnWidths.col2}px` }}>TRAVEL BUDGET (TRAVEL TO INDIA | TO KIDS | WORLD TRAVEL)</td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col3}px` }}>
                      <ExcelTextInput value={data.lifeGoalsNote1} onChange={(val: string) => setData(prev => ({ ...prev, lifeGoalsNote1: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col4}px` }}>
                      <ExcelNumberInput value={data.travelBudget} onChange={(val: string) => handleNumberInput('travelBudget', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#14</td>
                    <td className="border border-black px-2 py-1 text-sm">VACATION HOME | FARM HOUSE | NEW LUXURY HOME</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.lifeGoalsNote2} onChange={(val: string) => setData(prev => ({ ...prev, lifeGoalsNote2: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.vacationHome} onChange={(val: string) => handleNumberInput('vacationHome', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#15</td>
                    <td className="border border-black px-2 py-1 text-sm">CHARITY FOUNDATION | OLD AGE HOME | TEMPLE ETC.,</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.lifeGoalsNote3} onChange={(val: string) => setData(prev => ({ ...prev, lifeGoalsNote3: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.charity} onChange={(val: string) => handleNumberInput('charity', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#16</td>
                    <td className="border border-black px-2 py-1 text-sm">OTHER LIFE GOALS (BOAT | RV | EXOTIC CAR | JEWELLERY ETC.)</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.lifeGoalsNote4} onChange={(val: string) => setData(prev => ({ ...prev, lifeGoalsNote4: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.otherGoals} onChange={(val: string) => handleNumberInput('otherGoals', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legacy */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <ResizableHeader column="col1" width={columnWidths.col1}>#</ResizableHeader>
                    <ResizableHeader column="col2" width={columnWidths.col2}>LEGACY PLANNING</ResizableHeader>
                    <ResizableHeader column="col3" width={columnWidths.col3}>NOTES</ResizableHeader>
                    <ResizableHeader column="col4" width={columnWidths.col4}>AMOUNT</ResizableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold" style={{ width: `${columnWidths.col1}px` }}>#17</td>
                    <td className="border border-black px-2 py-1 text-sm">HEADSTART FUND FOR KIDS PRIMARY HOME OR BUSINESS</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.legacyNote1} onChange={(val: string) => setData(prev => ({ ...prev, legacyNote1: val }))} />
                    </td>
                    <td className="border border-black p-0" style={{ width: `${columnWidths.col4}px` }}>
                      <ExcelNumberInput value={data.headstartFund} onChange={(val: string) => handleNumberInput('headstartFund', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#18</td>
                    <td className="border border-black px-2 py-1 text-sm">LEGACY ASSET FOR KIDS | FAMILY LEGACY</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.legacyNote2} onChange={(val: string) => setData(prev => ({ ...prev, legacyNote2: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.familyLegacy} onChange={(val: string) => handleNumberInput('familyLegacy', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#19</td>
                    <td className="border border-black px-2 py-1 text-sm">RETIRE PARENTS | SPECIAL NEEDS KIDS | FAMILY SUPPORT</td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={data.legacyNote3} onChange={(val: string) => setData(prev => ({ ...prev, legacyNote3: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={data.familySupport} onChange={(val: string) => handleNumberInput('familySupport', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Requirement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <td className="border border-black px-4 py-3 text-lg font-bold">TOTAL REQUIREMENT</td>
                    <td className="border border-black px-4 py-3 text-right text-2xl font-bold text-green-700 w-64">
                      {formatCurrency(data.totalRequirement)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div className="bg-black text-white text-xs text-center py-3 rounded">
              DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </>
        )}

        {/* ASSETS TAB CONTENT */}
        {activeTab === 'assets' && (
          <>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED @ 65</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#1</td>
                    <td className="border border-black px-2 py-1 text-sm">CURRENT 401K | 403B</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret1_him} onChange={(e) => setAssets(prev => ({ ...prev, ret1_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret1_her} onChange={(e) => setAssets(prev => ({ ...prev, ret1_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ret1_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret1_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret1_present} onChange={(val: string) => handleAssetsNumberInput('ret1_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret1_projected} onChange={(val: string) => handleAssetsNumberInput('ret1_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#2</td>
                    <td className="border border-black px-2 py-1 text-sm">COMPANY MATCH %</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret2_him} onChange={(e) => setAssets(prev => ({ ...prev, ret2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret2_her} onChange={(e) => setAssets(prev => ({ ...prev, ret2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0" colSpan={3}>
                      <ExcelTextInput value={assets.ret2_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret2_notes: val }))} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#3</td>
                    <td className="border border-black px-2 py-1 text-sm">ARE YOU MAX FUNDING (~$22.5K)</td>
                    <td className="border border-black" colSpan={2}></td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ret3_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret3_notes: val }))} />
                    </td>
                    <td className="border border-black"></td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret3_projected} onChange={(val: string) => handleAssetsNumberInput('ret3_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#4</td>
                    <td className="border border-black px-2 py-1 text-sm">PREVIOUS 401K | ROLLOVER 401K</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret4_him} onChange={(e) => setAssets(prev => ({ ...prev, ret4_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret4_her} onChange={(e) => setAssets(prev => ({ ...prev, ret4_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ret4_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret4_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret4_present} onChange={(val: string) => handleAssetsNumberInput('ret4_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret4_projected} onChange={(val: string) => handleAssetsNumberInput('ret4_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#5</td>
                    <td className="border border-black px-2 py-1 text-sm">TRADITIONAL IRA | SEP-IRA [TAX-DEFERRED]</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret5_him} onChange={(e) => setAssets(prev => ({ ...prev, ret5_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret5_her} onChange={(e) => setAssets(prev => ({ ...prev, ret5_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ret5_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret5_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret5_present} onChange={(val: string) => handleAssetsNumberInput('ret5_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret5_projected} onChange={(val: string) => handleAssetsNumberInput('ret5_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#6</td>
                    <td className="border border-black px-2 py-1 text-sm">ROTH IRA | ROTH 401K [TAX-FREE]</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret6_him} onChange={(e) => setAssets(prev => ({ ...prev, ret6_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret6_her} onChange={(e) => setAssets(prev => ({ ...prev, ret6_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ret6_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret6_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret6_present} onChange={(val: string) => handleAssetsNumberInput('ret6_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret6_projected} onChange={(val: string) => handleAssetsNumberInput('ret6_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#7</td>
                    <td className="border border-black px-2 py-1 text-sm">ESPP | RSU | ANNUITIES | PENSION</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret7_him} onChange={(e) => setAssets(prev => ({ ...prev, ret7_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret7_her} onChange={(e) => setAssets(prev => ({ ...prev, ret7_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ret7_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ret7_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret7_present} onChange={(val: string) => handleAssetsNumberInput('ret7_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ret7_projected} onChange={(val: string) => handleAssetsNumberInput('ret7_projected', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* REAL ESTATE INVESTMENTS (USA) - 4 rows */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">REAL ESTATE INVESTMENTS (USA)</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED @ 65</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#8</td>
                    <td className="border border-black px-2 py-1 text-sm">PERSONAL HOME</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re1_him} onChange={(e) => setAssets(prev => ({ ...prev, re1_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re1_her} onChange={(e) => setAssets(prev => ({ ...prev, re1_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.re1_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, re1_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re1_present} onChange={(val: string) => handleAssetsNumberInput('re1_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re1_projected} onChange={(val: string) => handleAssetsNumberInput('re1_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#9</td>
                    <td className="border border-black px-2 py-1 text-sm">REAL ESTATE PROPERTIES | RENTALS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re2_him} onChange={(e) => setAssets(prev => ({ ...prev, re2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re2_her} onChange={(e) => setAssets(prev => ({ ...prev, re2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.re2_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, re2_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re2_present} onChange={(val: string) => handleAssetsNumberInput('re2_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re2_projected} onChange={(val: string) => handleAssetsNumberInput('re2_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#10</td>
                    <td className="border border-black px-2 py-1 text-sm">REAL ESTATE LAND PARCELS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re3_him} onChange={(e) => setAssets(prev => ({ ...prev, re3_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re3_her} onChange={(e) => setAssets(prev => ({ ...prev, re3_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.re3_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, re3_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re3_present} onChange={(val: string) => handleAssetsNumberInput('re3_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re3_projected} onChange={(val: string) => handleAssetsNumberInput('re3_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#11</td>
                    <td className="border border-black px-2 py-1 text-sm">INHERITANCE IN THE USA</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re4_him} onChange={(e) => setAssets(prev => ({ ...prev, re4_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re4_her} onChange={(e) => setAssets(prev => ({ ...prev, re4_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.re4_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, re4_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re4_present} onChange={(val: string) => handleAssetsNumberInput('re4_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.re4_projected} onChange={(val: string) => handleAssetsNumberInput('re4_projected', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* STOCKS | BUSINESS | INCOME (USA) - 7 rows - CONTINUED IN NEXT MESSAGE */}


            {/* STOCKS | BUSINESS | INCOME (USA) - 7 rows */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">STOCKS | BUSINESS | INCOME (USA)</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED @ 65</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#12</td>
                    <td className="border border-black px-2 py-1 text-sm">STOCKS | MFs | BONDS | ETFs (OUTSIDE OF 401K)</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb1_him} onChange={(e) => setAssets(prev => ({ ...prev, sb1_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb1_her} onChange={(e) => setAssets(prev => ({ ...prev, sb1_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb1_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb1_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb1_present} onChange={(val: string) => handleAssetsNumberInput('sb1_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb1_projected} onChange={(val: string) => handleAssetsNumberInput('sb1_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#13</td>
                    <td className="border border-black px-2 py-1 text-sm">DO YOU OWN A BUSINESS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb2_him} onChange={(e) => setAssets(prev => ({ ...prev, sb2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb2_her} onChange={(e) => setAssets(prev => ({ ...prev, sb2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb2_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb2_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb2_present} onChange={(val: string) => handleAssetsNumberInput('sb2_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb2_projected} onChange={(val: string) => handleAssetsNumberInput('sb2_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#14</td>
                    <td className="border border-black px-2 py-1 text-sm">ALTERNATIVE INVESTMENTS (PRIVATE EQUITY, CROWD FUNDING, ETC.)</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb3_him} onChange={(e) => setAssets(prev => ({ ...prev, sb3_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb3_her} onChange={(e) => setAssets(prev => ({ ...prev, sb3_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb3_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb3_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb3_present} onChange={(val: string) => handleAssetsNumberInput('sb3_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb3_projected} onChange={(val: string) => handleAssetsNumberInput('sb3_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#15</td>
                    <td className="border border-black px-2 py-1 text-sm">CERTIFICATE OF DEPOSITS (BANK CDs)</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb4_him} onChange={(e) => setAssets(prev => ({ ...prev, sb4_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb4_her} onChange={(e) => setAssets(prev => ({ ...prev, sb4_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb4_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb4_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb4_present} onChange={(val: string) => handleAssetsNumberInput('sb4_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb4_projected} onChange={(val: string) => handleAssetsNumberInput('sb4_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#16</td>
                    <td className="border border-black px-2 py-1 text-sm">CASH IN BANK + EMERGENCY FUND</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb5_him} onChange={(e) => setAssets(prev => ({ ...prev, sb5_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb5_her} onChange={(e) => setAssets(prev => ({ ...prev, sb5_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb5_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb5_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb5_present} onChange={(val: string) => handleAssetsNumberInput('sb5_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb5_projected} onChange={(val: string) => handleAssetsNumberInput('sb5_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#17</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL HOUSE-HOLD INCOME</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb6_him} onChange={(e) => setAssets(prev => ({ ...prev, sb6_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb6_her} onChange={(e) => setAssets(prev => ({ ...prev, sb6_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb6_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb6_notes: val }))} />
                    </td>
                    <td className="border border-black p-0" colSpan={2}>
                      <ExcelNumberInput value={assets.sb6_amount} onChange={(val: string) => handleAssetsNumberInput('sb6_amount', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#18</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL SAVINGS GOING FORWARD</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb7_him} onChange={(e) => setAssets(prev => ({ ...prev, sb7_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb7_her} onChange={(e) => setAssets(prev => ({ ...prev, sb7_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.sb7_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, sb7_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb7_amount} onChange={(val: string) => handleAssetsNumberInput('sb7_amount', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.sb7_projected} onChange={(val: string) => handleAssetsNumberInput('sb7_projected', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FAMILY PROTECTION & INSURANCE - 8 rows - CONTINUED */}


            {/* FAMILY PROTECTION & INSURANCE - 8 rows */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">FAMILY PROTECTION & INSURANCE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT CASH VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">FUTURE LEGACY VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#19</td>
                    <td className="border border-black px-2 py-1 text-sm">LIFE INSURANCE AT WORK</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp1_him} onChange={(e) => setAssets(prev => ({ ...prev, fp1_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp1_her} onChange={(e) => setAssets(prev => ({ ...prev, fp1_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.fp1_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp1_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fp1_cash} onChange={(val: string) => handleAssetsNumberInput('fp1_cash', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fp1_legacy} onChange={(val: string) => handleAssetsNumberInput('fp1_legacy', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#20</td>
                    <td className="border border-black px-2 py-1 text-sm">LIFE INSURANCE OUTSIDE WORK</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp2_him} onChange={(e) => setAssets(prev => ({ ...prev, fp2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp2_her} onChange={(e) => setAssets(prev => ({ ...prev, fp2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.fp2_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp2_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fp2_cash} onChange={(val: string) => handleAssetsNumberInput('fp2_cash', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fp2_legacy} onChange={(val: string) => handleAssetsNumberInput('fp2_legacy', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#21</td>
                    <td className="border border-black px-2 py-1 text-sm">IS IT CASH VALUE LIFE INSURANCE?</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp3_him} onChange={(e) => setAssets(prev => ({ ...prev, fp3_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp3_her} onChange={(e) => setAssets(prev => ({ ...prev, fp3_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0" colSpan={3}>
                      <ExcelTextInput value={assets.fp3_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp3_notes: val }))} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#22</td>
                    <td className="border border-black px-2 py-1 text-sm">WHICH COMPANY? HOW LONG?</td>
                    <td className="border border-black" colSpan={5}>
                      <ExcelTextInput value={assets.fp4_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp4_notes: val }))} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#23</td>
                    <td className="border border-black px-2 py-1 text-sm">SHORT TERM | LONG TERM DISABILITY AT WORK</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp5_him} onChange={(e) => setAssets(prev => ({ ...prev, fp5_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp5_her} onChange={(e) => setAssets(prev => ({ ...prev, fp5_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0" colSpan={3}>
                      <ExcelTextInput value={assets.fp5_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp5_notes: val }))} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#24</td>
                    <td className="border border-black px-2 py-1 text-sm">LONG TERM CARE OUTSIDE OF WORK</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp6_him} onChange={(e) => setAssets(prev => ({ ...prev, fp6_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp6_her} onChange={(e) => setAssets(prev => ({ ...prev, fp6_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.fp6_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp6_notes: val }))} />
                    </td>
                    <td className="border border-black p-0" colSpan={2}>
                      <ExcelNumberInput value={assets.fp6_present} onChange={(val: string) => handleAssetsNumberInput('fp6_present', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#25</td>
                    <td className="border border-black px-2 py-1 text-sm">HEALTH SAVINGS ACCOUNT (HSA)</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp7_him} onChange={(e) => setAssets(prev => ({ ...prev, fp7_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp7_her} onChange={(e) => setAssets(prev => ({ ...prev, fp7_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.fp7_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp7_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fp7_present} onChange={(val: string) => handleAssetsNumberInput('fp7_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fp7_projected} onChange={(val: string) => handleAssetsNumberInput('fp7_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#26</td>
                    <td className="border border-black px-2 py-1 text-sm">MORTGAGE PROTECTION INSURANCE</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp8_him} onChange={(e) => setAssets(prev => ({ ...prev, fp8_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fp8_her} onChange={(e) => setAssets(prev => ({ ...prev, fp8_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0" colSpan={3}>
                      <ExcelTextInput value={assets.fp8_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fp8_notes: val }))} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* COLLEGE PLANNING / ESTATE PLANNING - 2 rows */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">COLLEGE PLANNING / ESTATE PLANNING</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-20">CHILD1</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-20">CHILD2</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#27</td>
                    <td className="border border-black px-2 py-1 text-sm">529 PLANS | STATE PRE-PAID PLANS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ce1_child1} onChange={(e) => setAssets(prev => ({ ...prev, ce1_child1: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ce1_child2} onChange={(e) => setAssets(prev => ({ ...prev, ce1_child2: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.ce1_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ce1_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ce1_present} onChange={(val: string) => handleAssetsNumberInput('ce1_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.ce1_projected} onChange={(val: string) => handleAssetsNumberInput('ce1_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#28</td>
                    <td className="border border-black px-2 py-1 text-sm">WILL & TRUST (ESTATE PLANNING)</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ce2_him} onChange={(e) => setAssets(prev => ({ ...prev, ce2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ce2_her} onChange={(e) => setAssets(prev => ({ ...prev, ce2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0" colSpan={3}>
                      <ExcelTextInput value={assets.ce2_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, ce2_notes: val }))} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FOREIGN ASSETS (OUTSIDE OF THE USA) - 2 rows */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">FOREIGN ASSETS (OUTSIDE OF THE USA)</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED @ 65</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#29</td>
                    <td className="border border-black px-2 py-1 text-sm">REAL ESTATE ASSETS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fa1_him} onChange={(e) => setAssets(prev => ({ ...prev, fa1_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fa1_her} onChange={(e) => setAssets(prev => ({ ...prev, fa1_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.fa1_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fa1_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fa1_present} onChange={(val: string) => handleAssetsNumberInput('fa1_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fa1_projected} onChange={(val: string) => handleAssetsNumberInput('fa1_projected', val)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#30</td>
                    <td className="border border-black px-2 py-1 text-sm">NON-REAL ESTATE ASSETS (FIXED DEPOSITS, STOCKS, LOANS, JEWELLERY, INVESTMENTS)</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fa2_him} onChange={(e) => setAssets(prev => ({ ...prev, fa2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.fa2_her} onChange={(e) => setAssets(prev => ({ ...prev, fa2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelTextInput value={assets.fa2_notes} onChange={(val: string) => setAssets(prev => ({ ...prev, fa2_notes: val }))} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fa2_present} onChange={(val: string) => handleAssetsNumberInput('fa2_present', val)} />
                    </td>
                    <td className="border border-black p-0">
                      <ExcelNumberInput value={assets.fa2_projected} onChange={(val: string) => handleAssetsNumberInput('fa2_projected', val)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TOTAL ASSETS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <td className="border border-black px-4 py-3 text-lg font-bold">TOTAL ASSETS</td>
                    <td className="border border-black px-4 py-3 text-right text-lg font-bold text-green-700">
                      Present Value: {formatCurrency(assets.totalPresent)}
                    </td>
                    <td className="border border-black px-4 py-3 text-right text-lg font-bold text-blue-700">
                      Projected @ 65: {formatCurrency(assets.totalProjected)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Compliance Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="text-xs space-y-2">
                <p className="font-semibold">RISK AND COMPLIANCE FROM FOREIGN OR OFF-SHORE ASSETS AND INCOME</p>
                <p><strong>** FBAR (Foreign Bank Account Report)</strong> - Over $10K Cash Value in Foreign Accounts - Report to US Treasury and No Tax Implications - Ex: Cash in Bank, Stocks, Business, Life Insurance</p>
                <p><strong>** FATCA (Foreign Account Tax Compliance Act)</strong> - Over $50k Foreign Financial Assets - Report to IRS with applicable Taxes (Form 8938) - Rental, Interest, Stocks, Business</p>
              </div>
            {/* Disclaimer */}
            <div className="bg-black text-white text-xs text-center py-3 rounded">
              Disclaimer: For Education Purpose Only. We Do Not Provide Any Legal Or Tax Advice
            </div>
			</>
        )}
      </main>
    </div>
  );
}

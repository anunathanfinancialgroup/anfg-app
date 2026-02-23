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

// ============================================
// END OF PART 1
// Continue with Part 2 for helper functions,
// save logic, and UI component definitions
// ============================================
// ============================================
// PART 2 OF 3: Save Logic, Helper Functions, UI Components
// ============================================

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

// ============================================
// END OF PART 2
// Continue with Part 3 for the complete JSX
// (Header, Client Info, Goals Section, Assets Section)
// ============================================

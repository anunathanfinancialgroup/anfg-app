"use client";

/**
 * Financial Need Analysis (FNA) Calculator
 * AnuNathan Financial Group
 * 
 * Complete financial planning calculator based on Excel template
 * Includes: College, Wedding, Retirement, Healthcare, Life Goals, Legacy Planning
 * 
 * File: app/fna/page.tsx
 * 
 * Features:
 * - Auto-calculations matching Excel formulas
 * - Color-coded sections (matching Excel)
 * - Tooltips with guidance from Excel comments
 * - Save to Supabase database
 * - Currency formatting with $ sign
 * - Responsive design
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Import Supabase client
// Make sure you have this file: lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Excel color scheme
const COLORS = {
  headerBg: '#BDD7EE',    // Light blue headers
  whiteBg: '#FFFFFF',     // Normal rows
  yellowBg: '#FFFF00',    // Highlighted totals
  headerText: '#000000',
  normalText: '#0f172a',
};

interface FNAData {
  fnaId?: string;
  clientId?: string;
  clientName: string;
  analysisDate: string;
  
  // Personal Info (from fna_records)
  spouseName: string;
  clientDob: string;
  spouseDob: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  homePhone: string;
  mobilePhone: string;
  personalEmail: string;
  spouseMobilePhone: string;
  spouseEmail: string;
  moreChildrenPlanned: boolean;
  moreChildrenCount: number;
  goalsText: string;
  ownOrRent: string;
  
  // College Planning
  child1CollegeName: string;
  child1CollegeYear: string;
  child1CollegeAmount: number;
  child2CollegeName: string;
  child2CollegeYear: string;
  child2CollegeAmount: number;
  
  // Wedding Planning
  child1WeddingAmount: number;
  child2WeddingAmount: number;
  
  // Retirement Planning
  currentAge: number;
  yearsToRetirement: number; // Calculated: 65 - currentAge
  retirementYears: number; // Calculated: 85 - currentAge
  monthlyIncomeNeeded: number;
  monthlyRetirementIncome: number; // Calculated with 3% inflation
  annualRetirementIncome: number; // Calculated: monthly * 12
  totalRetirementIncome: number; // Calculated: annual * retirementYears
  
  // Healthcare
  healthcareExpenses: number;
  longTermCare: number; // Calculated: healthcare * 0.03
  
  // Life Goals
  travelBudget: number;
  vacationHome: number;
  charity: number;
  otherGoals: number;
  
  // Legacy
  headstartFund: number;
  familyLegacy: number;
  familySupport: number;
  
  // Total
  totalRequirement: number; // Calculated
}

const initialData: FNAData = {
  clientName: "",
  analysisDate: new Date().toISOString().split('T')[0],
  spouseName: "",
  clientDob: "",
  spouseDob: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  homePhone: "",
  mobilePhone: "",
  personalEmail: "",
  spouseMobilePhone: "",
  spouseEmail: "",
  moreChildrenPlanned: false,
  moreChildrenCount: 0,
  goalsText: "",
  ownOrRent: "Own",
  child1CollegeName: "CHILD 1",
  child1CollegeYear: "2027",
  child1CollegeAmount: 400000,
  child2CollegeName: "CHILD 2",
  child2CollegeYear: "2033",
  child2CollegeAmount: 400000,
  child1WeddingAmount: 100000,
  child2WeddingAmount: 100000,
  currentAge: 55,
  yearsToRetirement: 10,
  retirementYears: 30,
  monthlyIncomeNeeded: 5000,
  monthlyRetirementIncome: 0,
  annualRetirementIncome: 0,
  totalRetirementIncome: 0,
  healthcareExpenses: 315000,
  longTermCare: 0,
  travelBudget: 500000,
  vacationHome: 50000,
  charity: 50000,
  otherGoals: 100000,
  headstartFund: 0,
  familyLegacy: 0,
  familySupport: 0,
  totalRequirement: 0
};

export default function FNAPage() {
  const router = useRouter();
  const [data, setData] = useState<FNAData>(initialData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Check authentication
  useEffect(() => {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('canfs_auth='));
    
    if (!authCookie) {
      router.push('/');
    }
  }, [router]);

  // Auto-calculate formulas whenever dependencies change
  useEffect(() => {
    calculateFormulas();
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

  const calculateFormulas = () => {
    setData(prev => {
      // #5: Years to Retirement = 65 - Current Age
      const yearsToRetirement = Math.max(0, 65 - prev.currentAge);
      
      // #6: Retirement Years = 85 - Current Age
      const retirementYears = Math.max(0, 85 - prev.currentAge);
      
      // #8: Monthly Retirement Income with 3% inflation
      // Formula: PV * (1 + rate)^nper
      const inflationRate = 0.03;
      const monthlyRetirementIncome = prev.monthlyIncomeNeeded * Math.pow(1 + inflationRate, yearsToRetirement);
      
      // #9: Annual Retirement Income = Monthly * 12
      const annualRetirementIncome = monthlyRetirementIncome * 12;
      
      // #10: Total Retirement Income = Annual * Retirement Years
      const totalRetirementIncome = annualRetirementIncome * retirementYears;
      
      // #12: Long Term Care = Healthcare * 3%
      const longTermCare = prev.healthcareExpenses * 0.03;
      
      // Total Requirement = Sum of all categories
      const totalRequirement = 
        prev.child1CollegeAmount +
        prev.child2CollegeAmount +
        prev.child1WeddingAmount +
        prev.child2WeddingAmount +
        totalRetirementIncome +
        prev.healthcareExpenses +
        longTermCare +
        prev.travelBudget +
        prev.vacationHome +
        prev.charity +
        prev.otherGoals +
        prev.headstartFund +
        prev.familyLegacy +
        prev.familySupport;

      return {
        ...prev,
        yearsToRetirement,
        retirementYears,
        monthlyRetirementIncome,
        annualRetirementIncome,
        totalRetirementIncome,
        longTermCare,
        totalRequirement
      };
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleInputChange = (field: keyof FNAData, value: string | number | boolean) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!data.clientName.trim()) {
      showMessage("Please enter client name", 'error');
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // For now, we'll use a placeholder client_id
      // In production, you'll get this from your client selection
      const clientId = crypto.randomUUID();

      // Insert main FNA record
      const { data: fnaRecord, error: fnaError } = await supabase
        .from('fna_records')
        .insert([{
          client_id: clientId,
          analysis_date: data.analysisDate,
          spouse_name: data.spouseName,
          spouse_dob: data.spouseDob || null,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          client_dob: data.clientDob || null,
          home_phone: data.homePhone,
          mobile_phone: data.mobilePhone,
          personal_email: data.personalEmail,
          spouse_mobile_phone: data.spouseMobilePhone,
          spouse_email: data.spouseEmail,
          more_children_planned: data.moreChildrenPlanned,
          more_children_count: data.moreChildrenCount,
          goals_text: data.goalsText,
          own_or_rent: data.ownOrRent,
          notes: `Client: ${data.clientName}`
        }])
        .select()
        .single();

      if (fnaError) throw fnaError;

      const fnaId = fnaRecord.fna_id;

      // Insert college planning
      if (data.child1CollegeAmount > 0 || data.child2CollegeAmount > 0) {
        await supabase.from('fna_college').insert([
          {
            fna_id: fnaId,
            child_number: 1,
            child_name: data.child1CollegeName,
            year_from_today: parseInt(data.child1CollegeYear) - new Date().getFullYear(),
            amount: data.child1CollegeAmount
          },
          {
            fna_id: fnaId,
            child_number: 2,
            child_name: data.child2CollegeName,
            year_from_today: parseInt(data.child2CollegeYear) - new Date().getFullYear(),
            amount: data.child2CollegeAmount
          }
        ]);
      }

      // Insert wedding planning
      if (data.child1WeddingAmount > 0 || data.child2WeddingAmount > 0) {
        await supabase.from('fna_wedding').insert([
          {
            fna_id: fnaId,
            child_number: 1,
            child_name: data.child1CollegeName,
            amount: data.child1WeddingAmount
          },
          {
            fna_id: fnaId,
            child_number: 2,
            child_name: data.child2CollegeName,
            amount: data.child2WeddingAmount
          }
        ]);
      }

      // Insert retirement planning
      await supabase.from('fna_retirement').insert([{
        fna_id: fnaId,
        current_age: data.currentAge,
        years_to_retirement: data.yearsToRetirement,
        retirement_years: data.retirementYears,
        monthly_income_needed: data.monthlyIncomeNeeded,
        monthly_retirement_income: data.monthlyRetirementIncome,
        annual_retirement_income: data.annualRetirementIncome,
        total_retirement_income: data.totalRetirementIncome
      }]);

      // Insert healthcare
      await supabase.from('fna_healthcare').insert([{
        fna_id: fnaId,
        healthcare_expenses: data.healthcareExpenses,
        long_term_care: data.longTermCare
      }]);

      // Insert life goals
      await supabase.from('fna_life_goals').insert([{
        fna_id: fnaId,
        travel_budget: data.travelBudget,
        vacation_home: data.vacationHome,
        charity: data.charity,
        other_goals: data.otherGoals
      }]);

      // Insert legacy
      await supabase.from('fna_legacy').insert([{
        fna_id: fnaId,
        headstart_fund: data.headstartFund,
        family_legacy: data.familyLegacy,
        family_support: data.familySupport
      }]);

      showMessage(`FNA saved successfully! ID: ${fnaId}`, 'success');
      
      // Update local state with fnaId
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

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all values to defaults?")) {
      setData(initialData);
      showMessage("Form reset to default values", 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/anunathan-logo.png" 
                alt="AnuNathan Financial Group" 
                width={80} 
                height={80}
                className="object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Client Financial Need Analysis
                </h1>
                <p className="text-sm text-gray-600">
                  Building careers, protecting families
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout ➜
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 no-print">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
          >
            {saving ? "Saving..." : "💾 Save FNA"}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Reset
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🖨️ Print
          </button>
          {message && (
            <div className={`ml-auto px-4 py-2 rounded-lg ${
              messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* FNA Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Client Info Section */}
          <div className="mb-8 print-section">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">NAME:</label>
                <input
                  type="text"
                  value={data.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">DATE:</label>
                <input
                  type="date"
                  value={data.analysisDate}
                  onChange={(e) => handleInputChange('analysisDate', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Kids College Planning */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 mb-2" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-2 px-3 py-2 font-bold">KIDS COLLEGE PLANNING</div>
              <div className="px-3 py-2 font-bold text-center">YEARS FROM TODAY</div>
              <div className="px-3 py-2 font-bold text-center">AMOUNT</div>
            </div>
            
            {/* Child 1 */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#1</div>
              <input
                type="text"
                value={data.child1CollegeName}
                onChange={(e) => handleInputChange('child1CollegeName', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1"
                title="Name of first child"
              />
              <input
                type="number"
                value={data.child1CollegeYear}
                onChange={(e) => handleInputChange('child1CollegeYear', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-center"
                title="Expected year of college enrollment"
              />
              <input
                type="number"
                value={data.child1CollegeAmount}
                onChange={(e) => handleInputChange('child1CollegeAmount', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
                title="Total college cost for 4 years"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.child1CollegeAmount)}
            </div>

            {/* Child 2 */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#2</div>
              <input
                type="text"
                value={data.child2CollegeName}
                onChange={(e) => handleInputChange('child2CollegeName', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1"
              />
              <input
                type="number"
                value={data.child2CollegeYear}
                onChange={(e) => handleInputChange('child2CollegeYear', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-center"
              />
              <input
                type="number"
                value={data.child2CollegeAmount}
                onChange={(e) => handleInputChange('child2CollegeAmount', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {formatCurrency(data.child2CollegeAmount)}
            </div>
          </div>

          {/* Kids Wedding Planning */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 mb-2" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-2 px-3 py-2 font-bold">KIDS WEDDING PLANNING</div>
              <div className="px-3 py-2 font-bold text-center">YEARS FROM TODAY</div>
              <div className="px-3 py-2 font-bold text-center">AMOUNT</div>
            </div>

            {/* Child 1 Wedding */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#3</div>
              <div className="px-3 py-2">{data.child1CollegeName}</div>
              <div></div>
              <input
                type="number"
                value={data.child1WeddingAmount}
                onChange={(e) => handleInputChange('child1WeddingAmount', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
                title="Estimated wedding expenses"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.child1WeddingAmount)}
            </div>

            {/* Child 2 Wedding */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#4</div>
              <div className="px-3 py-2">{data.child2CollegeName}</div>
              <div></div>
              <input
                type="number"
                value={data.child2WeddingAmount}
                onChange={(e) => handleInputChange('child2WeddingAmount', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {formatCurrency(data.child2WeddingAmount)}
            </div>
          </div>

          {/* Retirement Planning */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 mb-2" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-3 px-3 py-2 font-bold">RETIREMENT PLANNING</div>
              <div className="px-3 py-2 font-bold text-center">AMOUNT</div>
            </div>

            {/* #5 - Years to Retirement */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#5</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                NUMBER OF YEARS TO RETIREMENT AGE OF 65
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={data.currentAge}
                  onChange={(e) => handleInputChange('currentAge', parseInt(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded px-3 py-1 text-center"
                  placeholder="Age"
                  title="Your current age"
                />
                <div className="flex items-center px-3 py-1 bg-gray-100 rounded font-semibold">
                  {data.yearsToRetirement}
                </div>
              </div>
            </div>

            {/* #6 - Retirement Years */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#6</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                NUMBER OF YEARS IN RETIREMENT (*UNTIL AGE 85 OR 90)
              </div>
              <div className="flex gap-2">
                <div className="w-20 px-3 py-1 text-center">{data.currentAge}</div>
                <div className="flex items-center px-3 py-1 bg-gray-100 rounded font-semibold">
                  {data.retirementYears}
                </div>
              </div>
            </div>

            {/* #7 - Monthly Income Needed */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#7</div>
              <div className="col-span-2 px-3 py-2 text-sm" title="PROPERTY TAXES + CARS + INSURANCE + FOOD + REPAIRS + UTILITIES + LIVING">
                MONTHLY INCOME NEEDED IN TODAY'S DOLLARS (PRE-TAX)
              </div>
              <input
                type="number"
                value={data.monthlyIncomeNeeded}
                onChange={(e) => handleInputChange('monthlyIncomeNeeded', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.monthlyIncomeNeeded)}
            </div>

            {/* #8 - Monthly Retirement Income with Inflation */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#8</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                MONTHLY RETIREMENT INCOME @ 65 w-INFLATION 3%
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded text-right font-semibold">
                {formatCurrency(data.monthlyRetirementIncome)}
              </div>
            </div>

            {/* #9 - Annual Retirement Income */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#9</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                ANNUAL RETIREMENT INCOME @ 65 w-INFLATION 3%
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded text-right font-semibold">
                {formatCurrency(data.annualRetirementIncome)}
              </div>
            </div>

            {/* #10 - Total Retirement Income */}
            <div className="grid grid-cols-4 gap-2 mb-1" style={{ backgroundColor: COLORS.yellowBg }}>
              <div className="px-3 py-2 text-sm font-semibold">#10</div>
              <div className="col-span-2 px-3 py-2 text-sm font-bold">
                TOTAL RETIREMENT INCOME
              </div>
              <div className="px-3 py-1 rounded text-right font-bold text-lg">
                {formatCurrency(data.totalRetirementIncome)}
              </div>
            </div>
          </div>

          {/* Healthcare and Long Term Care */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 mb-2" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-2 px-3 py-2 font-bold">HEALTH CARE AND LONG TERM CARE PLANNING</div>
              <div className="px-3 py-2 font-bold text-center">NOTES</div>
              <div className="px-3 py-2 font-bold text-center">AMOUNT</div>
            </div>

            {/* #11 - Healthcare Expenses */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#11</div>
              <div className="px-3 py-2 text-sm" title="DOCTORS CO-PAYS, LABS CO-PAYS, PHARMACY CO-PAYS ETC.,">
                HEALTH CARE OUT-OF-POCKET EXPENSES (PLAN FOR ~20+ YRS)
              </div>
              <div className="px-3 py-2 text-xs text-gray-600">
                ~$315K FOR COUPLE IN TODAY'S DOLLARS
              </div>
              <input
                type="number"
                value={data.healthcareExpenses}
                onChange={(e) => handleInputChange('healthcareExpenses', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.healthcareExpenses)}
            </div>

            {/* #12 - Long Term Care */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#12</div>
              <div className="px-3 py-2 text-sm" title="AVERAGE PERSON STAYS IN LTC BETWEEN 0 TO 5 YEARS">
                LONG TERM CARE | DISABILITY (PLAN FOR ATLEAST 2+ YRS EACH)
              </div>
              <div className="px-3 py-2 text-xs text-gray-600">
                (ADD 3% INFLATION FOR FUTURE)
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded text-right font-semibold">
                {formatCurrency(data.longTermCare)}
              </div>
            </div>
          </div>

          {/* Life Goals Planning */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 mb-2" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-2 px-3 py-2 font-bold">LIFE GOALS PLANNING</div>
              <div className="px-3 py-2 font-bold text-center">NOTES</div>
              <div className="px-3 py-2 font-bold text-center">AMOUNT</div>
            </div>

            {/* #13 - Travel Budget */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#13</div>
              <div className="px-3 py-2 text-sm">
                TRAVEL BUDGET (TRAVEL TO INDIA | TO KIDS | WORLD TRAVEL)
              </div>
              <div className="px-3 py-2 text-xs text-gray-600">
                your travel plan expenses after retirement per year
              </div>
              <input
                type="number"
                value={data.travelBudget}
                onChange={(e) => handleInputChange('travelBudget', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.travelBudget)}
            </div>

            {/* #14 - Vacation Home */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#14</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                VACATION HOME | FARM HOUSE | NEW LUXURY HOME
              </div>
              <input
                type="number"
                value={data.vacationHome}
                onChange={(e) => handleInputChange('vacationHome', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.vacationHome)}
            </div>

            {/* #15 - Charity */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#15</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                CHARITY FOUNDATION | OLD AGE HOME | TEMPLE ETC.,
              </div>
              <input
                type="number"
                value={data.charity}
                onChange={(e) => handleInputChange('charity', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.charity)}
            </div>

            {/* #16 - Other Life Goals */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#16</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                OTHER LIFE GOALS (BOAT | RV | EXOTIC CAR | JEWELLERY ETC.)
              </div>
              <input
                type="number"
                value={data.otherGoals}
                onChange={(e) => handleInputChange('otherGoals', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {formatCurrency(data.otherGoals)}
            </div>
          </div>

          {/* Legacy Planning */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 mb-2" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-2 px-3 py-2 font-bold">LEGACY PLANNING</div>
              <div className="px-3 py-2 font-bold text-center">NOTES</div>
              <div className="px-3 py-2 font-bold text-center">AMOUNT</div>
            </div>

            {/* #17 - Headstart Fund */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#17</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                HEADSTART FUND FOR KIDS PRIMARY HOME OR BUSINESS
              </div>
              <input
                type="number"
                value={data.headstartFund}
                onChange={(e) => handleInputChange('headstartFund', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.headstartFund)}
            </div>

            {/* #18 - Family Legacy */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#18</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                LEGACY ASSET FOR KIDS | FAMILY LEGACY (FINAL ASSETS LIKE PRIMARY HOME + REAL ESTATE + LIFE INSURANCE)
              </div>
              <input
                type="number"
                value={data.familyLegacy}
                onChange={(e) => handleInputChange('familyLegacy', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600 mb-2">
              {formatCurrency(data.familyLegacy)}
            </div>

            {/* #19 - Family Support */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              <div className="px-3 py-2 text-sm font-semibold">#19</div>
              <div className="col-span-2 px-3 py-2 text-sm">
                RETIRE PARENTS | SPECIAL NEEDS KIDS | FAMILY SUPPORT
              </div>
              <input
                type="number"
                value={data.familySupport}
                onChange={(e) => handleInputChange('familySupport', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {formatCurrency(data.familySupport)}
            </div>
          </div>

          {/* Total Requirement */}
          <div className="mb-6 print-section">
            <div className="grid grid-cols-4 gap-2 p-4" style={{ backgroundColor: COLORS.headerBg }}>
              <div className="col-span-3 text-xl font-bold">TOTAL REQUIREMENT</div>
              <div className="text-right text-2xl font-bold text-green-700">
                {formatCurrency(data.totalRequirement)}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-black text-white text-xs text-center print-section">
            DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

/**
 * Financial Need Analysis (FNA) Calculator - Complete Fixed Version
 * 
 * All fixes applied:
 * - Input works for multi-character entry
 * - Plain button styles (no fill colors)
 * - Decimal values showing in amounts
 * - Wedding years editable
 * - Retirement notes editable
 * - Clean #12 notes field
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
  
  // Notes fields
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
  
  // Default notes
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

export default function FNAPage() {
  const router = useRouter();
  const [data, setData] = useState<FNAData>(initialData);
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

  useEffect(() => {
    calculateFormulas();
  }, [
    data.currentAge,
    data.monthlyIncomeNeeded,
    data.healthcareExpenses,
    data.retirementYears,
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
      const yearsToRetirement = prev.currentAge > 0 ? Math.max(0, 65 - prev.currentAge) : 0;
      const retirementYears = prev.currentAge > 0 ? Math.max(0, 85 - prev.currentAge) : 0;
      
      const inflationRate = 0.03;
      const monthlyRetirementIncome = prev.monthlyIncomeNeeded > 0 && yearsToRetirement > 0
        ? prev.monthlyIncomeNeeded * Math.pow(1 + inflationRate, yearsToRetirement)
        : 0;
      
      const annualRetirementIncome = monthlyRetirementIncome * 12;
      const totalRetirementIncome = annualRetirementIncome * retirementYears;
      const longTermCare = prev.healthcareExpenses * 0.03 * (retirementYears * 2);
      
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
    if (value === 0) return "";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleNumberInput = (field: keyof FNAData, value: string) => {
    const cleanValue = value.replace(/[$,]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    if (!data.clientId) {
      showMessage("Please select a client", 'error');
      return;
    }

    setSaving(true);
    try {
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

      showMessage(`FNA saved successfully!`, 'success');
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
    window.print();
  };

  const handleColumnResize = (column: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(50, newWidth)
    }));
  };

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

  // FIXED: Text input component - works for multi-character entry
  const ExcelTextInput = ({ value, onChange, readOnly = false }: any) => {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => !readOnly && onChange(e.target.value)}
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

  // FIXED: Number input component - works for multi-digit entry with decimal display
  const ExcelNumberInput = ({ value, onChange, readOnly = false, calculated = false }: any) => {
    const [localValue, setLocalValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Show formatted value when not focused, raw value when focused
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
        {/* Action Buttons - FIXED: Plain style */}
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

        {/* Financial Goals & Planning */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">FINANCIAL GOALS & PLANNING</h3>
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

        {/* Wedding Planning - FIXED: Years editable, decimals showing */}
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

        {/* Retirement Planning - FIXED: Notes editable */}
        <div className="mb-2 flex justify-end no-print">
          <button 
            onClick={() => window.open('https://www.calculator.net/retirement-calculator.html', '_blank')} 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
          >
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

        {/* Healthcare - FIXED: Removed formula from #12 notes */}
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

        {/* Total */}
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
      </main>
    </div>
  );
}

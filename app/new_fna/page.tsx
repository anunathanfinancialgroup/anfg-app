"use client";

/**
 * Financial Need Analysis (FNA) Calculator
 * AnuNathan Financial Group
 * 
 * Updated version with:
 * - Excel-style grid with cell borders
 * - Client dropdown from client_registrations
 * - Phone/email verification
 * - $ sign formatting in cells
 * - Separate cards for each section
 * - No default values (0 for uncalculated fields)
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Excel color scheme
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
}

interface FNAData {
  fnaId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  analysisDate: string;
  
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
  yearsToRetirement: number;
  retirementYears: number;
  monthlyIncomeNeeded: number;
  monthlyRetirementIncome: number;
  annualRetirementIncome: number;
  totalRetirementIncome: number;
  
  // Healthcare
  healthcareExpenses: number;
  longTermCare: number;
  
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
  totalRequirement: number;
}

const initialData: FNAData = {
  clientId: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  analysisDate: new Date().toISOString().split('T')[0],
  child1CollegeName: "",
  child1CollegeYear: "",
  child1CollegeAmount: 0,
  child2CollegeName: "",
  child2CollegeYear: "",
  child2CollegeAmount: 0,
  child1WeddingAmount: 0,
  child2WeddingAmount: 0,
  currentAge: 0,
  yearsToRetirement: 0,
  retirementYears: 0,
  monthlyIncomeNeeded: 0,
  monthlyRetirementIncome: 0,
  annualRetirementIncome: 0,
  totalRetirementIncome: 0,
  healthcareExpenses: 0,
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
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Check authentication
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

  // Load clients from database
  const loadClients = async () => {
    try {
      const { data: clientData, error } = await supabase
        .from('client_registrations')
        .select('id, first_name, last_name, phone, email')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setClients(clientData || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: `${client.first_name} ${client.last_name}`,
        clientPhone: client.phone || '',
        clientEmail: client.email || ''
      }));
    }
  };

  // Auto-calculate formulas
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
      const yearsToRetirement = prev.currentAge > 0 ? Math.max(0, 65 - prev.currentAge) : 0;
      const retirementYears = prev.currentAge > 0 ? Math.max(0, 85 - prev.currentAge) : 0;
      
      const inflationRate = 0.03;
      const monthlyRetirementIncome = prev.monthlyIncomeNeeded > 0 && yearsToRetirement > 0
        ? prev.monthlyIncomeNeeded * Math.pow(1 + inflationRate, yearsToRetirement)
        : 0;
      
      const annualRetirementIncome = monthlyRetirementIncome * 12;
      const totalRetirementIncome = annualRetirementIncome * retirementYears;
      const longTermCare = prev.healthcareExpenses * 0.03;
      
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
    if (value === 0) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleNumberInput = (field: keyof FNAData, value: string) => {
    // Remove $ and commas, parse as number
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
          notes: `FNA for ${data.clientName}`
        }])
        .select()
        .single();

      if (fnaError) throw fnaError;

      const fnaId = fnaRecord.fna_id;

      // Insert all related data
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

  const handleReset = () => {
    if (confirm("Reset all values?")) {
      setData(initialData);
    }
  };

  // Excel-style input cell
  const ExcelCell = ({ value, onChange, readOnly = false, style = {} }: any) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full px-2 py-1 border border-black text-sm ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
      style={{ ...style, fontFamily: 'Arial, sans-serif' }}
    />
  );

  const ExcelNumberCell = ({ value, onChange, readOnly = false, calculated = false }: any) => (
    <input
      type="text"
      value={value === 0 && !calculated ? '' : formatCurrency(value)}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      readOnly={readOnly}
      className={`w-full px-2 py-1 border border-black text-sm text-right ${
        readOnly || calculated ? 'bg-gray-100 font-semibold' : 'bg-white'
      }`}
      style={{ fontFamily: 'Arial, sans-serif' }}
      placeholder="$0"
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - matching dashboard style */}
      <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 mx-4 mt-4">
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
              <p className="text-xs text-gray-600">Building careers, protecting families</p>
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
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
          >
            💾 {saving ? "Saving..." : "Save FNA"}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            🔄 Reset
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🖨️ Print
          </button>
          {message && (
            <div className={`ml-auto px-4 py-2 rounded ${
              messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Client Selection Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
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
              <input
                type="text"
                value={data.clientPhone}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                placeholder="Select client to view"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="text"
                value={data.clientEmail}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                placeholder="Select client to view"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-semibold mb-1">Analysis Date</label>
            <input
              type="date"
              value={data.analysisDate}
              onChange={(e) => setData(prev => ({ ...prev, analysisDate: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Kids College Planning Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold w-12">#</th>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold">KIDS COLLEGE PLANNING</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">YEARS FROM TODAY</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#1</td>
                <td className="border border-black p-0">
                  <ExcelCell
                    value={data.child1CollegeName}
                    onChange={(e: any) => setData(prev => ({ ...prev, child1CollegeName: e.target.value }))}
                  />
                </td>
                <td className="border border-black p-0">
                  <ExcelCell
                    value={data.child1CollegeYear}
                    onChange={(e: any) => setData(prev => ({ ...prev, child1CollegeYear: e.target.value }))}
                  />
                </td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.child1CollegeAmount}
                    onChange={(val: string) => handleNumberInput('child1CollegeAmount', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#2</td>
                <td className="border border-black p-0">
                  <ExcelCell
                    value={data.child2CollegeName}
                    onChange={(e: any) => setData(prev => ({ ...prev, child2CollegeName: e.target.value }))}
                  />
                </td>
                <td className="border border-black p-0">
                  <ExcelCell
                    value={data.child2CollegeYear}
                    onChange={(e: any) => setData(prev => ({ ...prev, child2CollegeYear: e.target.value }))}
                  />
                </td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.child2CollegeAmount}
                    onChange={(val: string) => handleNumberInput('child2CollegeAmount', val)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Kids Wedding Planning Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold w-12">#</th>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold">KIDS WEDDING PLANNING</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">YEARS FROM TODAY</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#3</td>
                <td className="border border-black px-2 py-1 text-sm">{data.child1CollegeName || 'CHILD 1'}</td>
                <td className="border border-black"></td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.child1WeddingAmount}
                    onChange={(val: string) => handleNumberInput('child1WeddingAmount', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#4</td>
                <td className="border border-black px-2 py-1 text-sm">{data.child2CollegeName || 'CHILD 2'}</td>
                <td className="border border-black"></td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.child2WeddingAmount}
                    onChange={(val: string) => handleNumberInput('child2WeddingAmount', val)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Retirement Planning Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold w-12">#</th>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold" colSpan={2}>RETIREMENT PLANNING</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#5</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>NUMBER OF YEARS TO RETIREMENT AGE OF 65</td>
                <td className="border border-black p-0">
                  <div className="flex">
                    <input
                      type="text"
                      value={data.currentAge || ''}
                      onChange={(e) => handleNumberInput('currentAge', e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-1/2 px-2 py-1 border-r border-black text-sm text-center"
                      placeholder="Age"
                    />
                    <div className="w-1/2 px-2 py-1 bg-gray-100 text-sm text-center font-semibold">
                      {data.yearsToRetirement}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#6</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>NUMBER OF YEARS IN RETIREMENT (*UNTIL AGE 85 OR 90)</td>
                <td className="border border-black p-0">
                  <div className="flex">
                    <div className="w-1/2 px-2 py-1 border-r border-black text-sm text-center">{data.currentAge || ''}</div>
                    <div className="w-1/2 px-2 py-1 bg-gray-100 text-sm text-center font-semibold">
                      {data.retirementYears}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#7</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>MONTHLY INCOME NEEDED IN TODAY'S DOLLARS (PRE-TAX)</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.monthlyIncomeNeeded}
                    onChange={(val: string) => handleNumberInput('monthlyIncomeNeeded', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#8</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>MONTHLY RETIREMENT INCOME @ 65 w-INFLATION 3%</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.monthlyRetirementIncome}
                    readOnly
                    calculated
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#9</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>ANNUAL RETIREMENT INCOME @ 65 w-INFLATION 3%</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.annualRetirementIncome}
                    readOnly
                    calculated
                  />
                </td>
              </tr>
              <tr style={{ backgroundColor: COLORS.yellowBg }}>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#10</td>
                <td className="border border-black px-2 py-1 text-sm font-bold" colSpan={2}>TOTAL RETIREMENT INCOME</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.totalRetirementIncome}
                    readOnly
                    calculated
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Healthcare Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold w-12">#</th>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold">HEALTH CARE AND LONG TERM CARE PLANNING</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-64">NOTES</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#11</td>
                <td className="border border-black px-2 py-1 text-sm">HEALTH CARE OUT-OF-POCKET EXPENSES (PLAN FOR ~20+ YRS)</td>
                <td className="border border-black px-2 py-1 text-xs text-gray-600">~$315K FOR COUPLE IN TODAY'S DOLLARS</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.healthcareExpenses}
                    onChange={(val: string) => handleNumberInput('healthcareExpenses', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#12</td>
                <td className="border border-black px-2 py-1 text-sm">LONG TERM CARE | DISABILITY (PLAN FOR ATLEAST 2+ YRS EACH)</td>
                <td className="border border-black px-2 py-1 text-xs text-gray-600">(ADD 3% INFLATION FOR FUTURE)</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.longTermCare}
                    readOnly
                    calculated
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Life Goals Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold w-12">#</th>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold">LIFE GOALS PLANNING</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-64">NOTES</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#13</td>
                <td className="border border-black px-2 py-1 text-sm">TRAVEL BUDGET (TRAVEL TO INDIA | TO KIDS | WORLD TRAVEL)</td>
                <td className="border border-black px-2 py-1 text-xs text-gray-600">your travel plan expenses after retirement per year</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.travelBudget}
                    onChange={(val: string) => handleNumberInput('travelBudget', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#14</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>VACATION HOME | FARM HOUSE | NEW LUXURY HOME</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.vacationHome}
                    onChange={(val: string) => handleNumberInput('vacationHome', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#15</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>CHARITY FOUNDATION | OLD AGE HOME | TEMPLE ETC.,</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.charity}
                    onChange={(val: string) => handleNumberInput('charity', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#16</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>OTHER LIFE GOALS (BOAT | RV | EXOTIC CAR | JEWELLERY ETC.)</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.otherGoals}
                    onChange={(val: string) => handleNumberInput('otherGoals', val)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legacy Planning Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold w-12">#</th>
                <th className="border border-black px-2 py-2 text-left text-sm font-bold">LEGACY PLANNING</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-64">NOTES</th>
                <th className="border border-black px-2 py-2 text-center text-sm font-bold w-48">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#17</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>HEADSTART FUND FOR KIDS PRIMARY HOME OR BUSINESS</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.headstartFund}
                    onChange={(val: string) => handleNumberInput('headstartFund', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#18</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>LEGACY ASSET FOR KIDS | FAMILY LEGACY</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.familyLegacy}
                    onChange={(val: string) => handleNumberInput('familyLegacy', val)}
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-sm font-semibold">#19</td>
                <td className="border border-black px-2 py-1 text-sm" colSpan={2}>RETIRE PARENTS | SPECIAL NEEDS KIDS | FAMILY SUPPORT</td>
                <td className="border border-black p-0">
                  <ExcelNumberCell
                    value={data.familySupport}
                    onChange={(val: string) => handleNumberInput('familySupport', val)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Requirement Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
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

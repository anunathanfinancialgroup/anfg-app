"use client";

import React, { useState, useEffect } from "react";
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

interface AssetsData {
  // Retirement Planning
  ret1_him: boolean; ret1_her: boolean; ret1_notes: string; ret1_present: number; ret1_projected: number;
  ret2_him: boolean; ret2_her: boolean; ret2_notes: string;
  ret3_notes: string; ret3_projected: number;
  ret4_him: boolean; ret4_her: boolean; ret4_notes: string; ret4_present: number; ret4_projected: number;
  ret5_him: boolean; ret5_her: boolean; ret5_notes: string; ret5_present: number; ret5_projected: number;
  ret6_him: boolean; ret6_her: boolean; ret6_notes: string; ret6_present: number; ret6_projected: number;
  ret7_him: boolean; ret7_her: boolean; ret7_notes: string; ret7_present: number; ret7_projected: number;
  
  // Real Estate
  re1_him: boolean; re1_her: boolean; re1_notes: string; re1_present: number; re1_projected: number;
  re2_him: boolean; re2_her: boolean; re2_notes: string; re2_present: number; re2_projected: number;
  re3_him: boolean; re3_her: boolean; re3_notes: string; re3_present: number; re3_projected: number;
  re4_him: boolean; re4_her: boolean; re4_notes: string; re4_present: number; re4_projected: number;
  
  // Stocks/Business/Income
  sb1_him: boolean; sb1_her: boolean; sb1_notes: string; sb1_present: number; sb1_projected: number;
  sb2_him: boolean; sb2_her: boolean; sb2_notes: string; sb2_present: number; sb2_projected: number;
  sb3_him: boolean; sb3_her: boolean; sb3_notes: string; sb3_present: number; sb3_projected: number;
  sb4_him: boolean; sb4_her: boolean; sb4_notes: string; sb4_present: number; sb4_projected: number;
  sb5_him: boolean; sb5_her: boolean; sb5_notes: string; sb5_present: number; sb5_projected: number;
  sb6_him: boolean; sb6_her: boolean; sb6_notes: string; sb6_amount: number;
  sb7_him: boolean; sb7_her: boolean; sb7_notes: string; sb7_amount: number; sb7_projected: number;
  
  totalPresent: number;
  totalProjected: number;
}

const initialData: FNAData = {
  clientId: "", clientName: "", clientPhone: "", clientEmail: "",
  spouseName: "", spousePhone: "", spouseEmail: "", clientDob: "",
  city: "", state: "", analysisDate: new Date().toISOString().split('T')[0],
  child1CollegeName: "", child1CollegeYear: "", child1CollegeAmount: 0,
  child2CollegeName: "", child2CollegeYear: "", child2CollegeAmount: 0,
  child1WeddingAmount: 0, child1WeddingYear: "", child2WeddingAmount: 0, child2WeddingYear: "",
  collegeNote1: "", collegeNote2: "", weddingNote1: "", weddingNote2: "",
  retirementNote1: "", retirementNote2: "", retirementNote3: "PROPERTY TAXES + CARS + INSURANCE + FOOD + REPAIRS + UTILITIES + LIVING",
  healthcareNote1: "~$315K FOR COUPLE IN TODAY'S DOLLARS", healthcareNote2: "",
  lifeGoalsNote1: "your travel plan expenses after retirement per year",
  lifeGoalsNote2: "", lifeGoalsNote3: "", lifeGoalsNote4: "",
  legacyNote1: "", legacyNote2: "", legacyNote3: "",
  currentAge: 0, yearsToRetirement: 0, retirementYears: 0,
  monthlyIncomeNeeded: 0, monthlyRetirementIncome: 0, annualRetirementIncome: 0, totalRetirementIncome: 0,
  healthcareExpenses: 315000, longTermCare: 0,
  travelBudget: 0, vacationHome: 0, charity: 0, otherGoals: 0,
  headstartFund: 0, familyLegacy: 0, familySupport: 0, totalRequirement: 0
};

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
  totalPresent: 0, totalProjected: 0
};

const formatCurrency = (value: number): string => {
  if (value === 0) return "";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function FNAPage() {
  const router = useRouter();
  const [data, setData] = useState<FNAData>(initialData);
  const [assets, setAssets] = useState<AssetsData>(initialAssets);
  const [activeTab, setActiveTab] = useState<'goals' | 'assets'>('goals');
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('canfs_auth='));
    if (!authCookie) {
      router.push('/');
    } else {
      loadClients();
    }
  }, [router]);

  const loadClients = async () => {
    try {
      const { data: clientData, error } = await supabase
        .from('client_registrations')
        .select('id, first_name, last_name, phone, email, spouse_name, city, state, date_of_birth')
        .order('first_name', { ascending: true });
      if (error) throw error;
      setClients(clientData || []);
    } catch (error) {
      console.error('Error loading clients:', error);
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
      }));
    }
  };

  useEffect(() => {
    const yearsToRetirement = data.currentAge > 0 ? Math.max(0, 65 - data.currentAge) : 0;
    const retirementYears = data.currentAge > 0 ? Math.max(0, 85 - data.currentAge) : 0;
    const inflationRate = 0.03;
    const monthlyRetirementIncome = data.monthlyIncomeNeeded > 0 && yearsToRetirement > 0
      ? data.monthlyIncomeNeeded * Math.pow(1 + inflationRate, yearsToRetirement) : 0;
    const annualRetirementIncome = monthlyRetirementIncome * 12;
    const totalRetirementIncome = annualRetirementIncome * retirementYears;
    const longTermCare = data.healthcareExpenses * 0.03 * (retirementYears * 2);
    const totalRequirement = 
      data.child1CollegeAmount + data.child2CollegeAmount + data.child1WeddingAmount + data.child2WeddingAmount +
      totalRetirementIncome + data.healthcareExpenses + longTermCare + data.travelBudget + data.vacationHome +
      data.charity + data.otherGoals + data.headstartFund + data.familyLegacy + data.familySupport;
    setData(prev => ({
      ...prev, yearsToRetirement, retirementYears, monthlyRetirementIncome,
      annualRetirementIncome, totalRetirementIncome, longTermCare, totalRequirement
    }));
  }, [data.currentAge, data.monthlyIncomeNeeded, data.healthcareExpenses, data.child1CollegeAmount,
      data.child2CollegeAmount, data.child1WeddingAmount, data.child2WeddingAmount, data.travelBudget,
      data.vacationHome, data.charity, data.otherGoals, data.headstartFund, data.familyLegacy, data.familySupport]);

  useEffect(() => {
    const totalPresent = 
      assets.ret1_present + assets.ret4_present + assets.ret5_present + assets.ret6_present + assets.ret7_present +
      assets.re1_present + assets.re2_present + assets.re3_present + assets.re4_present +
      assets.sb1_present + assets.sb2_present + assets.sb3_present + assets.sb4_present + assets.sb5_present;
    const totalProjected =
      assets.ret1_projected + assets.ret3_projected + assets.ret4_projected + assets.ret5_projected + 
      assets.ret6_projected + assets.ret7_projected + assets.re1_projected + assets.re2_projected + 
      assets.re3_projected + assets.re4_projected + assets.sb1_projected + assets.sb2_projected + 
      assets.sb3_projected + assets.sb4_projected + assets.sb5_projected + assets.sb7_projected;
    setAssets(prev => ({ ...prev, totalPresent, totalProjected }));
  }, [assets.ret1_present, assets.ret1_projected, assets.ret3_projected, assets.ret4_present, assets.ret4_projected,
      assets.ret5_present, assets.ret5_projected, assets.ret6_present, assets.ret6_projected, assets.ret7_present,
      assets.ret7_projected, assets.re1_present, assets.re1_projected, assets.re2_present, assets.re2_projected,
      assets.re3_present, assets.re3_projected, assets.re4_present, assets.re4_projected, assets.sb1_present,
      assets.sb1_projected, assets.sb2_present, assets.sb2_projected, assets.sb3_present, assets.sb3_projected,
      assets.sb4_present, assets.sb4_projected, assets.sb5_present, assets.sb5_projected, assets.sb7_projected]);

  const handleSave = async () => {
    if (!data.clientId) {
      alert("Please select a client");
      return;
    }
    setSaving(true);
    try {
      const { data: fnaRecord, error } = await supabase
        .from('fna_records')
        .insert([{
          client_id: data.clientId,
          analysis_date: data.analysisDate,
          spouse_name: data.spouseName,
          notes: `FNA for ${data.clientName}`
        }])
        .select()
        .single();
      if (error) throw error;
      setMessage('Saved successfully!');
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "canfs_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  const handleRefresh = () => {
    loadClients();
    setMessage("Data refreshed");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleExportPDF = () => {
    const clientNameForFile = data.clientName.replace(/\s+/g, '-') || 'Client';
    const today = new Date().toISOString().split('T')[0];
    document.title = `${clientNameForFile}-FNA-${today}`;
    window.print();
    setTimeout(() => { document.title = 'Client Financial Need Analysis'; }, 100);
  };

  const handleNumberInput = (field: keyof FNAData, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleAssetsNumberInput = (field: keyof AssetsData, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    setAssets(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          table { page-break-inside: avoid; }
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
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-semibold"
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
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? "Saving..." : "💾 Save"}
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
          >
            📄 Export PDF
          </button>
          <button
            onClick={() => window.open('https://www.calculator.net/', '_blank')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
          >
            🧮 Calculator
          </button>
          {message && (
            <div className="px-4 py-2 rounded bg-green-100 text-green-800 text-sm">
              {message}
            </div>
          )}
        </div>

        {/* Client Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-lg font-bold mb-3">Client Information</h3>
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
              <input
                type="text"
                value={data.spouseName}
                onChange={(e) => setData(prev => ({ ...prev, spouseName: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Spouse Phone</label>
              <input
                type="text"
                value={data.spousePhone}
                onChange={(e) => setData(prev => ({ ...prev, spousePhone: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Spouse Email</label>
              <input
                type="text"
                value={data.spouseEmail}
                onChange={(e) => setData(prev => ({ ...prev, spouseEmail: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
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
              <input
                type="date"
                value={data.analysisDate}
                onChange={(e) => setData(prev => ({ ...prev, analysisDate: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
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


        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div>
            {/* Retirement Planning (USA) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 p-2" style={{ backgroundColor: COLORS.headerBg }}>RETIREMENT PLANNING (USA)</h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
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
                      <input type="text" value={assets.ret1_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret1_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret1_present > 0 ? formatCurrency(assets.ret1_present) : ''} onChange={(e) => handleAssetsNumberInput('ret1_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret1_projected > 0 ? formatCurrency(assets.ret1_projected) : ''} onChange={(e) => handleAssetsNumberInput('ret1_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
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
                      <input type="text" value={assets.ret2_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret2_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#3</td>
                    <td className="border border-black px-2 py-1 text-sm">MAX FUNDING ~$22.5K</td>
                    <td className="border border-black" colSpan={3}></td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret3_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret3_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret3_projected > 0 ? formatCurrency(assets.ret3_projected) : ''} onChange={(e) => handleAssetsNumberInput('ret3_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#4</td>
                    <td className="border border-black px-2 py-1 text-sm">PREVIOUS/ROLLOVER 401K</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret4_him} onChange={(e) => setAssets(prev => ({ ...prev, ret4_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret4_her} onChange={(e) => setAssets(prev => ({ ...prev, ret4_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret4_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret4_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret4_present > 0 ? formatCurrency(assets.ret4_present) : ''} onChange={(e) => handleAssetsNumberInput('ret4_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret4_projected > 0 ? formatCurrency(assets.ret4_projected) : ''} onChange={(e) => handleAssetsNumberInput('ret4_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#5</td>
                    <td className="border border-black px-2 py-1 text-sm">TRADITIONAL IRA/SEP-IRA</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret5_him} onChange={(e) => setAssets(prev => ({ ...prev, ret5_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret5_her} onChange={(e) => setAssets(prev => ({ ...prev, ret5_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret5_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret5_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret5_present > 0 ? formatCurrency(assets.ret5_present) : ''} onChange={(e) => handleAssetsNumberInput('ret5_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret5_projected > 0 ? formatCurrency(assets.ret5_projected) : ''} onChange={(e) => handleAssetsNumberInput('ret5_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#6</td>
                    <td className="border border-black px-2 py-1 text-sm">ROTH IRA/401K</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret6_him} onChange={(e) => setAssets(prev => ({ ...prev, ret6_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret6_her} onChange={(e) => setAssets(prev => ({ ...prev, ret6_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret6_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret6_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret6_present > 0 ? formatCurrency(assets.ret6_present) : ''} onChange={(e) => handleAssetsNumberInput('ret6_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret6_projected > 0 ? formatCurrency(assets.ret6_projected) : ''} onChange={(e) => handleAssetsNumberInput('ret6_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#7</td>
                    <td className="border border-black px-2 py-1 text-sm">ESPP/RSU/ANNUITIES/PENSION</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret7_him} onChange={(e) => setAssets(prev => ({ ...prev, ret7_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret7_her} onChange={(e) => setAssets(prev => ({ ...prev, ret7_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret7_notes} onChange={(e) => setAssets(prev => ({ ...prev, ret7_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret7_present > 0 ? formatCurrency(assets.ret7_present) : ''} onChange={(e) => handleAssetsNumberInput('ret7_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret7_projected > 0 ? formatCurrency(assets.ret7_projected) : ''} onChange={(e) => handleAssetsNumberInput('ret7_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Real Estate */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 p-2" style={{ backgroundColor: COLORS.headerBg }}>REAL ESTATE INVESTMENTS (USA)</h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
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
                      <input type="text" value={assets.re1_notes} onChange={(e) => setAssets(prev => ({ ...prev, re1_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re1_present > 0 ? formatCurrency(assets.re1_present) : ''} onChange={(e) => handleAssetsNumberInput('re1_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re1_projected > 0 ? formatCurrency(assets.re1_projected) : ''} onChange={(e) => handleAssetsNumberInput('re1_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#9</td>
                    <td className="border border-black px-2 py-1 text-sm">RENTAL PROPERTIES</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re2_him} onChange={(e) => setAssets(prev => ({ ...prev, re2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re2_her} onChange={(e) => setAssets(prev => ({ ...prev, re2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re2_notes} onChange={(e) => setAssets(prev => ({ ...prev, re2_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re2_present > 0 ? formatCurrency(assets.re2_present) : ''} onChange={(e) => handleAssetsNumberInput('re2_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re2_projected > 0 ? formatCurrency(assets.re2_projected) : ''} onChange={(e) => handleAssetsNumberInput('re2_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#10</td>
                    <td className="border border-black px-2 py-1 text-sm">LAND PARCELS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re3_him} onChange={(e) => setAssets(prev => ({ ...prev, re3_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re3_her} onChange={(e) => setAssets(prev => ({ ...prev, re3_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re3_notes} onChange={(e) => setAssets(prev => ({ ...prev, re3_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re3_present > 0 ? formatCurrency(assets.re3_present) : ''} onChange={(e) => handleAssetsNumberInput('re3_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re3_projected > 0 ? formatCurrency(assets.re3_projected) : ''} onChange={(e) => handleAssetsNumberInput('re3_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#11</td>
                    <td className="border border-black px-2 py-1 text-sm">INHERITANCE</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re4_him} onChange={(e) => setAssets(prev => ({ ...prev, re4_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re4_her} onChange={(e) => setAssets(prev => ({ ...prev, re4_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re4_notes} onChange={(e) => setAssets(prev => ({ ...prev, re4_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re4_present > 0 ? formatCurrency(assets.re4_present) : ''} onChange={(e) => handleAssetsNumberInput('re4_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re4_projected > 0 ? formatCurrency(assets.re4_projected) : ''} onChange={(e) => handleAssetsNumberInput('re4_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stocks/Business/Income */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 p-2" style={{ backgroundColor: COLORS.headerBg }}>STOCKS/BUSINESS/INCOME (USA)</h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-64">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED @ 65</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#12</td>
                    <td className="border border-black px-2 py-1 text-sm">STOCKS/MFs/BONDS/ETFs</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb1_him} onChange={(e) => setAssets(prev => ({ ...prev, sb1_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb1_her} onChange={(e) => setAssets(prev => ({ ...prev, sb1_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb1_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb1_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb1_present > 0 ? formatCurrency(assets.sb1_present) : ''} onChange={(e) => handleAssetsNumberInput('sb1_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb1_projected > 0 ? formatCurrency(assets.sb1_projected) : ''} onChange={(e) => handleAssetsNumberInput('sb1_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#13</td>
                    <td className="border border-black px-2 py-1 text-sm">BUSINESS OWNERSHIP</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb2_him} onChange={(e) => setAssets(prev => ({ ...prev, sb2_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb2_her} onChange={(e) => setAssets(prev => ({ ...prev, sb2_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb2_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb2_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb2_present > 0 ? formatCurrency(assets.sb2_present) : ''} onChange={(e) => handleAssetsNumberInput('sb2_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb2_projected > 0 ? formatCurrency(assets.sb2_projected) : ''} onChange={(e) => handleAssetsNumberInput('sb2_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#14</td>
                    <td className="border border-black px-2 py-1 text-sm">ALTERNATIVE INVESTMENTS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb3_him} onChange={(e) => setAssets(prev => ({ ...prev, sb3_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb3_her} onChange={(e) => setAssets(prev => ({ ...prev, sb3_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb3_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb3_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb3_present > 0 ? formatCurrency(assets.sb3_present) : ''} onChange={(e) => handleAssetsNumberInput('sb3_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb3_projected > 0 ? formatCurrency(assets.sb3_projected) : ''} onChange={(e) => handleAssetsNumberInput('sb3_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#15</td>
                    <td className="border border-black px-2 py-1 text-sm">CDs</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb4_him} onChange={(e) => setAssets(prev => ({ ...prev, sb4_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb4_her} onChange={(e) => setAssets(prev => ({ ...prev, sb4_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb4_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb4_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb4_present > 0 ? formatCurrency(assets.sb4_present) : ''} onChange={(e) => handleAssetsNumberInput('sb4_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb4_projected > 0 ? formatCurrency(assets.sb4_projected) : ''} onChange={(e) => handleAssetsNumberInput('sb4_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#16</td>
                    <td className="border border-black px-2 py-1 text-sm">CASH/EMERGENCY FUND</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb5_him} onChange={(e) => setAssets(prev => ({ ...prev, sb5_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb5_her} onChange={(e) => setAssets(prev => ({ ...prev, sb5_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb5_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb5_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb5_present > 0 ? formatCurrency(assets.sb5_present) : ''} onChange={(e) => handleAssetsNumberInput('sb5_present', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb5_projected > 0 ? formatCurrency(assets.sb5_projected) : ''} onChange={(e) => handleAssetsNumberInput('sb5_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#17</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL HOUSEHOLD INCOME</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb6_him} onChange={(e) => setAssets(prev => ({ ...prev, sb6_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb6_her} onChange={(e) => setAssets(prev => ({ ...prev, sb6_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb6_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb6_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0" colSpan={2}>
                      <input type="text" value={assets.sb6_amount > 0 ? formatCurrency(assets.sb6_amount) : ''} onChange={(e) => handleAssetsNumberInput('sb6_amount', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#18</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL SAVINGS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb7_him} onChange={(e) => setAssets(prev => ({ ...prev, sb7_him: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb7_her} onChange={(e) => setAssets(prev => ({ ...prev, sb7_her: e.target.checked }))} className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb7_notes} onChange={(e) => setAssets(prev => ({ ...prev, sb7_notes: e.target.value }))} className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb7_amount > 0 ? formatCurrency(assets.sb7_amount) : ''} onChange={(e) => handleAssetsNumberInput('sb7_amount', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb7_projected > 0 ? formatCurrency(assets.sb7_projected) : ''} onChange={(e) => handleAssetsNumberInput('sb7_projected', e.target.value)} className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Assets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 p-2" style={{ backgroundColor: COLORS.yellowBg }}>TOTAL ASSETS</h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr>
                    <td className="border border-black px-4 py-3 text-lg font-bold">Present Value:</td>
                    <td className="border border-black px-4 py-3 text-right text-lg font-bold text-green-600">{formatCurrency(assets.totalPresent)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-4 py-3 text-lg font-bold">Projected @ 65:</td>
                    <td className="border border-black px-4 py-3 text-right text-lg font-bold text-blue-600">{formatCurrency(assets.totalProjected)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div className="bg-black text-white text-xs text-center py-3 rounded">
              DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <div>
            {/* College Planning */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                KIDS COLLEGE PLANNING
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">CHILD NAME</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">YEAR FROM TODAY</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#1</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.child1CollegeName}
                        onChange={(e) => setData(prev => ({ ...prev, child1CollegeName: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.child1CollegeYear}
                        onChange={(e) => setData(prev => ({ ...prev, child1CollegeYear: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.collegeNote1}
                        onChange={(e) => setData(prev => ({ ...prev, collegeNote1: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.child1CollegeAmount > 0 ? formatCurrency(data.child1CollegeAmount) : ''}
                        onChange={(e) => handleNumberInput('child1CollegeAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#2</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.child2CollegeName}
                        onChange={(e) => setData(prev => ({ ...prev, child2CollegeName: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.child2CollegeYear}
                        onChange={(e) => setData(prev => ({ ...prev, child2CollegeYear: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.collegeNote2}
                        onChange={(e) => setData(prev => ({ ...prev, collegeNote2: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.child2CollegeAmount > 0 ? formatCurrency(data.child2CollegeAmount) : ''}
                        onChange={(e) => handleNumberInput('child2CollegeAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Wedding Planning */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                KIDS WEDDING
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">CHILD NAME</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">YEAR</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#3</td>
                    <td className="border border-black px-2 py-1 text-sm">{data.child1CollegeName || 'Child 1'}</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.child1WeddingYear}
                        onChange={(e) => setData(prev => ({ ...prev, child1WeddingYear: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.weddingNote1}
                        onChange={(e) => setData(prev => ({ ...prev, weddingNote1: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.child1WeddingAmount > 0 ? formatCurrency(data.child1WeddingAmount) : ''}
                        onChange={(e) => handleNumberInput('child1WeddingAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#4</td>
                    <td className="border border-black px-2 py-1 text-sm">{data.child2CollegeName || 'Child 2'}</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.child2WeddingYear}
                        onChange={(e) => setData(prev => ({ ...prev, child2WeddingYear: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.weddingNote2}
                        onChange={(e) => setData(prev => ({ ...prev, weddingNote2: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.child2WeddingAmount > 0 ? formatCurrency(data.child2WeddingAmount) : ''}
                        onChange={(e) => handleNumberInput('child2WeddingAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Retirement Planning */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                RETIREMENT PLANNING
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#5</td>
                    <td className="border border-black px-2 py-1 text-sm">CURRENT AGE</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.retirementNote1}
                        onChange={(e) => setData(prev => ({ ...prev, retirementNote1: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="number" value={data.currentAge || ''}
                        onChange={(e) => setData(prev => ({ ...prev, currentAge: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm text-right border-0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#6</td>
                    <td className="border border-black px-2 py-1 text-sm">YEARS TO RETIREMENT @ 65</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.retirementNote2}
                        onChange={(e) => setData(prev => ({ ...prev, retirementNote2: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black px-2 py-1 text-sm text-right font-semibold bg-gray-100">
                      {data.yearsToRetirement}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#7</td>
                    <td className="border border-black px-2 py-1 text-sm">YEARS IN RETIREMENT @ 85</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.retirementNote3}
                        onChange={(e) => setData(prev => ({ ...prev, retirementNote3: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black px-2 py-1 text-sm text-right font-semibold bg-gray-100">
                      {data.retirementYears}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#8</td>
                    <td className="border border-black px-2 py-1 text-sm">MONTHLY INCOME NEEDED (TODAY'S $)</td>
                    <td className="border border-black px-2 py-1 text-sm"></td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.monthlyIncomeNeeded > 0 ? formatCurrency(data.monthlyIncomeNeeded) : ''}
                        onChange={(e) => handleNumberInput('monthlyIncomeNeeded', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#9</td>
                    <td className="border border-black px-2 py-1 text-sm">MONTHLY INCOME @ RETIREMENT (INFLATED)</td>
                    <td className="border border-black px-2 py-1 text-sm"></td>
                    <td className="border border-black px-2 py-1 text-sm text-right font-semibold bg-gray-100">
                      {formatCurrency(data.monthlyRetirementIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#10</td>
                    <td className="border border-black px-2 py-1 text-sm">TOTAL RETIREMENT INCOME NEEDED</td>
                    <td className="border border-black px-2 py-1 text-sm"></td>
                    <td className="border border-black px-2 py-1 text-sm text-right font-semibold bg-green-100">
                      {formatCurrency(data.totalRetirementIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Healthcare */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                HEALTHCARE EXPENSES
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#11</td>
                    <td className="border border-black px-2 py-1 text-sm">HEALTHCARE EXPENSES</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.healthcareNote1}
                        onChange={(e) => setData(prev => ({ ...prev, healthcareNote1: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.healthcareExpenses > 0 ? formatCurrency(data.healthcareExpenses) : ''}
                        onChange={(e) => handleNumberInput('healthcareExpenses', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#12</td>
                    <td className="border border-black px-2 py-1 text-sm">LONG TERM CARE</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.healthcareNote2}
                        onChange={(e) => setData(prev => ({ ...prev, healthcareNote2: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black px-2 py-1 text-sm text-right font-semibold bg-gray-100">
                      {formatCurrency(data.longTermCare)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Life Goals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                LIFE GOALS
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#13</td>
                    <td className="border border-black px-2 py-1 text-sm">TRAVEL / ENTERTAINMENT BUDGET</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.lifeGoalsNote1}
                        onChange={(e) => setData(prev => ({ ...prev, lifeGoalsNote1: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.travelBudget > 0 ? formatCurrency(data.travelBudget) : ''}
                        onChange={(e) => handleNumberInput('travelBudget', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#14</td>
                    <td className="border border-black px-2 py-1 text-sm">VACATION HOME</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.lifeGoalsNote2}
                        onChange={(e) => setData(prev => ({ ...prev, lifeGoalsNote2: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.vacationHome > 0 ? formatCurrency(data.vacationHome) : ''}
                        onChange={(e) => handleNumberInput('vacationHome', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#15</td>
                    <td className="border border-black px-2 py-1 text-sm">CHARITY</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.lifeGoalsNote3}
                        onChange={(e) => setData(prev => ({ ...prev, lifeGoalsNote3: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.charity > 0 ? formatCurrency(data.charity) : ''}
                        onChange={(e) => handleNumberInput('charity', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#16</td>
                    <td className="border border-black px-2 py-1 text-sm">OTHER GOALS</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.lifeGoalsNote4}
                        onChange={(e) => setData(prev => ({ ...prev, lifeGoalsNote4: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.otherGoals > 0 ? formatCurrency(data.otherGoals) : ''}
                        onChange={(e) => handleNumberInput('otherGoals', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legacy Planning */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                LEGACY PLANNING
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-32">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#17</td>
                    <td className="border border-black px-2 py-1 text-sm">HEADSTART FUND FOR GRANDKIDS</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.legacyNote1}
                        onChange={(e) => setData(prev => ({ ...prev, legacyNote1: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.headstartFund > 0 ? formatCurrency(data.headstartFund) : ''}
                        onChange={(e) => handleNumberInput('headstartFund', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#18</td>
                    <td className="border border-black px-2 py-1 text-sm">FAMILY LEGACY</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.legacyNote2}
                        onChange={(e) => setData(prev => ({ ...prev, legacyNote2: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.familyLegacy > 0 ? formatCurrency(data.familyLegacy) : ''}
                        onChange={(e) => handleNumberInput('familyLegacy', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#19</td>
                    <td className="border border-black px-2 py-1 text-sm">FAMILY SUPPORT (PARENTS/SIBLINGS)</td>
                    <td className="border border-black p-0">
                      <input type="text" value={data.legacyNote3}
                        onChange={(e) => setData(prev => ({ ...prev, legacyNote3: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={data.familySupport > 0 ? formatCurrency(data.familySupport) : ''}
                        onChange={(e) => handleNumberInput('familySupport', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Requirement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-4 py-3 text-lg font-bold">TOTAL FINANCIAL REQUIREMENT</td>
                    <td className="border border-black px-4 py-3 text-right text-lg font-bold text-green-600">
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
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div>
            {/* Retirement Planning */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                RETIREMENT PLANNING (USA) - 7 rows
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">RETIREMENT PLANNING (USA)</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
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
                      <input type="checkbox" checked={assets.ret1_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret1_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret1_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret1_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret1_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret1_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret1_present > 0 ? formatCurrency(assets.ret1_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret1_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret1_projected > 0 ? formatCurrency(assets.ret1_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret1_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#2</td>
                    <td className="border border-black px-2 py-1 text-sm">COMPANY MATCH %</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret2_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret2_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret2_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret2_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0" colSpan={3}>
                      <input type="text" value={assets.ret2_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret2_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#3</td>
                    <td className="border border-black px-2 py-1 text-sm">MAX FUNDING ~$22.5K</td>
                    <td className="border border-black" colSpan={3}></td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret3_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret3_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret3_projected > 0 ? formatCurrency(assets.ret3_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret3_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#4</td>
                    <td className="border border-black px-2 py-1 text-sm">PREVIOUS/ROLLOVER 401K</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret4_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret4_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret4_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret4_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret4_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret4_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret4_present > 0 ? formatCurrency(assets.ret4_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret4_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret4_projected > 0 ? formatCurrency(assets.ret4_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret4_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#5</td>
                    <td className="border border-black px-2 py-1 text-sm">TRADITIONAL IRA/SEP-IRA</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret5_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret5_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret5_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret5_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret5_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret5_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret5_present > 0 ? formatCurrency(assets.ret5_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret5_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret5_projected > 0 ? formatCurrency(assets.ret5_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret5_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#6</td>
                    <td className="border border-black px-2 py-1 text-sm">ROTH IRA/401K</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret6_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret6_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret6_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret6_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret6_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret6_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret6_present > 0 ? formatCurrency(assets.ret6_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret6_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret6_projected > 0 ? formatCurrency(assets.ret6_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret6_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#7</td>
                    <td className="border border-black px-2 py-1 text-sm">ESPP/RSU/ANNUITIES/PENSION</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret7_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret7_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.ret7_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret7_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.ret7_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret7_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret7_present > 0 ? formatCurrency(assets.ret7_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret7_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.ret7_projected > 0 ? formatCurrency(assets.ret7_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('ret7_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Real Estate */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                REAL ESTATE INVESTMENTS (USA) - 4 rows
              </h3>
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
                      <input type="checkbox" checked={assets.re1_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, re1_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re1_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, re1_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re1_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, re1_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re1_present > 0 ? formatCurrency(assets.re1_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('re1_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re1_projected > 0 ? formatCurrency(assets.re1_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('re1_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#9</td>
                    <td className="border border-black px-2 py-1 text-sm">RENTAL PROPERTIES</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re2_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, re2_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re2_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, re2_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re2_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, re2_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re2_present > 0 ? formatCurrency(assets.re2_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('re2_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re2_projected > 0 ? formatCurrency(assets.re2_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('re2_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#10</td>
                    <td className="border border-black px-2 py-1 text-sm">LAND PARCELS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re3_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, re3_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re3_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, re3_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re3_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, re3_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re3_present > 0 ? formatCurrency(assets.re3_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('re3_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re3_projected > 0 ? formatCurrency(assets.re3_projected) : ''}
                        onChange=(e) => handleAssetsNumberInput('re3_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#11</td>
                    <td className="border border-black px-2 py-1 text-sm">INHERITANCE</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re4_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, re4_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.re4_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, re4_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.re4_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, re4_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re4_present > 0 ? formatCurrency(assets.re4_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('re4_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.re4_projected > 0 ? formatCurrency(assets.re4_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('re4_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stocks/Business/Income */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2 px-2 py-1" style={{ backgroundColor: COLORS.headerBg }}>
                STOCKS/BUSINESS/INCOME (USA) - 7 rows
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">STOCKS/BUSINESS/INCOME</th>
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
                    <td className="border border-black px-2 py-1 text-sm">STOCKS/MFs/BONDS/ETFs</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb1_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb1_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb1_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb1_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb1_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb1_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb1_present > 0 ? formatCurrency(assets.sb1_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb1_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb1_projected > 0 ? formatCurrency(assets.sb1_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb1_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#13</td>
                    <td className="border border-black px-2 py-1 text-sm">BUSINESS OWNERSHIP</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb2_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb2_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb2_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb2_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb2_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb2_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb2_present > 0 ? formatCurrency(assets.sb2_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb2_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb2_projected > 0 ? formatCurrency(assets.sb2_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb2_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#14</td>
                    <td className="border border-black px-2 py-1 text-sm">ALTERNATIVE INVESTMENTS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb3_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb3_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb3_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb3_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb3_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb3_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb3_present > 0 ? formatCurrency(assets.sb3_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb3_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb3_projected > 0 ? formatCurrency(assets.sb3_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb3_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#15</td>
                    <td className="border border-black px-2 py-1 text-sm">CDs</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb4_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb4_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb4_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb4_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb4_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb4_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb4_present > 0 ? formatCurrency(assets.sb4_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb4_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb4_projected > 0 ? formatCurrency(assets.sb4_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb4_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#16</td>
                    <td className="border border-black px-2 py-1 text-sm">CASH/EMERGENCY FUND</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb5_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb5_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb5_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb5_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb5_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb5_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb5_present > 0 ? formatCurrency(assets.sb5_present) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb5_present', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb5_projected > 0 ? formatCurrency(assets.sb5_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb5_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#17</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL HOUSEHOLD INCOME</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb6_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb6_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb6_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb6_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb6_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb6_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0" colSpan={2}>
                      <input type="text"
                        value={assets.sb6_amount > 0 ? formatCurrency(assets.sb6_amount) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb6_amount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm font-semibold">#18</td>
                    <td className="border border-black px-2 py-1 text-sm">ANNUAL SAVINGS</td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb7_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb7_him: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black text-center">
                      <input type="checkbox" checked={assets.sb7_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb7_her: e.target.checked }))}
                        className="w-4 h-4" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text" value={assets.sb7_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, sb7_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb7_amount > 0 ? formatCurrency(assets.sb7_amount) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb7_amount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                    <td className="border border-black p-0">
                      <input type="text"
                        value={assets.sb7_projected > 0 ? formatCurrency(assets.sb7_projected) : ''}
                        onChange={(e) => handleAssetsNumberInput('sb7_projected', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0" placeholder="$0" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Assets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-4 py-3 text-lg font-bold">TOTAL ASSETS</td>
                    <td className="border border-black px-4 py-3 text-right font-semibold">
                      <div className="text-green-600">Present Value: {formatCurrency(assets.totalPresent)}</div>
                    </td>
                    <td className="border border-black px-4 py-3 text-right font-semibold">
                      <div className="text-blue-600">Projected @ 65: {formatCurrency(assets.totalProjected)}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div className="bg-black text-white text-xs text-center py-3 rounded">
              DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

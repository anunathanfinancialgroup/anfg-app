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
  ret1_him: boolean; ret1_her: boolean; ret1_notes: string; ret1_present: number; ret1_projected: number;
  totalPresent: number;
  totalProjected: number;
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

const initialAssets: AssetsData = {
  ret1_him: false, ret1_her: false, ret1_notes: "", ret1_present: 0, ret1_projected: 0,
  totalPresent: 0,
  totalProjected: 0
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

  const handleNumberInput = (field: keyof FNAData, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 mx-4 mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Client Financial Need Analysis</h1>
              <p className="text-xs text-gray-600">Build your career. Protect their future</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="mb-4 flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save"}
          </button>
          {message && (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded">
              {message}
            </div>
          )}
        </div>

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
        </div>

        <div className="mb-4 flex gap-2">
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

        {activeTab === 'goals' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2" style={{ backgroundColor: COLORS.headerBg, padding: '8px' }}>
                KIDS COLLEGE PLANNING
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">CHILD NAME</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">YEAR</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm">#1</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child1CollegeName}
                        onChange={(e) => setData(prev => ({ ...prev, child1CollegeName: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child1CollegeYear}
                        onChange={(e) => setData(prev => ({ ...prev, child1CollegeYear: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child1CollegeAmount > 0 ? formatCurrency(data.child1CollegeAmount) : ''}
                        onChange={(e) => handleNumberInput('child1CollegeAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm">#2</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child2CollegeName}
                        onChange={(e) => setData(prev => ({ ...prev, child2CollegeName: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child2CollegeYear}
                        onChange={(e) => setData(prev => ({ ...prev, child2CollegeYear: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child2CollegeAmount > 0 ? formatCurrency(data.child2CollegeAmount) : ''}
                        onChange={(e) => handleNumberInput('child2CollegeAmount', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2" style={{ backgroundColor: COLORS.headerBg, padding: '8px' }}>
                RETIREMENT PLANNING
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm">#5</td>
                    <td className="border border-black px-2 py-1 text-sm">CURRENT AGE</td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={data.currentAge || ''}
                        onChange={(e) => setData(prev => ({ ...prev, currentAge: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm text-right border-0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm">#8</td>
                    <td className="border border-black px-2 py-1 text-sm">MONTHLY INCOME NEEDED</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.monthlyIncomeNeeded > 0 ? formatCurrency(data.monthlyIncomeNeeded) : ''}
                        onChange={(e) => handleNumberInput('monthlyIncomeNeeded', e.target.value)}
                        className="w-full px-2 py-1 text-sm text-right border-0"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm">#10</td>
                    <td className="border border-black px-2 py-1 text-sm">TOTAL RETIREMENT INCOME NEEDED</td>
                    <td className="border border-black px-2 py-1 text-sm text-right font-semibold bg-gray-100">
                      {formatCurrency(data.totalRetirementIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <tbody>
                  <tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-4 py-3 text-lg font-bold">TOTAL REQUIREMENT</td>
                    <td className="border border-black px-4 py-3 text-right text-lg font-bold">
                      {formatCurrency(data.totalRequirement)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-bold mb-2" style={{ backgroundColor: COLORS.headerBg, padding: '8px' }}>
                RETIREMENT PLANNING (USA)
              </h3>
              <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">PROJECTED @ 65</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-sm">#1</td>
                    <td className="border border-black px-2 py-1 text-sm">CURRENT 401K | 403B</td>
                    <td className="border border-black text-center">
                      <input
                        type="checkbox"
                        checked={assets.ret1_him}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret1_him: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="border border-black text-center">
                      <input
                        type="checkbox"
                        checked={assets.ret1_her}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret1_her: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={assets.ret1_notes}
                        onChange={(e) => setAssets(prev => ({ ...prev, ret1_notes: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border-0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={assets.ret1_present > 0 ? formatCurrency(assets.ret1_present) : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
                          setAssets(prev => ({ ...prev, ret1_present: val }));
                        }}
                        className="w-full px-2 py-1 text-sm text-right border-0"
                        placeholder="$0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={assets.ret1_projected > 0 ? formatCurrency(assets.ret1_projected) : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
                          setAssets(prev => ({ ...prev, ret1_projected: val }));
                        }}
                        className="w-full px-2 py-1 text-sm text-right border-0"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

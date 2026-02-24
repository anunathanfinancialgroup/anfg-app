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
  yellowBg: '#FFFF00',
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
  
  // College (2 children)
  child1CollegeName: string;
  child1CollegeAmount: number;
  child2CollegeName: string;
  child2CollegeAmount: number;
  
  // Wedding (2 children)
  child1WeddingAmount: number;
  child2WeddingAmount: number;
  
  // Retirement
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
  child1CollegeName: "",
  child1CollegeAmount: 0,
  child2CollegeName: "",
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Auth check
  useEffect(() => {
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('canfs_auth='));
    if (!authCookie) {
      router.push('/');
    } else {
      loadClients();
    }
  }, [router]);

  // Load clients
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

  // Handle client selection
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
    }));

    await loadFNAData(clientId);
  };

  // Load FNA data for selected client
  const loadFNAData = async (clientId: string) => {
    setLoading(true);
    try {
      // Get most recent FNA record
      const { data: fnaRecord, error: fnaError } = await supabase
        .from('fna_records')
        .select('fna_id, analysis_date, spouse_name')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fnaError) {
        if (fnaError.code === 'PGRST116') {
          showMessage('No existing FNA data for this client', 'error');
          return;
        }
        throw fnaError;
      }

      const fnaId = fnaRecord.fna_id;

      // Load all data in parallel
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
        supabase.from('fna_retirement').select('*').eq('fna_id', fnaId).single(),
        supabase.from('fna_healthcare').select('*').eq('fna_id', fnaId).single(),
        supabase.from('fna_life_goals').select('*').eq('fna_id', fnaId).single(),
        supabase.from('fna_legacy').select('*').eq('fna_id', fnaId).single(),
        supabase.from('fna_ast_retirement').select('*').eq('fna_id', fnaId).single()
      ]);

      // Update Goals data
      const child1College = collegeData?.find((c: any) => c.child_number === 1);
      const child2College = collegeData?.find((c: any) => c.child_number === 2);
      const child1Wedding = weddingData?.find((w: any) => w.child_number === 1);
      const child2Wedding = weddingData?.find((w: any) => w.child_number === 2);

      setData(prev => ({
        ...prev,
        fnaId: fnaId,
        spouseName: fnaRecord.spouse_name || prev.spouseName,
        analysisDate: fnaRecord.analysis_date || prev.analysisDate,
        // College
        child1CollegeName: child1College?.child_name || '',
        child1CollegeAmount: child1College?.amount || 0,
        child2CollegeName: child2College?.child_name || '',
        child2CollegeAmount: child2College?.amount || 0,
        // Wedding
        child1WeddingAmount: child1Wedding?.amount || 0,
        child2WeddingAmount: child2Wedding?.amount || 0,
        // Retirement
        currentAge: retirementData?.current_age || 0,
        monthlyIncomeNeeded: retirementData?.monthly_income_needed || 0,
        // Healthcare
        healthcareExpenses: healthcareData?.healthcare_expenses || 315000,
        // Life Goals
        travelBudget: lifeGoalsData?.travel_budget || 0,
        vacationHome: lifeGoalsData?.vacation_home || 0,
        charity: lifeGoalsData?.charity || 0,
        otherGoals: lifeGoalsData?.other_goals || 0,
        // Legacy
        headstartFund: legacyData?.headstart_fund || 0,
        familyLegacy: legacyData?.family_legacy || 0,
        familySupport: legacyData?.family_support || 0,
      }));

      // Update Assets data
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

  // Auto-calculate retirement values
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

  // Save FNA data
  const handleSave = async () => {
    if (!data.clientId) {
      showMessage("Please select a client first", 'error');
      return;
    }

    setSaving(true);
    try {
      let fnaId = data.fnaId;

      // Create or update FNA record
      if (!fnaId) {
        const { data: fnaRecord, error: fnaError } = await supabase
          .from('fna_records')
          .insert([{
            client_id: data.clientId,
            analysis_date: data.analysisDate,
            spouse_name: data.spouseName,
            notes: `FNA for ${data.clientName}`
          }])
          .select()
          .single();

        if (fnaError) throw fnaError;
        fnaId = fnaRecord.fna_id;
        setData(prev => ({ ...prev, fnaId }));
      } else {
        // Update existing record
        await supabase
          .from('fna_records')
          .update({
            analysis_date: data.analysisDate,
            spouse_name: data.spouseName,
            updated_at: new Date().toISOString()
          })
          .eq('fna_id', fnaId);
      }

      // Delete existing data for this FNA
      await Promise.all([
        supabase.from('fna_college').delete().eq('fna_id', fnaId),
        supabase.from('fna_wedding').delete().eq('fna_id', fnaId),
        supabase.from('fna_retirement').delete().eq('fna_id', fnaId),
        supabase.from('fna_healthcare').delete().eq('fna_id', fnaId),
        supabase.from('fna_life_goals').delete().eq('fna_id', fnaId),
        supabase.from('fna_legacy').delete().eq('fna_id', fnaId),
        supabase.from('fna_ast_retirement').delete().eq('fna_id', fnaId),
      ]);

      // Insert new data
      await Promise.all([
        // College
        supabase.from('fna_college').insert([
          { fna_id: fnaId, child_number: 1, child_name: data.child1CollegeName, amount: data.child1CollegeAmount },
          { fna_id: fnaId, child_number: 2, child_name: data.child2CollegeName, amount: data.child2CollegeAmount }
        ]),
        // Wedding
        supabase.from('fna_wedding').insert([
          { fna_id: fnaId, child_number: 1, amount: data.child1WeddingAmount },
          { fna_id: fnaId, child_number: 2, amount: data.child2WeddingAmount }
        ]),
        // Retirement
        supabase.from('fna_retirement').insert([{
          fna_id: fnaId,
          current_age: data.currentAge,
          monthly_income_needed: data.monthlyIncomeNeeded
        }]),
        // Healthcare
        supabase.from('fna_healthcare').insert([{
          fna_id: fnaId,
          healthcare_expenses: data.healthcareExpenses
        }]),
        // Life Goals
        supabase.from('fna_life_goals').insert([{
          fna_id: fnaId,
          travel_budget: data.travelBudget,
          vacation_home: data.vacationHome,
          charity: data.charity,
          other_goals: data.otherGoals
        }]),
        // Legacy
        supabase.from('fna_legacy').insert([{
          fna_id: fnaId,
          headstart_fund: data.headstartFund,
          family_legacy: data.familyLegacy,
          family_support: data.familySupport
        }]),
        // Assets - Retirement
        supabase.from('fna_ast_retirement').insert([{
          fna_id: fnaId,
          current_401k_him: assets.ret1_him,
          current_401k_her: assets.ret1_her,
          current_401k_notes: assets.ret1_notes,
          current_401k_present_value: assets.ret1_present,
          current_401k_projected_value: assets.ret1_projected
        }])
      ]);

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
    if (confirm('Clear all data? This will reset the form.')) {
      setData({ ...initialData, clientId: data.clientId, clientName: data.clientName, clientPhone: data.clientPhone, clientEmail: data.clientEmail });
      setAssets(initialAssets);
      showMessage("Form cleared", 'success');
    }
  };

  const handleNumberInput = (field: keyof FNAData, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    setData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Card */}
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

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Save Button & Messages */}
        <div className="mb-4 flex justify-end gap-3">
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

        {/* Client Information Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mb-4">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b">📋 Client Information</h3>
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
              <input 
                type="text" 
                value={data.clientPhone} 
                readOnly 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Email</label>
              <input 
                type="text" 
                value={data.clientEmail} 
                readOnly 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" 
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
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
              <input 
                type="text" 
                value={data.city} 
                readOnly 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">State</label>
              <input 
                type="text" 
                value={data.state} 
                readOnly 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" 
              />
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
        </div>

        {/* Tab Navigation */}
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

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {/* College Planning Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                🎓 KIDS COLLEGE PLANNING
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold">CHILD NAME</th>
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
                        value={data.child1CollegeAmount > 0 ? formatCurrency(data.child1CollegeAmount) : ''}
                        onChange={(e) => handleNumberInput('child1CollegeAmount', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
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
                        value={data.child2CollegeAmount > 0 ? formatCurrency(data.child2CollegeAmount) : ''}
                        onChange={(e) => handleNumberInput('child2CollegeAmount', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Wedding Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                💒 KIDS WEDDING
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#3</td>
                    <td className="border border-black px-3 py-2 text-sm">CHILD 1 WEDDING</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child1WeddingAmount > 0 ? formatCurrency(data.child1WeddingAmount) : ''}
                        onChange={(e) => handleNumberInput('child1WeddingAmount', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#4</td>
                    <td className="border border-black px-3 py-2 text-sm">CHILD 2 WEDDING</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.child2WeddingAmount > 0 ? formatCurrency(data.child2WeddingAmount) : ''}
                        onChange={(e) => handleNumberInput('child2WeddingAmount', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Retirement Planning Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                🏖️ RETIREMENT PLANNING
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#5</td>
                    <td className="border border-black px-3 py-2 text-sm">CURRENT AGE</td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={data.currentAge || ''}
                        onChange={(e) => setData(prev => ({ ...prev, currentAge: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#6</td>
                    <td className="border border-black px-3 py-2 text-sm">YEARS TO RETIREMENT (65 - CURRENT AGE)</td>
                    <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                      {data.yearsToRetirement}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#7</td>
                    <td className="border border-black px-3 py-2 text-sm">RETIREMENT YEARS (85 - CURRENT AGE)</td>
                    <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                      {data.retirementYears}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#8</td>
                    <td className="border border-black px-3 py-2 text-sm">MONTHLY INCOME NEEDED (TODAY'S DOLLARS)</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.monthlyIncomeNeeded > 0 ? formatCurrency(data.monthlyIncomeNeeded) : ''}
                        onChange={(e) => handleNumberInput('monthlyIncomeNeeded', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#9</td>
                    <td className="border border-black px-3 py-2 text-sm">MONTHLY INCOME NEEDED (AT RETIREMENT @ 3%)</td>
                    <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                      {formatCurrency(data.monthlyRetirementIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#10</td>
                    <td className="border border-black px-3 py-2 text-sm">ANNUAL RETIREMENT INCOME NEEDED</td>
                    <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                      {formatCurrency(data.annualRetirementIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#11</td>
                    <td className="border border-black px-3 py-2 text-sm font-bold">TOTAL RETIREMENT INCOME NEEDED</td>
                    <td className="border border-black px-3 py-2 text-sm text-right font-bold bg-blue-100">
                      {formatCurrency(data.totalRetirementIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Healthcare Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                🏥 HEALTHCARE PLANNING
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-40">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#12</td>
                    <td className="border border-black px-3 py-2 text-sm">HEALTHCARE EXPENSES (~$315K FOR COUPLE)</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.healthcareExpenses > 0 ? formatCurrency(data.healthcareExpenses) : ''}
                        onChange={(e) => handleNumberInput('healthcareExpenses', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$315,000"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#13</td>
                    <td className="border border-black px-3 py-2 text-sm">LONG-TERM CARE (3% OF HEALTHCARE × YEARS × 2)</td>
                    <td className="border border-black px-3 py-2 text-sm text-right font-semibold bg-gray-100">
                      {formatCurrency(data.longTermCare)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Life Goals Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                🌟 LIFE GOALS
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
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
                        value={data.travelBudget > 0 ? formatCurrency(data.travelBudget) : ''}
                        onChange={(e) => handleNumberInput('travelBudget', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#15</td>
                    <td className="border border-black px-3 py-2 text-sm">VACATION HOME</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.vacationHome > 0 ? formatCurrency(data.vacationHome) : ''}
                        onChange={(e) => handleNumberInput('vacationHome', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#16</td>
                    <td className="border border-black px-3 py-2 text-sm">CHARITY / GIVING</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.charity > 0 ? formatCurrency(data.charity) : ''}
                        onChange={(e) => handleNumberInput('charity', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#17</td>
                    <td className="border border-black px-3 py-2 text-sm">OTHER GOALS</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.otherGoals > 0 ? formatCurrency(data.otherGoals) : ''}
                        onChange={(e) => handleNumberInput('otherGoals', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legacy Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                🎁 LEGACY PLANNING
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-3 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-3 py-2 text-sm font-bold">DESCRIPTION</th>
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
                        value={data.headstartFund > 0 ? formatCurrency(data.headstartFund) : ''}
                        onChange={(e) => handleNumberInput('headstartFund', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#19</td>
                    <td className="border border-black px-3 py-2 text-sm">FAMILY LEGACY</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.familyLegacy > 0 ? formatCurrency(data.familyLegacy) : ''}
                        onChange={(e) => handleNumberInput('familyLegacy', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm text-center font-semibold">#20</td>
                    <td className="border border-black px-3 py-2 text-sm">FAMILY SUPPORT</td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={data.familySupport > 0 ? formatCurrency(data.familySupport) : ''}
                        onChange={(e) => handleNumberInput('familySupport', e.target.value)}
                        className="w-full px-3 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Requirement Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
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
            </div>

            {/* Disclaimer */}
            <div className="bg-black text-white text-center py-3 rounded-lg font-medium">
              ⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            {/* Retirement Assets Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-3 px-3 py-2 rounded" style={{ backgroundColor: COLORS.headerBg }}>
                🏦 RETIREMENT PLANNING (USA)
              </h3>
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-12">#</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold">DESCRIPTION</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HIM</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-16">HER</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-48">NOTES</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PRESENT VALUE</th>
                    <th className="border border-black px-2 py-2 text-sm font-bold w-40">PROJECTED @ 65</th>
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
                      <input
                        type="text"
                        value={assets.ret1_present > 0 ? formatCurrency(assets.ret1_present) : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
                          setAssets(prev => ({ ...prev, ret1_present: val, totalPresent: val }));
                        }}
                        className="w-full px-2 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="text"
                        value={assets.ret1_projected > 0 ? formatCurrency(assets.ret1_projected) : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
                          setAssets(prev => ({ ...prev, ret1_projected: val, totalProjected: val }));
                        }}
                        className="w-full px-2 py-2 text-sm text-right border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="$0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Assets Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ backgroundColor: COLORS.yellowBg }}>
                    <td className="border border-black px-4 py-4 text-xl font-bold">💰 TOTAL ASSETS</td>
                    <td className="border border-black px-4 py-4">
                      <div className="text-right text-lg font-bold text-green-700">
                        Present Value: {formatCurrency(assets.totalPresent)}
                      </div>
                      <div className="text-right text-lg font-bold text-blue-700 mt-1">
                        Projected @ 65: {formatCurrency(assets.totalProjected)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div className="bg-black text-white text-center py-3 rounded-lg font-medium">
              ⚠️ DISCLAIMER: FOR EDUCATION PURPOSE ONLY. WE DO NOT PROVIDE ANY LEGAL OR TAX ADVICE
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = {
  headerBg: '#BDD7EE',
};

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

interface FNAData {
  clientId: string;
  clientName: string;
  currentAge: number;
  totalRequirement: number;
}

const initialData: FNAData = {
  clientId: "",
  clientName: "",
  currentAge: 0,
  totalRequirement: 0
};

export default function FNAPage() {
  const router = useRouter();
  const [data, setData] = useState<FNAData>(initialData);
  const [activeTab, setActiveTab] = useState<'goals' | 'assets'>('goals');
  const [clients, setClients] = useState<Client[]>([]);
  
  useEffect(() => {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('canfs_auth='));
    
    if (!authCookie) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = "canfs_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Client Financial Need Analysis</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded mb-4">
          <h3 className="text-lg font-bold mb-3">Client Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Client Name</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2">
                <option value="">Select Client</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone Number</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50" readOnly />
            </div>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold ${
              activeTab === 'goals' ? 'bg-blue-600 text-white' : 'bg-white border'
            }`}
          >
            📊 FINANCIAL GOALS & PLANNING
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold ${
              activeTab === 'assets' ? 'bg-blue-600 text-white' : 'bg-white border'
            }`}
          >
            💰 ASSETS
          </button>
        </div>

        {activeTab === 'goals' && (
          <div className="bg-white p-4 rounded">
            <h2 className="text-xl font-bold mb-4">Financial Goals & Planning</h2>
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="font-bold mb-2">College Planning</h3>
                <table className="w-full border">
                  <thead style={{ backgroundColor: COLORS.headerBg }}>
                    <tr>
                      <th className="border p-2">#</th>
                      <th className="border p-2">Description</th>
                      <th className="border p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">#1</td>
                      <td className="border p-2">Child 1 College</td>
                      <td className="border p-2">
                        <input type="text" className="w-full px-2 py-1" placeholder="$0" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="bg-white p-4 rounded">
            <h2 className="text-xl font-bold mb-4">Assets</h2>
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="font-bold mb-2">Retirement Planning</h3>
                <table className="w-full border">
                  <thead style={{ backgroundColor: COLORS.headerBg }}>
                    <tr>
                      <th className="border p-2">#</th>
                      <th className="border p-2">Description</th>
                      <th className="border p-2">Present Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">#1</td>
                      <td className="border p-2">Current 401K</td>
                      <td className="border p-2">
                        <input type="text" className="w-full px-2 py-1" placeholder="$0" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function FNAPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'goals' | 'assets'>('goals');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4">
        <h1 className="text-2xl font-bold">FNA Calculator</h1>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-6 py-4 rounded-lg ${
              activeTab === 'goals' ? 'bg-blue-600 text-white' : 'bg-white'
            }`}
          >
            FINANCIAL GOALS
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex-1 px-6 py-4 rounded-lg ${
              activeTab === 'assets' ? 'bg-blue-600 text-white' : 'bg-white'
            }`}
          >
            ASSETS
          </button>
        </div>

        {activeTab === 'goals' && (
          <div className="bg-white p-4 rounded">
            <h2>Goals Section</h2>
            <p>Goals content here</p>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="bg-white p-4 rounded">
            <h2>Assets Section</h2>
            <p>Assets content here</p>
          </div>
        )}
      </main>
    </div>
  );
}

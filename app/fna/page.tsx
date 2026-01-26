'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_COOKIE = 'canfs_auth';

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`${AUTH_COOKIE}=true`));
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  const secure =
    typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}

export default function FNAPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<number>(1);

  useEffect(() => {
    if (!hasAuthCookie()) {
      router.push('/');
    }
  }, [router]);

  const logout = () => {
    clearAuthCookie();
    router.push('/');
  };

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const sections = [
    { id: 1, name: 'Personal Information', completed: false },
    { id: 2, name: 'Family & Dependents', completed: false },
    { id: 3, name: 'Financial Goals', completed: false },
    { id: 4, name: 'Assets & Liabilities', completed: false },
    { id: 5, name: 'Insurance Coverage', completed: false },
    { id: 6, name: 'Risk Assessment', completed: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/can-logo.png" alt="CAN Financial Solutions" className="h-10 w-auto" />
              <div>
                <div className="text-xl font-bold text-blue-800">Financial Needs Analysis</div>
                 <div className="text-sm font-semibold text-yellow-500">Protecting Your Tomorrow</div>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700"
              onClick={logout}
            >
              Logout ➜]
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMsg}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a client...</option>
                <option value="client1">John Doe</option>
                <option value="client2">Jane Smith</option>
                <option value="client3">Robert Johnson</option>
              </select>
            </div>

            {selectedClient && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">FNA Sections Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(section.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        currentSection === section.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-sm font-semibold text-slate-700">
                            Section {section.id}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {section.name}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          section.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {section.completed ? '✓' : section.id}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedClient && (
              <div className="mt-6 p-6 border border-slate-200 rounded-lg">
                <h4 className="text-md font-semibold text-slate-900 mb-4">
                  Section {currentSection}: {sections[currentSection - 1].name}
                </h4>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Form fields for section {currentSection} will go here...
                  </p>
                  
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => setSuccessMsg('Section saved successfully!')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      Save Section
                    </button>
                    <button
                      onClick={() => {
                        if (currentSection < 6) {
                          setCurrentSection(currentSection + 1);
                          setSuccessMsg('Moving to next section');
                        }
                      }}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                      disabled={currentSection >= 6}
                    >
                      Next Section
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedClient && (
              <div className="text-center py-12 text-slate-500">
                Please select a client to begin the Financial Needs Analysis
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

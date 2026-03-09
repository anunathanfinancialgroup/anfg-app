// app/quote_tool/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Gender = 'Male' | 'Female'

type HealthClass =
  | 'Preferred Plus Non-Tobacco'
  | 'Preferred Non-Tobacco'
  | 'Standard Non-Tobacco'
  | 'Tobacco'

type QuoteParams = {
  first_name: string
  last_name: string
  date_of_birth: string
  age: number
  gender: Gender
  health_class: HealthClass
  face_amount: number
  term_years: number
  state: string
}

type Carrier = {
  id: string
  carrier: string
  product: string
  basePer1000: number
}

const CARRIERS: Carrier[] = [
  { id: 'corebridge', carrier: 'Corebridge Financial', product: 'QoL Flex Term', basePer1000: 0.09923 },
  { id: 'lincoln', carrier: 'Lincoln Financial', product: 'TermAccel', basePer1000: 0.11698 },
  { id: 'nationwide', carrier: 'Nationwide', product: 'Guaranteed Level Term', basePer1000: 0.12206 },
  { id: 'northam', carrier: 'North American', product: 'ADDvantage Term', basePer1000: 0.13068 },
  { id: 'nlg', carrier: 'National Life Group', product: 'Level Term', basePer1000: 0.13596 },
  { id: 'moo', carrier: 'Mutual of Omaha', product: 'Term Life Answers', basePer1000: 0.14126 },
  { id: 'ameritas', carrier: 'Ameritas', product: 'ClearEdge LB Term', basePer1000: 0.14191 },
  { id: 'transamerica', carrier: 'Transamerica', product: 'Trendsetter LB', basePer1000: 0.16598 },
  { id: 'ethos', carrier: 'Ethos Life', product: 'Term Life', basePer1000: 0.1295 }
]

const TERM_OPTIONS = [10, 15, 20, 25, 30]

const FACE_OPTIONS = [
  250000,
  500000,
  750000,
  1000000,
  1500000,
  2000000,
  3000000
]

const HEALTH_CLASSES: HealthClass[] = [
  'Preferred Plus Non-Tobacco',
  'Preferred Non-Tobacco',
  'Standard Non-Tobacco',
  'Tobacco'
]

const DEFAULT_PARAMS: QuoteParams = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  age: 40,
  gender: 'Male',
  health_class: 'Preferred Non-Tobacco',
  face_amount: 1000000,
  term_years: 30,
  state: 'TX'
}

function ageMultiplier(age: number) {
  const diff = age - 40
  if (diff === 0) return 1
  if (diff > 0) return Math.pow(1.072, diff)
  return Math.pow(0.94, Math.abs(diff))
}

function genderMultiplier(gender: Gender) {
  return gender === 'Female' ? 0.78 : 1
}

function healthMultiplier(h: HealthClass) {
  switch (h) {
    case 'Preferred Plus Non-Tobacco':
      return 0.88
    case 'Preferred Non-Tobacco':
      return 1
    case 'Standard Non-Tobacco':
      return 1.35
    case 'Tobacco':
      return 2.1
  }
}

function termMultiplier(term: number) {
  const map: Record<number, number> = {
    10: 0.55,
    15: 0.68,
    20: 0.78,
    25: 0.9,
    30: 1
  }
  return map[term] || 1
}

function calcPremium(carrier: Carrier, p: QuoteParams) {
  const rate =
    carrier.basePer1000 *
    ageMultiplier(p.age) *
    genderMultiplier(p.gender) *
    healthMultiplier(p.health_class) *
    termMultiplier(p.term_years)

  const monthly = (rate * p.face_amount) / 1000
  return monthly
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function QuoteToolPage() {
  const router = useRouter()

  const [params, setParams] = useState(DEFAULT_PARAMS)

  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(
    new Set(CARRIERS.map(c => c.id))
  )

  const [quoteGenerated, setQuoteGenerated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasAuth = document.cookie.includes('canfs_auth=true')

    if (!hasAuth) router.push('/auth')
  }, [router])

  const results = useMemo(() => {
    if (!quoteGenerated) return []

    const list = CARRIERS
      .filter(c => selectedCarriers.has(c.id))
      .map(c => {
        const monthly = calcPremium(c, params)

        return {
          carrier: c.carrier,
          product: c.product,
          monthly,
          annual: monthly * 12,
          total: monthly * 12 * params.term_years
        }
      })

    return list.sort((a, b) => a.monthly - b.monthly)
  }, [quoteGenerated, params, selectedCarriers])

  function toggleCarrier(id: string) {
    const newSet = new Set(selectedCarriers)

    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)

    setSelectedCarriers(newSet)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      <h1 className="text-3xl font-bold">
        Term Life Insurance Quote Tool
      </h1>

      <div className="grid md:grid-cols-3 gap-4">

        <input
          type="number"
          value={params.age}
          onChange={e =>
            setParams({ ...params, age: Number(e.target.value) })
          }
          className="border p-2 rounded"
          placeholder="Age"
        />

        <select
          value={params.gender}
          onChange={e =>
            setParams({ ...params, gender: e.target.value as Gender })
          }
          className="border p-2 rounded"
        >
          <option>Male</option>
          <option>Female</option>
        </select>

        <select
          value={params.health_class}
          onChange={e =>
            setParams({
              ...params,
              health_class: e.target.value as HealthClass
            })
          }
          className="border p-2 rounded"
        >
          {HEALTH_CLASSES.map(h => (
            <option key={h}>{h}</option>
          ))}
        </select>

        <select
          value={params.face_amount}
          onChange={e =>
            setParams({ ...params, face_amount: Number(e.target.value) })
          }
          className="border p-2 rounded"
        >
          {FACE_OPTIONS.map(v => (
            <option key={v} value={v}>
              {fmt(v)}
            </option>
          ))}
        </select>

        <select
          value={params.term_years}
          onChange={e =>
            setParams({ ...params, term_years: Number(e.target.value) })
          }
          className="border p-2 rounded"
        >
          {TERM_OPTIONS.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>

      </div>

      <div>

        <h2 className="font-semibold mb-2">
          Select Providers
        </h2>

        <div className="flex flex-wrap gap-3">
          {CARRIERS.map(c => (
            <label key={c.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCarriers.has(c.id)}
                onChange={() => toggleCarrier(c.id)}
              />
              {c.carrier}
            </label>
          ))}
        </div>

      </div>

      <button
        onClick={() => setQuoteGenerated(true)}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Generate Quote
      </button>

      {results.length > 0 && (

        <table className="w-full border mt-6">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Carrier</th>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-right">Monthly</th>
              <th className="p-2 text-right">Annual</th>
              <th className="p-2 text-right">Term Total</th>
            </tr>
          </thead>

          <tbody>
            {results.map(r => (
              <tr key={r.carrier} className="border-t">
                <td className="p-2">{r.carrier}</td>
                <td className="p-2">{r.product}</td>
                <td className="p-2 text-right">{fmt(r.monthly)}</td>
                <td className="p-2 text-right">{fmt(r.annual)}</td>
                <td className="p-2 text-right">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>

        </table>

      )}

    </div>
  )
}

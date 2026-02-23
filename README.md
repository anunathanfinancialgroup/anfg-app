# FNA Complete Page - Integration Guide

## Overview
This guide explains how to add the ASSETS section alongside the existing FINANCIAL GOALS & PLANNING section on a single page.

## Database Tables Created

### 6 New Tables (all linked to `fna_records` via `fna_id`):

1. **fna_ast_retirement** - Retirement planning assets (401k, IRA, ESPP, RSU)
2. **fna_ast_real_estate** - Real estate investments (home, rentals, land)
3. **fna_ast_income** - Stocks, business, income, cash
4. **fna_ast_protection** - Insurance and family protection
5. **fna_ast_college_estate** - 529 plans and estate planning
6. **fna_ast_foreign** - Foreign assets

## Page Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Client Financial Need Analysis            │
│  [Logout Button]                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Action Buttons: [Refresh] [Save] [Export]         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Client Selection & Info                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TAB 1: FINANCIAL GOALS & PLANNING                  │
│  ├─ Kids College Planning                           │
│  ├─ Kids Wedding Planning                           │
│  ├─ Retirement Planning                             │
│  ├─ Healthcare Planning                             │
│  ├─ Life Goals Planning                             │
│  ├─ Legacy Planning                                 │
│  └─ TOTAL REQUIREMENT                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TAB 2: ASSETS                                      │
│  ├─ Retirement Planning Assets                      │
│  ├─ Real Estate Investments                         │
│  ├─ Stocks/Business/Income                          │
│  ├─ Family Protection & Insurance                   │
│  ├─ College/Estate Planning                         │
│  ├─ Foreign Assets                                  │
│  └─ TOTAL ASSETS (Present & Projected @ 65)        │
└─────────────────────────────────────────────────────┘
```

## Assets Section Table Structure

Each asset category follows this pattern:

```
┌────┬─────────────────┬─────┬─────┬────────┬───────────┬──────────────┐
│ #  │ DESCRIPTION     │ HIM │ HER │ NOTES  │ PRESENT $ │ PROJECTED $  │
├────┼─────────────────┼─────┼─────┼────────┼───────────┼──────────────┤
│ 1  │ CURRENT 401K    │ ☑   │ ☑   │ Notes  │ $700,000  │ $1,453,312   │
└────┴─────────────────┴─────┴─────┴────────┴───────────┴──────────────┘
```

## Key Features

### 1. Two-Tab Interface
- **Tab 1:** Financial Goals & Planning (existing)
- **Tab 2:** Assets (new)
- Both tabs save simultaneously when user clicks Save

### 2. Assets Input Fields

**For each asset row:**
- **HIM/HER:** Checkboxes (Y/N)
- **NOTES:** Free text editable field
- **PRESENT VALUE:** Currency input with decimals
- **PROJECTED VALUE @ 65:** Currency input with decimals

### 3. Section Totals

**Bottom of Assets Tab:**
```
TOTAL PRESENT VALUE: $2,994,000
TOTAL PROJECTED VALUE @ 65: $11,084,027
```

## Implementation Steps

### Step 1: Run Database Migration
```sql
-- Run fna-assets-tables.sql in Supabase
```

### Step 2: Add State Interface
```typescript
interface AssetsData {
  // Retirement Planning
  current401k_him: boolean;
  current401k_her: boolean;
  current401k_notes: string;
  current401k_present: number;
  current401k_projected: number;
  // ... repeat for all asset fields
}
```

### Step 3: Create Assets Cards
Similar to Financial Goals cards, create cards for each asset category with:
- Row number (#1, #2, etc.)
- Description
- HIM checkbox
- HER checkbox
- Notes input
- Present Value input
- Projected Value input

### Step 4: Save Function
```typescript
const handleSave = async () => {
  // Save Financial Goals (existing)
  // Save Assets (new)
  await Promise.all([
    saveFinancialGoals(),
    saveRetirementAssets(),
    saveRealEstateAssets(),
    saveIncomeAssets(),
    saveProtectionAssets(),
    saveCollegeEstateAssets(),
    saveForeignAssets()
  ]);
};
```

## Sample Asset Card Structure

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
  <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
    <thead>
      <tr style={{ backgroundColor: '#BDD7EE' }}>
        <th className="border border-black">#</th>
        <th className="border border-black">RETIREMENT PLANNING (USA)</th>
        <th className="border border-black">HIM</th>
        <th className="border border-black">HER</th>
        <th className="border border-black">NOTES</th>
        <th className="border border-black">PRESENT VALUE</th>
        <th className="border border-black">PROJECTED VALUE @ 65</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="border border-black">#1</td>
        <td className="border border-black">CURRENT 401K | 403B</td>
        <td className="border border-black">
          <input type="checkbox" checked={assets.current401k_him} onChange={...} />
        </td>
        <td className="border border-black">
          <input type="checkbox" checked={assets.current401k_her} onChange={...} />
        </td>
        <td className="border border-black p-0">
          <ExcelTextInput value={assets.current401k_notes} onChange={...} />
        </td>
        <td className="border border-black p-0">
          <ExcelNumberInput value={assets.current401k_present} onChange={...} />
        </td>
        <td className="border border-black p-0">
          <ExcelNumberInput value={assets.current401k_projected} onChange={...} />
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## Benefits of This Structure

1. **Single Page:** Both sections accessible without navigation
2. **Single Save:** One button saves everything
3. **Comprehensive:** Complete financial picture in one view
4. **Organized:** Clear separation via tabs
5. **Professional:** Matches PDF format exactly

## Next Steps

Would you like me to:
1. Create the complete integrated page file?
2. Create just the Assets section as a separate component?
3. Provide specific code snippets for integration?

The complete file would be approximately 2,500-3,000 lines including both sections.

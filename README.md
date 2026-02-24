# ✅ Complete Deployment Checklist

## Phase 1: Database Setup

### Step 1: Run Database Migration
1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Copy contents of `DATABASE-MIGRATION.sql`
4. Click "Run"
5. Verify all 4 columns added ✅

```sql
-- Quick verification query:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'fna_records' 
AND column_name IN ('dob', 'notes', 'planned_retirement_age', 'calculated_interest_percentage');
```

Expected result: 4 rows

---

## Phase 2: Code Updates

Use ONE of these approaches:

### Option A: Copy-Paste Sections (Recommended)
Follow `COPY-PASTE-SECTIONS.md` and update:
- [ ] Section 1: Interfaces
- [ ] Section 2: State variables
- [ ] Section 3: useEffect for interest calc
- [ ] Section 4: Row 3 fields
- [ ] Section 5: Action buttons
- [ ] Section 6: Header buttons  
- [ ] Section 7: Main container
- [ ] Section 8: Tab buttons

### Option B: Manual Updates
Follow `MANUAL-UPDATE-GUIDE.md`:
- [ ] Part 1: Update interface
- [ ] Part 2: Update initialData
- [ ] Part 3: Remove PDF code
- [ ] Part 4-11: Update all functions

---

## Phase 3: Additional Code Updates

### Update loadFNAData SELECT query:
```typescript
.select('fna_id, analysis_date, spouse_name, dob, notes, planned_retirement_age, calculated_interest_percentage')
```

### Update loadFNAData setData:
```typescript
setData(prev => ({
  ...prev,
  dob: fnaRecord.dob || '',
  notes: fnaRecord.notes || '',
  plannedRetirementAge: fnaRecord.planned_retirement_age || 65,
  calculatedInterestPercentage: fnaRecord.calculated_interest_percentage || 6,
  // ... rest
}));
```

### Update handleSave INSERT:
```typescript
.insert([{
  client_id: data.clientId,
  analysis_date: data.analysisDate,
  spouse_name: data.spouseName,
  dob: data.dob,
  notes: data.notes,
  planned_retirement_age: data.plannedRetirementAge,
  calculated_interest_percentage: data.calculatedInterestPercentage
}])
```

### Update handleSave UPDATE:
```typescript
.update({
  analysis_date: data.analysisDate,
  spouse_name: data.spouseName,
  dob: data.dob,
  notes: data.notes,
  planned_retirement_age: data.plannedRetirementAge,
  calculated_interest_percentage: data.calculatedInterestPercentage,
  updated_at: new Date().toISOString()
})
```

### Update handleClear:
```typescript
setData(prev => ({
  ...initialData,
  clientId: prev.clientId,
  clientName: prev.clientName,
  // ... existing fields
  dob: prev.dob,
  notes: prev.notes,
  plannedRetirementAge: prev.plannedRetirementAge,
  calculatedInterestPercentage: prev.calculatedInterestPercentage,
  // ... rest
}));
```

### Update handleClientSelect:
```typescript
setData(prev => ({
  ...initialData,
  // ... existing fields
  plannedRetirementAge: 65,
  calculatedInterestPercentage: 6,
}));
```

---

## Phase 4: Cleanup

### Delete PDF-Related Code:
- [ ] Delete `const contentRef = useRef<HTMLDivElement>(null);`
- [ ] Delete `const [exporting, setExporting] = useState(false);`
- [ ] Delete entire `handleExportPDF` function
- [ ] Delete Export PDF button from JSX
- [ ] Remove `ref={contentRef}` from main tag

---

## Phase 5: Build & Deploy

### Local Build Test:
```bash
npm run build
```

Expected: ✅ Build success (no html2pdf.js error!)

### Deploy to Vercel:
```bash
git add .
git commit -m "Add new Client Info fields, remove PDF export, responsive buttons"
git push origin main
```

Vercel auto-deploys ✅

---

## Phase 6: Testing

### Test New Fields:
- [ ] Select a client
- [ ] Enter Date of Birth
- [ ] Select Planned Retirement Age = 65
- [ ] Select Interest% = 6%
- [ ] Enter Note
- [ ] Click Save
- [ ] Reload page
- [ ] Verify all fields loaded ✅

### Test Interest Calculation:
- [ ] Set Current Age = 45
- [ ] Set Planned Retirement Age = 65 (20 years)
- [ ] Go to Assets tab
- [ ] Enter Present Value = $100,000
- [ ] Change Interest% from 6% to 10%
- [ ] Verify Projected Value updates:
  - 6% → ~$320,000
  - 10% → ~$670,000 ✅

### Test Responsive Design:
- [ ] Open on desktop → buttons normal size ✅
- [ ] Open on mobile → buttons smaller ✅
- [ ] Client Info fields stack properly on mobile ✅

### Test Existing Features:
- [ ] Show Cards button works ✅
- [ ] Individual Show/Hide buttons work ✅
- [ ] Clear keeps Client Info ✅
- [ ] External links work ✅
- [ ] Currency input works (no cursor jump) ✅
- [ ] Child names auto-copy College → Wedding ✅
- [ ] Row #11 has yellow background ✅

---

## ✅ Success Criteria:

- [x] Build succeeds with NO errors
- [x] 4 new Client Info fields visible
- [x] Interest calculation works
- [x] Buttons are smaller/responsive
- [x] No PDF export button
- [x] All previous features work
- [x] Mobile-friendly layout

---

## 🎯 Final Verification:

Run through complete workflow:
1. Select client
2. Fill all Client Info fields (including new Row 3)
3. Enter data in Goals tab
4. Enter data in Assets tab
5. Change interest % and watch recalculation
6. Save FNA
7. Reload page
8. Verify all data persisted
9. Test on mobile device

**If all tests pass → DEPLOYMENT SUCCESSFUL!** 🎉

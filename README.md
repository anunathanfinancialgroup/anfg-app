# Complete FNA Assembly Guide - 3 Parts

## Files You Have

1. **fna-complete-part1.tsx** (~700 lines)
   - Imports, interfaces, initial data
   - Component setup
   - State management
   - Auto-calculations

2. **fna-complete-part2.tsx** (~500 lines)
   - Save function (13 tables)
   - Helper functions
   - Input components
   - Column resizing

3. **fna-complete-part3.tsx** (~1,150 lines)
   - Complete JSX return statement
   - Header
   - Client information
   - **TWO TAB CARDS** (Goals & Assets)
   - Complete Goals section
   - Assets placeholder

4. **fna-assets-tables.sql**
   - Database tables

## How to Assemble

### Step 1: Create New File

```bash
touch fna-complete-with-tabs.tsx
```

### Step 2: Copy in Order

Open `fna-complete-with-tabs.tsx` and:

1. **Copy ALL of Part 1**
   - Select entire file
   - Copy and paste

2. **Copy Part 2 (skip comment headers)**
   - Start from line 2: `const handleSave = async () => {`
   - Copy through `const ExcelNumberInput =...`
   - Paste at end of file

3. **Copy Part 3 (skip comment headers)**
   - Start from line 2: `return (`
   - Copy through the final `}`
   - Paste at end of file

### Step 3: Clean Up

Remove these comment lines:
- `// ============================================`
- `// PART X OF 3...`
- `// END OF PART X`
- `// Continue with...`

### Step 4: Verify Structure

Final file should look like:

```typescript
"use client";

import React...

const COLORS = {...}

interface Client {...}
interface FNAData {...}
interface AssetsData {...}

const initialData = {...}
const initialAssets = {...}

export default function FNAPage() {
  const router = useRouter();
  const [data, setData] = useState...
  
  useEffect(() => {...})
  
  const handleSave = async () => {...}
  const handleExportPDF = () => {...}
  
  const ResizableHeader = ({...}) => {...}
  const ExcelTextInput = ({...}) => {...}
  const ExcelNumberInput = ({...}) => {...}
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Complete UI */}
    </div>
  );
}
```

## What You'll See

After assembly, the page will have:

✅ Header with logo
✅ Refresh/Save/Export buttons
✅ Client information form
✅ **TWO CLICKABLE TAB CARDS:**
   - 📊 FINANCIAL GOALS & PLANNING (blue when active)
   - 💰 ASSETS (blue when active)
✅ Complete Goals section (working)
✅ Assets placeholder (ready for content)

## File Size Check

Complete assembled file should be:
- **Lines:** ~2,350
- **Size:** ~110 KB
- **Tab cards:** 2 (working)
- **Sections:** Goals complete, Assets placeholder

## Deploy & Test

```bash
# 1. Run database migration
# In Supabase: fna-assets-tables.sql

# 2. Copy to your app
cp fna-complete-with-tabs.tsx app/fna/page.tsx

# 3. Test
npm run dev

# 4. Check:
# - Can you see two tab buttons?
# - Does clicking switch tabs?
# - Does Goals tab show all content?
# - Does Assets tab show placeholder?

# 5. Deploy
git add .
git commit -m "Complete FNA with tab cards"
git push
```

## Next Steps

After verifying tabs work:

1. I'll provide the Assets content (31 rows)
2. You replace the placeholder in Assets tab
3. Full system complete!

## Quick Test

After assembly:
1. Open page
2. See two tab buttons at top
3. Click "FINANCIAL GOALS & PLANNING" → See all goals content
4. Click "ASSETS" → See placeholder
5. Save works (saves goals data)

## Success Criteria

✅ No TypeScript errors
✅ File compiles
✅ Two tabs visible
✅ Tabs are clickable
✅ Content switches
✅ Goals tab fully functional
✅ Assets tab shows placeholder


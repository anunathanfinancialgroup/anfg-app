# FNA with Two Tab Cards - Implementation Summary

## What's Being Created

A single FNA page with TWO clickable tab cards:

┌─────────────────────────────────────────────────────────────┐
│  Client Information (shared between both tabs)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ 📊 GOALS        │  │ 💰 ASSETS       │  ← Clickable Tabs
│ (ACTIVE)        │  │                 │
└─────────────────┘  └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  TAB 1 CONTENT (when Goals tab is clicked):                  │
│  • Kids College Planning                                      │
│  • Kids Wedding Planning                                      │
│  • Retirement Planning                                        │
│  • Healthcare Planning                                        │
│  • Life Goals                                                 │
│  • Legacy Planning                                            │
│  • TOTAL REQUIREMENT                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘

OR

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  TAB 2 CONTENT (when Assets tab is clicked):                 │
│  • Retirement Planning Assets (7 rows)                        │
│  • Real Estate Investments (4 rows)                           │
│  • Stocks/Business/Income (7 rows)                            │
│  • Family Protection & Insurance (8 rows)                     │
│  • College/Estate Planning (2 rows)                           │
│  • Foreign Assets (2 rows)                                    │
│  • TOTAL ASSETS                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

1. **Single Client Selection** - Select client once, data shared between tabs
2. **Tab Switching** - Click tabs to switch between Goals and Assets
3. **Single Save Button** - Saves both Goals and Assets data
4. **Single Export** - PDF includes both sections
5. **Clean UI** - Only one section visible at a time

## File Being Created

`fna-with-two-tabs.tsx` - Complete file with:
- Both interfaces
- Tab state management
- Both card sections
- Single save for all data
- PDF export for both sections

## Total Content

- **Goals Section**: 19 rows across 7 categories
- **Assets Section**: 31 rows across 6 categories
- **Total**: 50 input rows + calculations

## User Experience

1. User opens FNA page
2. Selects client (auto-fills info)
3. Clicks "GOALS" tab → Sees/fills goals data
4. Clicks "ASSETS" tab → Sees/fills assets data
5. Clicks "Save" → Saves everything to 13 tables
6. Clicks "Export" → Gets PDF with both sections


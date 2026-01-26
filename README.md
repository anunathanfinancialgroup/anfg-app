# Quick Fix Guide - FNA Header Styling

## 🎯 The 3 Main Fixes

### 1️⃣ Title Color
**Change:**
```tsx
// OLD - Wrong color
<div className="text-xl font-bold text-[WRONG_COLOR]">Financial Needs Analysis</div>

// NEW - Correct blue color
<div className="text-xl font-bold text-blue-800">Financial Needs Analysis</div>
```

### 2️⃣ Subtitle Color
**Change:**
```tsx
// Make sure subtitle uses slate-600
<div className="text-sm text-slate-600">Select a client and complete all six sections of the FNA.</div>
```

### 3️⃣ Logout Button - Remove Black Fill
**Change:**
```tsx
// OLD - Black filled button
className="... border bg-slate-900 hover:bg-slate-800 text-white border-slate-900"

// NEW - Plain button with border only
className="... border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700"
```

---

## 📋 Copy-Paste Ready Code

### Complete Logout Button
```tsx
<button
  type="button"
  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700"
  onClick={logout}
>
  Logout ➜]
</button>
```

### Complete Header Section
```tsx
<div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-3">
      <img src="/can-logo.png" alt="CAN Financial Solutions" className="h-10 w-auto" />
      <div>
        <div className="text-xl font-bold text-blue-800">Financial Needs Analysis</div>
        <div className="text-sm text-slate-600">Select a client and complete all six sections of the FNA.</div>
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
</div>
```

---

## ✅ Checklist

- [ ] Title uses `text-blue-800` class
- [ ] Subtitle uses `text-slate-600` class  
- [ ] Logout button has `bg-transparent` (not bg-slate-900)
- [ ] Logout button has `text-slate-700` (not text-white)
- [ ] Logout button has `border-slate-300` (not border-slate-900)
- [ ] Logout button has `hover:bg-slate-50` (not hover:bg-slate-800)
- [ ] Logo size is `h-10 w-auto`
- [ ] Header uses `rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm`

---

## 🎨 Color Reference

| Element | Tailwind Class | Hex Color |
|---------|---------------|-----------|
| Title | `text-blue-800` | #1e40af |
| Subtitle | `text-slate-600` | #475569 |
| Button Text | `text-slate-700` | #334155 |
| Button Border | `border-slate-300` | #cbd5e1 |
| Button Hover BG | `hover:bg-slate-50` | #f8fafc |

---

## 🔍 Before & After

**BEFORE (Wrong):**
```
┌─────────────────────────────────────────────────┐
│ [CAN Logo] Financial Needs Analysis      [●●●] │
│            (Wrong color title)        (Black)   │
└─────────────────────────────────────────────────┘
```

**AFTER (Correct):**
```
┌─────────────────────────────────────────────────┐
│ [CAN Logo] Financial Needs Analysis      [□□□] │
│            (Blue-800 title)          (No fill)  │
└─────────────────────────────────────────────────┘
```

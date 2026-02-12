# How to Restore the Analysis Tab

The Analysis tab (Monthly Comparison and Savings) was removed from the UI to save space, but the components remain in the codebase.

## 1. Components
Ensure these files still exist in your `components/` directory:
- `components/MonthlyComparison.tsx`
- `components/Savings.tsx`

## 2. Re-enable in `app/page.tsx`

### Imports
Uncomment or add these imports:

```tsx
import { MonthlyComparison } from "@/components/MonthlyComparison";
import { Savings } from "@/components/Savings";
import { BarChart3 } from "lucide-react";
```

### State
Update the `activeTab` state type to include "analysis":

```tsx
const [activeTab, setActiveTab] = useState<"dashboard" | "summary" | "wishlist" | "analysis">("dashboard");
```

### Navigation Button
Add this button back to the bottom navigation bar (inside the `<section className="sticky bottom-0 ...">`):

```tsx
<button
  className={`flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 transition ${activeTab === "analysis" ? "bg-white shadow-sm" : "text-muted-foreground"
    }`}
  onClick={() => setActiveTab("analysis")}
>
  <BarChart3 className="h-4 w-4" />
  <span>Analysis</span>
</button>
```

### Tab Content
Add this content block to the main render logic (e.g., before `<Settings />`):

```tsx
{activeTab === "analysis" && (
  <div className="space-y-4 pb-8">
      <section className="card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Monthly Spending</h2>
          <div className="border border-border/50 rounded-lg p-4 bg-white/50">
              <MonthlyComparison transactions={transactions} />
          </div>
      </section>

      <section className="card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Savings Reality</h2>
          <Savings transactions={transactions} />
      </section>
  </div>
)}
```

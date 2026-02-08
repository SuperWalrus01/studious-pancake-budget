"use client";

import type { Transaction, Category } from "@/app/page";

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "bg-emerald-500/10 text-emerald-700",
  Transport: "bg-sky-500/10 text-sky-700",
  Housing: "bg-slate-500/10 text-slate-800",
  Utilities: "bg-indigo-500/10 text-indigo-700",
  Entertainment: "bg-violet-500/10 text-violet-700",
  Health: "bg-rose-500/10 text-rose-700",
  Shopping: "bg-amber-500/10 text-amber-700",
  Other: "bg-zinc-500/10 text-zinc-700",
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

type Props = {
  transactions: Transaction[];
  selectedMonthKey: string;
};

export function Summary({ transactions, selectedMonthKey }: Props) {
  const filtered = transactions.filter((tx) => getMonthKey(new Date(tx.date)) === selectedMonthKey);

  const byCategory = filtered.reduce<Record<Category, number>>((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
    return acc;
  }, {
    Food: 0,
    Transport: 0,
    Housing: 0,
    Utilities: 0,
    Entertainment: 0,
    Health: 0,
    Shopping: 0,
    Other: 0,
  });

  const entries = Object.entries(byCategory).filter(([, value]) => value > 0) as [Category, number][];
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No expenses recorded for this month yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold tracking-tight">£{total.toFixed(2)}</span>
      </div>
      <ul className="space-y-2">
        {entries.map(([category, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <li key={category} className="rounded-2xl bg-muted px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ${CATEGORY_COLORS[category]}`}
                  >
                    {category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">£{value.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-black/80 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import type { Transaction, Category } from "@/app/page";
import { CATEGORY_COLOR_HEX } from "@/lib/categoryColors";

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
    "Groceries": 0,
    "Food": 0,
    "Transport": 0,
    "Household": 0,
    "Sport": 0,
    "Fun / Go out": 0,
    "Clothes": 0,
    "Tech / Hobby": 0,
    "Other": 0,
  });

  const entries = Object.entries(byCategory).filter(([, value]) => value > 0) as [Category, number][];
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No expenses recorded for this month yet.</p>;
  }

  let currentOffset = 0;
  const segments: string[] = [];
  for (const [category, value] of entries) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    const start = currentOffset;
    const end = start + pct;
    segments.push(`${CATEGORY_COLOR_HEX[category]} ${start}% ${end}%`);
    currentOffset = end;
  }

  const pieBackground = segments.length
    ? `conic-gradient(${segments.join(", ")})`
    : "conic-gradient(#e5e7eb 0 100%)";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div
          className="relative h-24 w-24 rounded-full"
          style={{ backgroundImage: pieBackground }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-card">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">£{total.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total spent</p>
          <p className="text-2xl font-semibold tracking-tight">£{total.toFixed(2)}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {entries.map(([category, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <li
              key={category}
              className="rounded-2xl bg-muted px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-7 items-center rounded-full px-3 text-xs font-medium"
                    style={{
                      backgroundColor: `${CATEGORY_COLOR_HEX[category]}1a`,
                      color: CATEGORY_COLOR_HEX[category],
                    }}
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
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLOR_HEX[category],
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

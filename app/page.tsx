"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, PieChart, List, Trash2 } from "lucide-react";
import { AddTransaction } from "@/components/AddTransaction";
import { Summary } from "@/components/Summary";
import { supabase } from "@/lib/supabaseClient";

export type Category =
  | "Food"
  | "Transport"
  | "Housing"
  | "Utilities"
  | "Entertainment"
  | "Health"
  | "Shopping"
  | "Other";

export type Transaction = {
  id: string;
  description: string;
  category: Category;
  amount: number;
  date: string; // ISO string
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("id, description, category, amount, date")
        .order("date", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load expenses from Supabase", error);
        setTransactions([]);
      } else if (data) {
        setTransactions(
          data.map((row) => ({
            id: row.id as string,
            description: row.description ?? "",
            category: (row.category ?? "Other") as Category,
            amount: Number(row.amount ?? 0),
            date: row.date ?? new Date().toISOString(),
          }))
        );
      }

      setLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const addTransaction = async (tx: Omit<Transaction, "id">) => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description: tx.description,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
      })
      .select("id, description, category, amount, date")
      .single();

    if (error) {
      console.error("Failed to insert expense into Supabase", error);
      return;
    }

    if (data) {
      setTransactions((prev) =>
        [
          {
            id: data.id as string,
            description: data.description ?? tx.description,
            category: (data.category ?? tx.category) as Category,
            amount: Number(data.amount ?? tx.amount),
            date: data.date ?? tx.date,
          },
          ...prev,
        ].sort((a, b) => (a.date < b.date ? 1 : -1))
      );
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete expense from Supabase", error);
      return;
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  return { transactions, addTransaction, deleteTransaction, loading };
}

export default function HomePage() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [activeTab, setActiveTab] = useState<"dashboard" | "summary">("dashboard");
  const [shouldScrollToAdd, setShouldScrollToAdd] = useState(false);
  const addTransactionRef = useRef<(tx: Omit<Transaction, "id">) => Promise<void> | void>(addTransaction);

  useEffect(() => {
    addTransactionRef.current = addTransaction;
  }, [addTransaction]);

  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  const currentMonthTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = new Date(tx.date);
        return getMonthKey(d) === currentMonthKey;
      }),
    [transactions, currentMonthKey]
  );

  const currentMonthTotal = useMemo(
    () => currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [currentMonthTransactions]
  );

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    transactions.forEach((tx) => {
      keys.add(getMonthKey(new Date(tx.date)));
    });
    const sorted = Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
    return sorted.length ? sorted : [currentMonthKey];
  }, [transactions, currentMonthKey]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  useEffect(() => {
    setSelectedMonth(currentMonthKey);
  }, [currentMonthKey]);

  // If opened with ?quickAdd=1, jump straight to the add form.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const quickAdd = params.get("quickAdd");
    const shortcutFlag = params.get("addExpense") ?? params.get("shortcutAdd");

    if (quickAdd === "1") {
      setActiveTab("dashboard");
      setShouldScrollToAdd(true);
    }

    if (shortcutFlag === "1") {
      const descriptionParam =
        params.get("description") ?? params.get("desc") ?? "";
      const amountParam = params.get("amount") ?? params.get("price") ?? "";
      const categoryParam = params.get("category") ?? params.get("cat") ?? "Other";

      const numericAmount = Number.parseFloat(amountParam.replace(",", "."));

      const category: Category =
        categoryParam === "Food" ||
        categoryParam === "Transport" ||
        categoryParam === "Housing" ||
        categoryParam === "Utilities" ||
        categoryParam === "Entertainment" ||
        categoryParam === "Health" ||
        categoryParam === "Shopping" ||
        categoryParam === "Other"
          ? categoryParam
          : "Other";

      if (descriptionParam.trim() && Number.isFinite(numericAmount) && numericAmount > 0) {
        addTransactionRef.current({
          description: descriptionParam.trim(),
          category,
          amount: Number(numericAmount.toFixed(2)),
          date: new Date().toISOString(),
        });
      }

      setActiveTab("dashboard");
      setShouldScrollToAdd(true);

      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  useEffect(() => {
    if (!shouldScrollToAdd) return;
    const el = document.getElementById("add-transaction");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setShouldScrollToAdd(false);
    }
  }, [shouldScrollToAdd, activeTab]);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">This month</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">£{currentMonthTotal.toFixed(2)}</h1>
        </div>
        <button
          className="button-primary gap-2"
          onClick={() => {
            const el = document.getElementById("add-transaction");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <Plus className="h-5 w-5" />
          <span>Add</span>
        </button>
      </header>

      <section className="mb-4 rounded-full bg-muted px-1 py-1 navbar flex items-center justify-between text-sm font-medium">
        <button
          className={`flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 transition ${
            activeTab === "dashboard" ? "bg-white shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <List className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 transition ${
            activeTab === "summary" ? "bg-white shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          <PieChart className="h-4 w-4" />
          <span>Summary</span>
        </button>
      </section>

      {activeTab === "dashboard" ? (
        <div className="space-y-4 pb-8">
          <section id="add-transaction" className="card p-4">
            <AddTransaction onAdd={addTransaction} />
          </section>

          <section className="card p-4">
            <header className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Recent</h2>
              <span className="text-xs text-muted-foreground">{currentMonthTransactions.length} items</span>
            </header>
            {currentMonthTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet this month.</p>
            ) : (
              <ul className="divide-y divide-border">
                {currentMonthTransactions.map((tx) => {
                  const d = new Date(tx.date);
                  const day = d.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <li key={tx.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium leading-tight">{tx.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {tx.category} · {day}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold">£{tx.amount.toFixed(2)}</p>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:scale-[0.96] transition"
                          onClick={() => {
                            void deleteTransaction(tx.id);
                          }}
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Monthly summary</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {selectedMonth.replace("-", " ")}
                </p>
              </div>
              <select
                className="select max-w-[9rem]"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {key.replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>

            <Summary
              transactions={transactions}
              selectedMonthKey={selectedMonth}
            />
          </section>
        </div>
      )}
    </main>
  );
}

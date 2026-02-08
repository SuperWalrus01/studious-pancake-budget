"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, PieChart, List, Trash2, RefreshCw, ShoppingBag } from "lucide-react";
import { AddTransaction } from "@/components/AddTransaction";
import { Summary } from "@/components/Summary";
import { AddWishItem, type WishItemInput } from "@/components/AddWishItem";
import { CATEGORY_COLOR_HEX } from "@/lib/categoryColors";
import { supabase } from "@/lib/supabaseClient";

export type Category =
  | "Groceries"
  | "Food"
  | "Transport"
  | "Household"
  | "Sport"
  | "Fun / Go out"
  | "Clothes"
  | "Tech / Hobby"
  | "Other";

export type Transaction = {
  id: string;
  description: string;
  category: Category;
  amount: number;
  date: string; // ISO string
};

export type WishItem = {
  id: string;
  name: string;
  url: string;
  price: number;
  createdAt: string;
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key: string) {
  const [yearString, monthString] = key.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  if (!year || !month) return key;

  const d = new Date(year, month - 1, 1);
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}

function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFromSupabase = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("id, description, category, amount, date")
      .order("date", { ascending: false });

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

  useEffect(() => {
    void loadFromSupabase();
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

  const reload = async () => {
    await loadFromSupabase();
  };

  return { transactions, addTransaction, deleteTransaction, loading, reload };
}

function useWishlist() {
  const [items, setItems] = useState<WishItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, name, url, price, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load wishlist from Supabase", error);
        setItems([]);
      } else if (data) {
        setItems(
          data.map((row) => ({
            id: row.id as string,
            name: row.name ?? "",
            url: row.url ?? "",
            price: Number(row.price ?? 0),
            createdAt: row.created_at ?? new Date().toISOString(),
          }))
        );
      }
    };

    void load();
  }, []);

  const addItem = async (input: WishItemInput) => {
    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({
        name: input.name,
        url: input.url,
        price: input.price,
      })
      .select("id, name, url, price, created_at")
      .single();

    if (error) {
      console.error("Failed to insert wishlist item into Supabase", error);
      return;
    }

    if (data) {
      setItems((prev) => [
        {
          id: data.id as string,
          name: data.name ?? input.name,
          url: data.url ?? input.url,
          price: Number(data.price ?? input.price),
          createdAt: data.created_at ?? new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete wishlist item from Supabase", error);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, addItem, deleteItem };
}

export default function HomePage() {
  const { transactions, addTransaction, deleteTransaction, loading, reload } = useTransactions();
  const { items: wishlistItems, addItem, deleteItem } = useWishlist();
  const [activeTab, setActiveTab] = useState<"dashboard" | "summary" | "wishlist">("dashboard");
  const [shouldScrollToAdd, setShouldScrollToAdd] = useState(false);
  const [recentSort, setRecentSort] = useState<"time" | "category" | "amount">("time");
  const [selectedWishlistItemIds, setSelectedWishlistItemIds] = useState<string[]>([]);
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

  const sortedCurrentMonthTransactions = useMemo(() => {
    const list = [...currentMonthTransactions];

    if (recentSort === "category") {
      return list.sort((a, b) => {
        const byCategory = a.category.localeCompare(b.category);
        if (byCategory !== 0) return byCategory;
        return a.date < b.date ? 1 : -1;
      });
    }

    if (recentSort === "amount") {
      return list.sort((a, b) => {
        if (a.amount === b.amount) {
          return a.date < b.date ? 1 : -1;
        }
        return b.amount - a.amount; // highest amount first
      });
    }

    // Default: sort by time (newest first)
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [currentMonthTransactions, recentSort]);

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

  // Keep wishlist selection in sync with loaded items.
  useEffect(() => {
    if (!wishlistItems.length) {
      setSelectedWishlistItemIds([]);
      return;
    }

    const allIds = wishlistItems.map((item) => item.id);

    setSelectedWishlistItemIds((prev) => {
      // First-time load: select all by default
      if (!prev.length) {
        return allIds;
      }

      const itemIdSet = new Set(allIds);
      const prevSet = new Set(prev);

      // Remove ids that no longer exist
      let next = prev.filter((id) => itemIdSet.has(id));

      // Automatically select any newly added items
      const addedIds = allIds.filter((id) => !prevSet.has(id));
      if (addedIds.length) {
        next = [...next, ...addedIds];
      }

      return next;
    });
  }, [wishlistItems]);

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

      const allowedCategories: Category[] = [
        "Groceries",
        "Food",
        "Transport",
        "Household",
        "Sport",
        "Fun / Go out",
        "Clothes",
        "Tech / Hobby",
      ];

      const category: Category = allowedCategories.includes(categoryParam as Category)
        ? (categoryParam as Category)
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

  const wishlistSelectedTotal = useMemo(
    () =>
      wishlistItems.reduce((sum, item) =>
        selectedWishlistItemIds.includes(item.id) ? sum + (item.price ?? 0) : sum,
      0),
    [wishlistItems, selectedWishlistItemIds]
  );

  const selectedWishlistCount = useMemo(
    () => wishlistItems.filter((item) => selectedWishlistItemIds.includes(item.id)).length,
    [wishlistItems, selectedWishlistItemIds]
  );

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">This month</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">£{currentMonthTotal.toFixed(2)}</h1>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted active:scale-[0.96] transition disabled:opacity-50 disabled:active:scale-100"
            onClick={() => {
              void reload();
            }}
            disabled={loading}
            aria-label="Refresh expenses"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
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
        <button
          className={`flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 transition ${
            activeTab === "wishlist" ? "bg-white shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("wishlist")}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Want to buy</span>
        </button>
      </section>

      {activeTab === "dashboard" && (
        <div className="space-y-4 pb-8">
          <section id="add-transaction" className="card p-4">
            <AddTransaction onAdd={addTransaction} />
          </section>

          <section className="card p-4">
            <header className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Recent</h2>
                <span className="text-xs text-muted-foreground">{currentMonthTransactions.length} items</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-muted px-1 py-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  className={`rounded-full px-2 py-1 transition ${
                    recentSort === "time" ? "bg-white shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setRecentSort("time")}
                >
                  Time
                </button>
                <button
                  type="button"
                  className={`rounded-full px-2 py-1 transition ${
                    recentSort === "category" ? "bg-white shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setRecentSort("category")}
                >
                  Category
                </button>
                <button
                  type="button"
                  className={`rounded-full px-2 py-1 transition ${
                    recentSort === "amount" ? "bg-white shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setRecentSort("amount")}
                >
                  Amount
                </button>
              </div>
            </header>
            {currentMonthTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet this month.</p>
            ) : (
              <ul className="divide-y divide-border">
                {sortedCurrentMonthTransactions.map((tx) => {
                  const d = new Date(tx.date);
                  const day = d.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  const time = d.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <li key={tx.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium leading-tight">{tx.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span style={{ color: CATEGORY_COLOR_HEX[tx.category] }}>
                            {tx.category}
                          </span>{" "}
                          · {day} · {time}
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
      )}

      {activeTab === "summary" && (
        <div className="space-y-4 pb-8">
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Monthly summary</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {formatMonthKey(selectedMonth)}
                </p>
              </div>
              <select
                className="select max-w-[9rem]"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatMonthKey(key)}
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

      {activeTab === "wishlist" && (
        <div className="space-y-4 pb-8">
          <section className="card p-4">
            <header className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Want to buy</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {wishlistItems.length} items
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Selected total</p>
                <p className="text-base font-semibold">
                  £{wishlistSelectedTotal.toFixed(2)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {selectedWishlistCount} of {wishlistItems.length} selected
                </p>
              </div>
            </header>

            <AddWishItem onAdd={addItem} />
          </section>

          <section className="card p-4">
            <header className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Items</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{wishlistItems.length} saved</span>
                {wishlistItems.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="rounded-full border border-border px-2 py-1 text-[11px] font-medium hover:bg-muted transition disabled:opacity-50"
                      onClick={() => {
                        setSelectedWishlistItemIds(wishlistItems.map((item) => item.id));
                      }}
                      disabled={
                        wishlistItems.length > 0 &&
                        selectedWishlistItemIds.length === wishlistItems.length
                      }
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-border px-2 py-1 text-[11px] font-medium hover:bg-muted transition disabled:opacity-50"
                      onClick={() => {
                        setSelectedWishlistItemIds([]);
                      }}
                      disabled={selectedWishlistItemIds.length === 0}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </header>
            {wishlistItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing on your wishlist yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {wishlistItems.map((item) => {
                  const isSelected = selectedWishlistItemIds.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2 max-w-[65%]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-slate-900 focus:ring-slate-900"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedWishlistItemIds((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          aria-label="Select item for total"
                        />
                        <div className="max-w-[calc(100%-1.5rem)]">
                          <p className="text-sm font-medium leading-tight truncate">
                            {item.name}
                          </p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 block text-xs text-blue-600 underline truncate"
                            >
                              {item.url}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold">
                          {item.price > 0 ? `£${item.price.toFixed(2)}` : ""}
                        </p>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:scale-[0.96] transition"
                          onClick={() => {
                            void deleteItem(item.id);
                          }}
                          aria-label="Delete wishlist item"
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
      )}
    </main>
  );
}

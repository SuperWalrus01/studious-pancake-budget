"use client";

import { FormEvent, useState } from "react";
import type { Category, Transaction } from "@/app/page";

const CATEGORIES: Category[] = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

type Props = {
  onAdd: (tx: Omit<Transaction, "id">) => void;
};

export function AddTransaction({ onAdd }: Props) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [amount, setAmount] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const numericAmount = Number.parseFloat(amount.replace(",", "."));
    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const now = new Date();

    onAdd({
      description: description.trim(),
      category,
      amount: Number(numericAmount.toFixed(2)),
      date: now.toISOString(),
    });

    setDescription("");
    setAmount("");
    setCategory("Food");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Description
        </label>
        <input
          className="input"
          type="text"
          inputMode="text"
          autoComplete="off"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Coffee, groceries, rent..."
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Amount
          </label>
          <input
            className="input text-right"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <button
        type="submit"
        className="button-primary w-full mt-1"
      >
        Add expense
      </button>
    </form>
  );
}

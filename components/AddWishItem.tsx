"use client";

import { FormEvent, useState } from "react";

export type WishItemInput = {
  name: string;
  url: string;
  price: number;
};

type Props = {
  onAdd: (item: WishItemInput) => Promise<void> | void;
};

export function AddWishItem({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const numericPrice = price
      ? Number.parseFloat(price.replace(",", "."))
      : 0;

    if (price && (!Number.isFinite(numericPrice) || numericPrice < 0)) {
      return;
    }

    await onAdd({
      name: name.trim(),
      url: url.trim(),
      price: Number(numericPrice.toFixed(2)),
    });

    setName("");
    setUrl("");
    setPrice("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Item name
        </label>
        <input
          className="input"
          type="text"
          inputMode="text"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New phone case, headphones..."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Link
        </label>
        <input
          className="input"
          type="url"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Estimated price (optional)
        </label>
        <input
          className="input text-right"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <button
        type="submit"
        className="button-primary mt-1 w-full"
      >
        Add item
      </button>
    </form>
  );
}

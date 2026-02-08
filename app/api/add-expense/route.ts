import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const description: string = (body.description ?? body.desc ?? "").toString();
    const rawAmount: string = (body.amount ?? body.price ?? "").toString();
    const rawCategory: string = (body.category ?? body.cat ?? "Other").toString();

    const numericAmount = Number.parseFloat(rawAmount.replace(",", "."));

    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid description or amount" },
        { status: 400 }
      );
    }

    const allowedCategories = [
      "Food",
      "Transport",
      "Housing",
      "Utilities",
      "Entertainment",
      "Health",
      "Shopping",
      "Other",
    ] as const;

    const category =
      allowedCategories.find((c) => c === rawCategory) ?? "Other";

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description: description.trim(),
        category,
        amount: Number(numericAmount.toFixed(2)),
        date: now,
      })
      .select("id, description, category, amount, date")
      .single();

    if (error) {
      console.error("API add-expense insert error", error);
      return NextResponse.json({ error: "Failed to insert expense" }, { status: 500 });
    }

    return NextResponse.json({ expense: data }, { status: 201 });
  } catch (e) {
    console.error("API add-expense unexpected error", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

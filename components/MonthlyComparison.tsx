import { useMemo } from "react";

// Redefine locally to avoid circular dependency or import issues if page.tsx is complex
type Transaction = {
    amount: number;
    date: string;
};

type Props = {
    transactions: Transaction[];
};

export function MonthlyComparison({ transactions }: Props) {
    // 1. Aggregate data by month
    const monthlyData = useMemo(() => {
        const map = new Map<string, number>();

        transactions.forEach((tx) => {
            const date = new Date(tx.date);
            // Key format: YYYY-MM
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const current = map.get(key) || 0;
            map.set(key, current + tx.amount);
        });

        // Convert to array and sort by date (ascending)
        return Array.from(map.entries())
            .map(([key, amount]) => ({ key, amount }))
            .sort((a, b) => a.key.localeCompare(b.key));
    }, [transactions]);

    // 2. Find max value for scaling
    const maxAmount = useMemo(() => {
        return Math.max(...monthlyData.map((d) => d.amount), 1); // Avoid div by 0
    }, [monthlyData]);

    const formatMonth = (key: string) => {
        const [year, month] = key.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    };

    if (monthlyData.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 text-sm">
                No transaction data available yet.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Monthly Spending</h3>

            <div className="space-y-4">
                {monthlyData.map((item) => {
                    const percentage = Math.round((item.amount / maxAmount) * 100);

                    return (
                        <div key={item.key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-700">{formatMonth(item.key)}</span>
                                <span className="font-semibold text-slate-900">£{item.amount.toFixed(2)}</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

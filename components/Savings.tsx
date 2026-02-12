import { useEffect, useState, useMemo } from "react";

// Redefine locally
type Transaction = {
    amount: number;
    date: string;
};

type Props = {
    transactions: Transaction[];
};

type SavingsSettings = {
    monthlyIncome: number;
    monthlyGoal: number;
};

export function Savings({ transactions }: Props) {
    const [settings, setSettings] = useState<SavingsSettings>({
        monthlyIncome: 0,
        monthlyGoal: 0,
    });
    const [isEditing, setIsEditing] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("savings_settings");
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse savings settings", e);
            }
        }
    }, []);

    // Save settings
    const saveSettings = (newSettings: SavingsSettings) => {
        setSettings(newSettings);
        localStorage.setItem("savings_settings", JSON.stringify(newSettings));
    };

    const monthlyData = useMemo(() => {
        const map = new Map<string, number>();
        // Only consider current year for simplicity as requested "start with january"
        const currentYear = new Date().getFullYear();

        transactions.forEach((tx) => {
            const date = new Date(tx.date);
            if (date.getFullYear() !== currentYear) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const current = map.get(key) || 0;
            map.set(key, current + tx.amount);
        });

        // Generate keys for all months up to current month (or all year?)
        // Let's do Jan to Current Month
        const now = new Date();
        const months = [];
        for (let i = 0; i <= now.getMonth(); i++) {
            const key = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
            const expenses = map.get(key) || 0;
            const reality = settings.monthlyIncome - expenses;
            months.push({
                key,
                expenses,
                reality,
                goal: settings.monthlyGoal,
                isGoalMet: reality >= settings.monthlyGoal
            });
        }
        return months;
    }, [transactions, settings]);

    const formatMonth = (key: string) => {
        const [year, month] = key.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString(undefined, { month: "short" });
    };

    if (isEditing) {
        return (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900">Savings Settings</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Monthly Income Estimate</label>
                        <input
                            type="number"
                            value={settings.monthlyIncome}
                            onChange={(e) => setSettings(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                            className="w-full text-sm p-2 border border-slate-200 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Monthly Savings Goal</label>
                        <input
                            type="number"
                            value={settings.monthlyGoal}
                            onChange={(e) => setSettings(prev => ({ ...prev, monthlyGoal: Number(e.target.value) }))}
                            className="w-full text-sm p-2 border border-slate-200 rounded"
                        />
                    </div>
                    <button
                        onClick={() => {
                            saveSettings(settings); // Persist
                            setIsEditing(false);
                        }}
                        className="w-full bg-indigo-600 text-white text-sm py-2 rounded font-medium"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        );
    }

    if (settings.monthlyIncome === 0 && settings.monthlyGoal === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-4">Set up your income and goals to track savings.</p>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 font-medium text-sm hover:underline"
                >
                    Setup Savings Tracking
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">Savings Reality</h3>
                <button onClick={() => setIsEditing(true)} className="text-xs text-indigo-600 font-medium">Edit Goals</button>
            </div>

            <div className="space-y-6">
                {monthlyData.map((item) => (
                    <div key={item.key} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="font-medium text-slate-700 w-12">{formatMonth(item.key)}</span>
                            <div className="text-right">
                                <span className={`font-semibold ${item.isGoalMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    £{item.reality.toFixed(2)}
                                </span>
                                <span className="text-xs text-slate-400 ml-2">
                                    / £{item.goal.toFixed(0)} Goal
                                </span>
                            </div>
                        </div>

                        {/* Bi-directional bar chart? Or simple progress */}
                        {/* Since reality can be negative, standard progress bar is tricky. */}
                        {/* Let's visualization Goal vs Reality as two stacked bars or comparison lines */}

                        <div className="relative h-6 bg-slate-100 rounded overflow-hidden flex">
                            {/* Reality Bar */}
                            {item.reality > 0 && (
                                <div
                                    className={`h-full ${item.isGoalMet ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                    style={{ width: `${Math.min((item.reality / (Math.max(item.reality, item.goal) * 1.2)) * 100, 100)}%` }}
                                >
                                </div>
                            )}

                            {/* Marker for Goal */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-900 opacity-30"
                                style={{ left: `${Math.min((item.goal / (Math.max(item.reality, item.goal) * 1.2)) * 100, 100)}%` }}
                            />
                        </div>
                        {item.reality < 0 && (
                            <p className="text-[10px] text-red-500 text-right">Overspent by £{Math.abs(item.reality).toFixed(0)}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

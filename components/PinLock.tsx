"use client";

import { useState, useEffect } from "react";
import { Lock, Fingerprint } from "lucide-react";
import {
    authenticateWithBiometric,
    isBiometricEnabled,
    isBiometricRegistered,
    isPlatformAuthenticatorAvailable,
} from "@/lib/biometrics";

const CORRECT_PIN = "125890";

type Props = {
    onUnlock: () => void;
};

export function PinLock({ onUnlock }: Props) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [showBiometric, setShowBiometric] = useState(false);

    useEffect(() => {
        // Check if biometric is supported and available
        const checkBiometric = async () => {
            const available = await isPlatformAuthenticatorAvailable();
            const registered = isBiometricRegistered();
            const enabled = isBiometricEnabled();

            console.log("Biometric status:", { available, registered, enabled });

            if (available && registered) {
                setShowBiometric(true);
                // Auto-attempt if enabled
                if (enabled) {
                    handleBiometricUnlock();
                }
            }
        };

        void checkBiometric();
    }, []);

    const handleBiometricUnlock = async () => {
        try {
            const success = await authenticateWithBiometric();
            if (success) {
                onUnlock();
            }
        } catch (err) {
            console.error("Biometric unlock failed", err);
        }
    };

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);

            // Auto-submit when 6 digits entered
            if (newPin.length === 6) {
                setTimeout(() => handleSubmit(newPin), 100);
            }
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const handleSubmit = (pinToCheck: string = pin) => {
        if (pinToCheck === CORRECT_PIN) {
            onUnlock();
        } else {
            setError(true);
            setPin("");
            setTimeout(() => setError(false), 1000);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="w-full max-w-sm px-6">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                        Enter PIN
                    </h1>
                    <p className="text-sm text-slate-600">
                        Enter your 6-digit PIN to unlock
                    </p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-3 mb-8">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`h-3 w-3 rounded-full transition-all duration-200 ${i < pin.length
                                ? error
                                    ? "bg-red-500 scale-110"
                                    : "bg-slate-900"
                                : "bg-slate-300"
                                }`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-16 rounded-2xl bg-white text-slate-900 text-xl font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all duration-150"
                            type="button"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleBackspace}
                        className="h-16 rounded-2xl bg-white text-slate-600 text-sm font-medium shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all duration-150"
                        type="button"
                    >
                        ← Delete
                    </button>
                    <button
                        onClick={() => handleNumberClick("0")}
                        className="h-16 rounded-2xl bg-white text-slate-900 text-xl font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all duration-150"
                        type="button"
                    >
                        0
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={pin.length !== 6}
                        className="h-16 rounded-2xl bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-slate-800 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                        type="button"
                    >
                        Enter
                    </button>
                </div>

                {error && (
                    <p className="text-center text-sm text-red-500 animate-pulse">
                        Incorrect PIN. Try again.
                    </p>
                )}

                {showBiometric && (
                    <div className="mt-8 text-center animate-fade-in">
                        <button
                            onClick={() => void handleBiometricUnlock()}
                            className="inline-flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <div className="p-3 rounded-full bg-slate-200/50">
                                <Fingerprint className="h-8 w-8" />
                            </div>
                            <span className="text-xs font-medium">Use Face ID / Touch ID</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

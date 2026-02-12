"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Fingerprint, Download, ChevronRight, Bell, Smartphone, Shield, Database, Trash2 } from "lucide-react";
import {
    isBiometricAvailable,
    isBiometricEnabled,
    isBiometricRegistered,
    registerBiometric,
    setBiometricEnabled,
    removeBiometricCredential,
} from "@/lib/biometrics";
import {
    getNotificationPermission,
    requestNotificationPermission,
    scheduleDailyNotifications,
    getNotificationSettings,
    updateNotificationSettings,
    NotificationSettings as NotificationConfig,
} from "@/lib/notifications";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    transactions: any[];
    onReset: () => void;
};

export function Settings({ isOpen, onClose, transactions, onReset }: Props) {
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricActive, setBiometricActive] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
        summaryEnabled: true,
        summaryTime: "21:00",
        reminderEnabled: true,
        reminderTime: "20:00",
    });

    useEffect(() => {
        if (isOpen) {
            checkSettings();
        }
    }, [isOpen]);

    const checkSettings = async () => {
        setBiometricAvailable(isBiometricAvailable());
        setBiometricActive(isBiometricEnabled() && isBiometricRegistered());

        const permission = getNotificationPermission();
        setNotificationsEnabled(permission === "granted");

        const config = getNotificationSettings();
        setNotificationConfig(config);
    };

    const handleBiometricToggle = async () => {
        if (biometricActive) {
            setBiometricEnabled(false);
            setBiometricActive(false);
        } else {
            const registered = isBiometricRegistered();
            if (!registered) {
                const credential = await registerBiometric();
                if (credential) {
                    setBiometricEnabled(true);
                    setBiometricActive(true);
                } else {
                    alert("Failed to register biometric. Please try again.");
                }
            } else {
                setBiometricEnabled(true);
                setBiometricActive(true);
            }
        }
    };

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            const granted = await requestNotificationPermission();
            if (granted) {
                setNotificationsEnabled(true);
                scheduleDailyNotifications();
            }
        } else {
            // Cannot revoke permission programmatically, direct user to settings
            alert("To disable notifications, please go to your browser settings.");
        }
    };

    const updateConfig = (key: keyof NotificationConfig, value: any) => {
        const newConfig = { ...notificationConfig, [key]: value };
        setNotificationConfig(newConfig);
        updateNotificationSettings(newConfig);

        if (notificationsEnabled) {
            scheduleDailyNotifications();
        }
    };

    const handleExport = () => {
        const data = JSON.stringify(transactions, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `budget-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (confirm("Are you sure? This will clear all local settings and lock preferences. Your data in Supabase will remain safe.")) {
            localStorage.clear();
            onReset();
            onClose();
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center pointer-events-auto"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col z-10 m-4 animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Notifications */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Bell className="h-5 w-5 text-indigo-500" />
                            <h3 className="font-medium text-slate-900">Notifications</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Enable Notifications</p>
                                    <p className="text-xs text-slate-500">Allow push notifications</p>
                                </div>
                                <button
                                    onClick={handleNotificationToggle}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {notificationsEnabled && (
                                <div className="pl-4 border-l-2 border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-slate-700">Daily Summary</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={notificationConfig.summaryTime}
                                                onChange={(e) => updateConfig('summaryTime', e.target.value)}
                                                className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1"
                                            />
                                            <input
                                                type="checkbox"
                                                checked={notificationConfig.summaryEnabled}
                                                onChange={(e) => updateConfig('summaryEnabled', e.target.checked)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-slate-700">Expense Reminder</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={notificationConfig.reminderTime}
                                                onChange={(e) => updateConfig('reminderTime', e.target.value)}
                                                className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1"
                                            />
                                            <input
                                                type="checkbox"
                                                checked={notificationConfig.reminderEnabled}
                                                onChange={(e) => updateConfig('reminderEnabled', e.target.checked)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Security */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            <h3 className="font-medium text-slate-900">Security</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Biometric Unlock</p>
                                    <p className="text-xs text-slate-500">Use Face ID / Touch ID</p>
                                </div>
                                {biometricAvailable ? (
                                    <button
                                        onClick={handleBiometricToggle}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${biometricActive ? 'bg-emerald-500' : 'bg-slate-200'
                                            }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${biometricActive ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-400">Not available</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Data */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium text-slate-900">Data</h3>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleExport}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Download className="h-4 w-4 text-slate-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Export Data</p>
                                        <p className="text-xs text-slate-500">Download JSON backup</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            </button>

                            <button
                                onClick={handleReset}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    <div>
                                        <p className="text-sm font-medium text-red-600">Reset App</p>
                                        <p className="text-xs text-red-400 group-hover:text-red-500">Clear local settings</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-red-300 group-hover:text-red-400" />
                            </button>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">Budget App v1.2</p>
                </div>

            </div>
        </div>,
        document.body
    );
}

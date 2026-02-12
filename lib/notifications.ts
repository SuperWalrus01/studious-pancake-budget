// Notification utilities for PWA
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
    if (!isNotificationSupported()) return 'denied';
    return Notification.permission;
}

export interface NotificationSettings {
    summaryEnabled: boolean;
    summaryTime: string; // HH:MM
    reminderEnabled: boolean;
    reminderTime: string; // HH:MM
}

const DEFAULT_SETTINGS: NotificationSettings = {
    summaryEnabled: true,
    summaryTime: "21:00",
    reminderEnabled: true,
    reminderTime: "20:00",
};

export function getNotificationSettings(): NotificationSettings {
    try {
        const stored = localStorage.getItem("notificationSettings");
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Error loading notification settings", e);
    }
    return DEFAULT_SETTINGS;
}

export function updateNotificationSettings(settings: NotificationSettings) {
    localStorage.setItem("notificationSettings", JSON.stringify(settings));
}

// Schedule daily notifications using local scheduling
export function scheduleDailyNotifications() {
    if (!isNotificationSupported() || Notification.permission !== "granted") {
        return;
    }

    const settings = getNotificationSettings();

    // Clear any existing timeouts (if we stored IDs, but for this simple implementation 
    // we'll mainly rely on re-running this function to set new schedules. 
    // A robust system would need to clear old intervals).
    // basic implementation: just Schedule based on current settings.

    if (settings.summaryEnabled) {
        scheduleNotification(
            settings.summaryTime,
            showDailySummaryNotification,
            "summary"
        );
    }

    if (settings.reminderEnabled) {
        scheduleNotification(
            settings.reminderTime,
            showExpenseReminderNotification,
            "reminder"
        );
    }

    console.log("Daily notifications scheduled based on settings", settings);
}

function scheduleNotification(timeParams: string, callback: () => void, id: string) {
    const [hours, minutes] = timeParams.split(":").map(Number);
    const now = new Date();

    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);

    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime.getTime() - now.getTime();

    // clear specific timeout if we were tracking it
    // window.clearTimeout(timeoutId[id]);

    setTimeout(() => {
        callback();
        // Reschedule for tomorrow
        setInterval(callback, 24 * 60 * 60 * 1000);
    }, delay);
}

async function showDailySummaryNotification() {
    try {
        // Get today's total from localStorage or API
        const todayTotal = await getTodaysTotalSpending();

        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('💰 Daily Spending Summary', {
            body: `Total spent today: £${todayTotal.toFixed(2)}`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'daily-summary',
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: '/',
        } as any);
    } catch (error) {
        console.error('Failed to show daily summary notification:', error);
    }
}

async function showExpenseReminderNotification() {
    try {
        // Check if any expenses were logged today
        const expensesLogged = await checkExpensesLoggedToday();

        if (!expensesLogged) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('📝 Expense Reminder', {
                body: "Don't forget to log your expenses for today!",
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'expense-reminder',
                requireInteraction: false,
                vibrate: [200, 100, 200],
                data: '/',
            } as any);
        }
    } catch (error) {
        console.error('Failed to show expense reminder notification:', error);
    }
}

async function getTodaysTotalSpending(): Promise<number> {
    try {
        // Try to get from current state or localStorage
        const stored = localStorage.getItem('todaySpending');
        if (stored) {
            const data = JSON.parse(stored);
            const today = new Date().toISOString().split('T')[0];
            if (data.date === today) {
                return data.total;
            }
        }
    } catch (error) {
        console.error('Error getting today\'s spending:', error);
    }
    return 0;
}

async function checkExpensesLoggedToday(): Promise<boolean> {
    try {
        const stored = localStorage.getItem('lastExpenseDate');
        if (stored) {
            const lastDate = new Date(stored);
            const today = new Date();
            return lastDate.toDateString() === today.toDateString();
        }
    } catch (error) {
        console.error('Error checking expenses:', error);
    }
    return false;
}

// Store today's spending in localStorage for notification access
export function updateTodaySpending(total: number) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('todaySpending', JSON.stringify({ date: today, total }));
}

// Store last expense date for reminder
export function updateLastExpenseDate() {
    localStorage.setItem('lastExpenseDate', new Date().toISOString());
}

// Send an immediate test notification
export async function sendTestNotification() {
    if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('🎉 Test Notification', {
            body: 'Notifications are working! You\'ll receive daily updates.',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'test',
            requireInteraction: false,
        });
    } catch (error) {
        console.error('Failed to send test notification:', error);
    }
}

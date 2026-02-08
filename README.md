# 💰 Budget

A minimal, mobile-first budgeting Progressive Web App built with Next.js (App Router), Tailwind CSS, and Lucide React. Data is stored locally in `localStorage`.

## Development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the project from GitHub.
3. Use the default Next.js build settings (`npm run build`).
4. Once deployed, open the URL in Safari on your iPhone.
5. Tap the Share icon and choose **Add to Home Screen**.

The app is configured as a PWA (`display: "standalone"`) with iOS meta tags for an app-like experience. The app name and manifest use the 💰 emoji so it appears in the app name on your home screen.

## Using an Apple Shortcut to add an expense

You can use an iOS Shortcut to add an expense by opening a special URL that encodes the expense details as query parameters.

Base URL (replace with your deployed URL):

`https://your-deployed-url.vercel.app/?addExpense=1&description=Coffee&amount=4.50&category=Food`

Supported query parameters:

- `addExpense=1` or `shortcutAdd=1` – enables shortcut add mode.
- `description` or `desc` – text description of the expense.
- `amount` or `price` – numeric amount (e.g. `4.5` or `4,5`).
- `category` or `cat` – one of: `Food`, `Transport`, `Housing`, `Utilities`, `Entertainment`, `Health`, `Shopping`, `Other`.

When the app opens with these parameters, it will automatically add the expense to local storage, switch to the dashboard tab, and scroll to the Add Expense section.

In the Shortcuts app:

1. Create a new Shortcut.
2. Add an **Open URL** action.
3. Build the URL using your deployed base URL and the parameters above (you can use Shortcut variables to fill `description`, `amount`, and `category`).
4. Run the Shortcut to add expenses quickly from anywhere on your iPhone.

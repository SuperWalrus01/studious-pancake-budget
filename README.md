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

There are two ways to integrate with Apple Shortcuts:

1. **Foreground** – open the PWA and let it add the expense via query params (shows UI).
2. **Background** – call a backend API endpoint that writes directly to Supabase (no UI).

### Background mode (recommended)

Use the API endpoint:

`POST https://YOUR-DEPLOYED-URL.vercel.app/api/add-expense`

Body (JSON):

```json
{
	"description": "Coffee",
	"amount": "4.50",
	"category": "Food"
}
```

Supported JSON fields (all strings):

- `description` or `desc`
- `amount` or `price` (e.g. `4.5` or `4,5`)
- `category` or `cat` – one of: `Food`, `Transport`, `Housing`, `Utilities`, `Entertainment`, `Health`, `Shopping`, `Other`.

In the Shortcuts app:

1. Create a new Shortcut.
2. Add an **Ask for Input** for description.
3. Add an **Ask for Input** (Number) for amount.
4. (Optional) Add a **Choose from List** for category names and map them to the category values above.
5. Add a **Get Contents of URL** action:
	 - URL: `https://YOUR-DEPLOYED-URL.vercel.app/api/add-expense`
	 - Method: `POST`
	 - Request Body: **JSON** with keys `description`, `amount`, `category` bound to your Shortcut variables.
	 - Turn **Show When Run** off for fully background behavior.

When this runs, the Shortcut sends a background HTTP POST to the app, which writes the expense into Supabase without opening the browser.

### Foreground mode (opens the PWA)

You can still use the query-param approach if you want to see the app UI:

`https://YOUR-DEPLOYED-URL.vercel.app/?addExpense=1&description=Coffee&amount=4.50&category=Food`

The same parameter names as above are supported.

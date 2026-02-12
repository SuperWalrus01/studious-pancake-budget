# API Documentation: Add Expense Endpoint

## Endpoint

```
POST /api/add-expense
```

## Description

Adds a new expense transaction to your budget app. This endpoint accepts JSON data and stores it in the Supabase database.

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parameter | Aliases | Type | Required | Default | Description |
|-----------|---------|------|----------|---------|-------------|
| `description` | `desc` | string | ✅ Yes | - | Description of the expense |
| `amount` | `price` | number/string | ✅ Yes | - | Amount spent (accepts decimals, commas are converted to periods) |
| `category` | `cat` | string | ❌ No | `"Other"` | Category of the expense |

### Valid Categories

- `Groceries`
- `Food`
- `Transport`
- `Household`
- `Sport`
- `Fun / Go out`
- `Clothes`
- `Tech / Hobby`
- `Other` (default if not specified or invalid)

## Examples

### Minimal Request (Description + Amount Only)

```json
{
  "description": "Coffee",
  "amount": "4.50"
}
```

Or using aliases:

```json
{
  "desc": "Coffee",
  "price": "4.50"
}
```

### Full Request (With Category)

```json
{
  "description": "Groceries at Tesco",
  "amount": "45.99",
  "category": "Groceries"
}
```

### Using Aliases

```json
{
  "desc": "Uber ride",
  "price": "12,50",
  "cat": "Transport"
}
```

## Response

### Success (201 Created)

```json
{
  "expense": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "description": "Coffee",
    "category": "Other",
    "amount": 4.50,
    "date": "2026-02-11T23:24:58.123Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Input

```json
{
  "error": "Invalid description or amount"
}
```

**Causes:**
- Empty or missing description
- Invalid amount (not a number, zero, or negative)

#### 500 Internal Server Error

```json
{
  "error": "Failed to insert expense"
}
```

or

```json
{
  "error": "Unexpected error"
}
```

## cURL Examples

### With description and amount only:

```bash
curl -X POST http://localhost:3000/api/add-expense \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Coffee",
    "amount": "4.50"
  }'
```

### With category:

```bash
curl -X POST http://localhost:3000/api/add-expense \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Lunch",
    "amount": "12.99",
    "category": "Food"
  }'
```

## Apple Shortcuts Integration

This endpoint is designed to work seamlessly with Apple Shortcuts:

1. **Get Contents of URL** action
2. Method: `POST`
3. Request Body: `JSON`
4. Add dictionary with keys:
   - `description`: Ask for Input (text)
   - `amount`: Ask for Input (number)
   - `category`: (Optional) Choose from List or hardcode

Turn off "Show When Run" for background operation.

## Notes

- ✅ Category is **optional** - if omitted or invalid, it defaults to `"Other"`
- ✅ Amount can use commas or periods as decimal separators (e.g., `"4,50"` or `"4.50"`)
- ✅ Works with both full parameter names and aliases (`desc`/`description`, `price`/`amount`, `cat`/`category`)
- ✅ The endpoint automatically timestamps each expense with the current date/time
- ✅ Perfect for automation via Apple Shortcuts, Zapier, or other webhook integrations

---

## Apple Shortcuts Integration Guide

This section provides step-by-step instructions for creating an Apple Shortcut to add expenses to your budget app directly from your iPhone.

### Quick Setup

1. **Open the Shortcuts app** on your iPhone
2. **Tap the + button** to create a new shortcut
3. **Add actions** as described below
4. **Save and run** your shortcut

### Detailed Setup Instructions

#### Step 1: Ask for Expense Description

1. Search for and add the **"Ask for Input"** action
2. Configure:
   - Prompt: `What did you buy?`
   - Input Type: `Text`
   - Default Answer: (leave empty)

#### Step 2: Ask for Amount

1. Add another **"Ask for Input"** action
2. Configure:
   - Prompt: `How much did it cost?`
   - Input Type: `Number`
   - Default Answer: (leave empty)

#### Step 3: (Optional) Choose Category

1. Add a **"Choose from List"** action
2. Configure the list with these options:
   - Groceries
   - Food
   - Transport
   - Household
   - Sport
   - Fun / Go out
   - Clothes
   - Tech / Hobby
   - Other
3. Set the prompt: `Select category`

#### Step 4: Send HTTP Request

1. Search for and add the **"Get Contents of URL"** action
2. Configure the following settings:

**URL:**
```
https://your-deployed-url.vercel.app/api/add-expense
```
(Replace with your actual deployment URL, or use `http://localhost:3000/api/add-expense` for local testing)

**Method:** `POST`

**Request Body:** `JSON`

**Add the following JSON fields:**
```json
{
  "description": [Provided Input from Step 1],
  "amount": [Provided Input from Step 2],
  "category": [Chosen Item from Step 3]
}
```

**Headers:**
- `Content-Type`: `application/json`

**Advanced Options:**
- Turn OFF "Show When Run" for silent background operation

### Example: Minimal Shortcut (No Category)

If you don't want to select a category each time (it will default to "Other"):

1. **Ask for Input:** Description
2. **Ask for Input:** Amount (Number)
3. **Get Contents of URL:**
   - Method: POST
   - Body: JSON
   ```json
   {
     "description": [Step 1 Input],
     "amount": [Step 2 Input]
   }
   ```

### Tips & Tricks

#### Quick Add Widget

1. Add your shortcut to your home screen as a widget
2. Long press the shortcut and select "Add to Home Screen"
3. Tap the widget to instantly add an expense

#### Siri Integration

1. Give your shortcut a memorable name (e.g., "Add Expense")
2. Say to Siri: "Hey Siri, Add Expense"
3. Siri will prompt you for the description and amount

#### Background Execution

To make the shortcut run completely in the background:
- Turn OFF "Show When Run" in the Get Contents of URL action
- The expense will be added silently without showing the browser

#### Multiple Shortcuts for Common Categories

Create separate shortcuts for frequent categories:
- "Add Groceries" - hardcode category as "Groceries"
- "Add Transport" - hardcode category as "Transport"
- This eliminates the category selection step

Example for "Add Groceries":
```json
{
  "description": [Input],
  "amount": [Input],
  "category": "Groceries"
}
```

### Troubleshooting

**Shortcut fails with error:**
- Check that your app is deployed and accessible
- Verify the URL is correct
- Ensure you're connected to the internet

**Expense doesn't appear:**
- Refresh the app (pull down or tap the refresh button)
- Check the Recent transactions list
- Verify the API returned success (enable "Show When Run" temporarily)

**Category shows as "Other":**
- Make sure the category name exactly matches one from the allowed list
- Check for typos or extra spaces
- Categories are case-sensitive

### Testing Your Shortcut

Before relying on your shortcut:

1. Run it once with test data
2. Check that the expense appears in your app
3. Verify the category is correct
4. Test the background execution

### Privacy & Security

> [!NOTE]
> The API endpoint is publicly accessible without authentication. If deploying to production, consider adding an API key or authentication token to prevent unauthorized access.

---

## Related Resources

- [Shortcuts User Guide](https://support.apple.com/guide/shortcuts/welcome/ios)
- [Vercel Deployment Guide](https://vercel.com/docs)


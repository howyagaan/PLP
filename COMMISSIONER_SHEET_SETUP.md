# Commissioner Google Sheet Setup

Sheet:
https://docs.google.com/spreadsheets/d/1gKulkcIi19FEWboYHuDJ754AB-gB9D5AOgDCXmwMIAA/edit

## Connect Website Submissions

1. Open the Google Sheet.
2. Go to Extensions > Apps Script.
3. Replace the starter code with the contents of `google-sheet-webhook.gs`.
4. Click Deploy > New deployment.
5. Choose Web app.
6. Set "Execute as" to Me.
7. Set "Who has access" to Anyone.
8. Deploy, then copy the Web app URL.
9. Paste that URL into `signup.html`:

```js
const GOOGLE_SHEET_WEBHOOK_URL = "PASTE_WEB_APP_URL_HERE";
```

After that, each locked prediction will append to:

- `Entries`: one row per manager, with all 20 picks across columns.
- `Picks`: one row per predicted team, easier for filtering and checks.

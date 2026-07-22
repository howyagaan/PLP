const SPREADSHEET_ID = "1gKulkcIi19FEWboYHuDJ754AB-gB9D5AOgDCXmwMIAA";
const ENTRIES_SHEET = "Entries";
const PICKS_SHEET = "Picks";
const COMMISSIONER_EMAIL = "howyagaan@gmail.com";
const COMMISSIONER_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

function doGet(e) {
  const callback = clean(e.parameter.callback) || "plpReceiveSheetEntries";
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const entriesSheet = spreadsheet.getSheetByName(ENTRIES_SHEET);
  const values = entriesSheet.getDataRange().getValues();
  const rows = values.slice(1);

  const entries = rows
    .filter((row) => clean(row[1]) && clean(row[2]) && clean(row[3]))
    .map((row) => ({
      lockedAt: clean(row[0]),
      firstName: clean(row[1]),
      lastName: clean(row[2]),
      email: clean(row[3]).toLowerCase(),
      paid: row[5] === true || clean(row[5]).toLowerCase() === "true",
      picks: row.slice(6, 26).map(clean).filter(Boolean)
    }))
    .filter((entry) => entry.picks.length === 20);

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(entries)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const entry = JSON.parse(e.postData.contents || "{}");
    const firstName = clean(entry.firstName);
    const lastName = clean(entry.lastName);
    const email = clean(entry.email).toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const lockedAt = clean(entry.lockedAt) || new Date().toISOString();
    const picks = Array.isArray(entry.picks) ? entry.picks.map(clean) : [];

    if (!firstName || !lastName || !email || picks.length !== 20) {
      return jsonResponse({ ok: false, error: "Missing manager details or picks." });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const entriesSheet = spreadsheet.getSheetByName(ENTRIES_SHEET);
    const picksSheet = spreadsheet.getSheetByName(PICKS_SHEET);

    if (emailAlreadyExists(entriesSheet, email)) {
      return jsonResponse({ ok: false, error: "This email already submitted." });
    }

    entriesSheet.appendRow([
      lockedAt,
      firstName,
      lastName,
      email,
      fullName,
      false,
      ...picks
    ]);

    picks.forEach((team, index) => {
      picksSheet.appendRow([lockedAt, email, fullName, index + 1, team]);
    });

    try {
      notifyCommissioner({
        fullName,
        firstName,
        lastName,
        email,
        lockedAt,
        picks
      });
    } catch (error) {
      console.error(`Entry saved, but commissioner email failed: ${error}`);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function clean(value) {
  return String(value || "").trim();
}

function emailAlreadyExists(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  return sheet
    .getRange(2, 4, lastRow - 1, 1)
    .getValues()
    .flat()
    .some((value) => clean(value).toLowerCase() === email);
}

function notifyCommissioner(entry) {
  const recipient = clean(COMMISSIONER_EMAIL) || Session.getEffectiveUser().getEmail();
  if (!recipient) return;

  const picksList = entry.picks
    .map((team, index) => `${index + 1}. ${team}`)
    .join("\n");

  MailApp.sendEmail(
    recipient,
    `New PLP signup: ${entry.fullName}`,
    [
      "A new Premier League Predictions entry has been submitted.",
      "",
      `Manager: ${entry.fullName}`,
      `Email: ${entry.email}`,
      `Submitted: ${entry.lockedAt}`,
      `Sheet: ${COMMISSIONER_SHEET_URL}`,
      "",
      "Predicted table:",
      picksList
    ].join("\n")
  );
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

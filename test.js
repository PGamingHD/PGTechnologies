/*
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1H_CDTgFzHx0beK_--St5Q9-bbcly-WSUHil_VJtWi68',
    range: 'Config!A2:B',
  });

  const res2 = await sheets.spreadsheets.values.get({
    spreadsheetId: '1H_CDTgFzHx0beK_--St5Q9-bbcly-WSUHil_VJtWi68',
    range: 'Sheet15!A2:B',
  });

  const rows = res.data.values;
  const rows2 = res2.data.values;


  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }

  if (!rows2 || rows2.length === 0) {
    console.log('No data found.');
    return;
  }


  let BTCrate = null;
  rows.forEach((row) => {
    if (row[0] !== "btc") return;
    BTCrate = parseFloat(row[1])
  });

  rows2.forEach((row) => {
    if (row[0] === undefined || row[1] === undefined) return;
    console.log(((parseInt(row[1]) / 1000) * BTCrate).toFixed(2))
  })
}

authorize().then(listMajors()).catch(console.error);
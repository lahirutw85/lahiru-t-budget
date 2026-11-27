/* global process */
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json({ limit: '1mb' }));

// Google Sheets configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';

// Prevent Google Sheets formula injection on string cells
const sanitizeCell = (val) => {
  if (typeof val !== 'string') return val;
  return /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;
};

// Prepare auth
const getAuthClient = () => {
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is not configured in .env file.');
  }
  // If credential placeholders are present, throw an error
  if (!process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL.includes('your-service-account') || !process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY')) {
    throw new Error('Google Sheets API credentials are not configured in .env file.');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
};

// API Endpoint to fetch all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Expenses!A2:G1000', // Skip headers row A1:G1
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    const expenses = rows.map((row, idx) => ({
      id: row[0] || `gs-${idx}-${Date.now()}`,
      date: row[1] || '',
      category: row[2] || '',
      subCategory: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      account: row[5] || 'Cash',
      notes: row[6] || ''
    }));

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// API Endpoint to save/sync all expenses
app.post('/api/expenses', async (req, res) => {
  try {
    const { expenses } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Expenses must be an array' });
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Format data rows
    const headerRow = ['ID', 'Date', 'Category', 'SubCategory', 'Amount', 'Account', 'Notes'];
    const dataRows = expenses.map(e => [
      sanitizeCell(e.id),
      sanitizeCell(e.date || ''),
      sanitizeCell(e.category || ''),
      sanitizeCell(e.subCategory || ''),
      Number(e.amount) || 0,
      sanitizeCell(e.account || 'Cash'),
      sanitizeCell(e.notes || '')
    ]);

    const values = [headerRow, ...dataRows];

    // Clear the existing sheet contents
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Expenses!A1:G1000',
    });

    // Write new values
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Expenses!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    res.json({ message: 'Expenses synced successfully', data: response.data });
  } catch (error) {
    console.error('Error syncing transactions to Google Sheets:', error.message);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

// API Endpoint to fetch all incomes
app.get('/api/incomes', async (req, res) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Incomes!A2:G1000', // Skip headers row A1:G1
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    const incomes = rows.map((row, idx) => ({
      id: row[0] || `gs-${idx}-${Date.now()}`,
      date: row[1] || '',
      category: row[2] || '',
      subCategory: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      account: row[5] || 'Cash',
      notes: row[6] || ''
    }));

    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes from Google Sheets:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// API Endpoint to save/sync all incomes
app.post('/api/incomes', async (req, res) => {
  try {
    const { incomes } = req.body;
    if (!Array.isArray(incomes)) {
      return res.status(400).json({ error: 'Incomes must be an array' });
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Format data rows
    const headerRow = ['ID', 'Date', 'Category', 'SubCategory', 'Amount', 'Account', 'Notes'];
    const dataRows = incomes.map(i => [
      sanitizeCell(i.id),
      sanitizeCell(i.date || ''),
      sanitizeCell(i.category || ''),
      sanitizeCell(i.subCategory || ''),
      Number(i.amount) || 0,
      sanitizeCell(i.account || 'Cash'),
      sanitizeCell(i.notes || '')
    ]);

    const values = [headerRow, ...dataRows];

    // Clear the existing sheet contents
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Incomes!A1:G1000',
    });

    // Write new values
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Incomes!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    res.json({ message: 'Incomes synced successfully', data: response.data });
  } catch (error) {
    console.error('Error syncing incomes to Google Sheets:', error.message);
    res.status(500).json({ error: 'Failed to sync incomes' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

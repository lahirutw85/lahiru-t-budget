# Budget Master 💰

A modern, responsive financial dashboard built with React and Tailwind CSS, featuring seamless backend integration with Google Sheets for tracking income, expenses, and savings.

## 🌟 Features

* **Professional Themes:** Switch instantly between a sleek Dark Theme and a clean Light Theme.
* **Google Sheets Integration:** Built-in Express backend configured to sync data directly to and from a Google Sheet.
* **Dynamic Time Tracking:** 
  * Automatically loads the current month and year on startup.
  * Easily add new tracking years (automatically provisions 12 months).
  * Safely delete obsolete tracking years.
* **Interactive Dashboard:**
  * Sidebar navigation with active state highlights.
  * Financial overview cards (Total Income, Total Expenses, Net Savings).
  * Interactive "Budget vs Actual" detailed views.
  * Progress bars for monthly comparison.

## 🛠️ Technology Stack

* **Frontend:** React, Tailwind CSS, Lucide React (Icons), Recharts (Data Visualization)
* **Backend:** Node.js, Express.js
* **Database:** Google Sheets API
* **Build Tool:** Vite

## 🚀 Getting Started

### Prerequisites
* Node.js installed on your machine.
* A Google Cloud Service Account with access to your target Google Sheet.

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and add your Google Service Account credentials:
```env
GOOGLE_CLIENT_EMAIL="your-service-account-email@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
```

### 3. Running the App
The project is configured to run both the React frontend and the Express backend concurrently.
```bash
npm start
```
* **Frontend:** Runs on `http://localhost:5173`
* **Backend API:** Runs on `http://localhost:5000`

## 📁 Project Structure

* `/src/components/Dashboard.jsx` - The main UI component handling layout, themes, and logic.
* `/server.js` - The backend Express server interfacing with the Google Sheets API.
* `package.json` - Defines project dependencies and concurrent startup scripts.

---
*Designed to help you maintain exceptional financial health.*

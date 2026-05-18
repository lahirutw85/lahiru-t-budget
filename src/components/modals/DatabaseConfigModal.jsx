import React, { useState, useEffect } from 'react';
import { X, Check, Link, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export const DatabaseConfigModal = ({
  isDbConfigOpen,
  setIsDbConfigOpen
}) => {
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('budget_api_url') || 'http://localhost:5000/api';
  });
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isDbConfigOpen) {
      setApiUrl(localStorage.getItem('budget_api_url') || 'http://localhost:5000/api');
      setTestStatus('idle');
      setErrorMessage('');
    }
  }, [isDbConfigOpen]);

  if (!isDbConfigOpen) return null;

  const testConnection = async (urlToTest) => {
    setTestStatus('testing');
    setErrorMessage('');
    
    // Normalize URL: remove trailing slash
    let normalizedUrl = urlToTest.trim();
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }
    if (!normalizedUrl.endsWith('/api') && !normalizedUrl.includes('/api/')) {
      // If it doesn't end with /api, try adding it
      if (normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')) {
        normalizedUrl = normalizedUrl + '/api';
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(`${normalizedUrl}/expenses`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setTestStatus('success');
        localStorage.setItem('budget_api_url', normalizedUrl);
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err) {
      console.error('Database connection test failed:', err);
      setTestStatus('failed');
      if (err.name === 'AbortError') {
        setErrorMessage('Connection timed out. Ensure your server is running and accessible.');
      } else if (window.location.protocol === 'https:' && urlToTest.startsWith('http://') && !urlToTest.includes('localhost') && !urlToTest.includes('127.0.0.1')) {
        setErrorMessage('HTTPS Mixed Content Block! Browsers block insecure http requests from HTTPS sites. Use an https:// tunnel URL.');
      } else {
        setErrorMessage(err.message || 'Cannot reach the database server. Check server console or CORS settings.');
      }
    }
  };

  const handleSave = () => {
    let finalUrl = apiUrl.trim();
    if (finalUrl.endsWith('/')) {
      finalUrl = finalUrl.slice(0, -1);
    }
    localStorage.setItem('budget_api_url', finalUrl);
    setIsDbConfigOpen(false);
    // Reload page to re-initialize data fetchers with the new API URL
    window.location.reload();
  };

  const handleReset = () => {
    const defaultUrl = 'http://localhost:5000/api';
    setApiUrl(defaultUrl);
    setTestStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937] text-left">
        {/* Modal Header */}
        <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
          <button onClick={() => setIsDbConfigOpen(false)} className="hover:opacity-80 transition-opacity">
            <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
          </button>
          <h2 className="text-lg font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Database Server Connection</h2>
          <button 
            onClick={handleSave} 
            className="hover:opacity-80 transition-opacity"
            title="Save and Connect"
          >
            <Check className="w-7 h-7 text-[#4FD1F5] bg-gray-600 rounded-full p-1" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-600 leading-relaxed">
            Specify the API server endpoint connecting your budget app to the Google Sheets database.
          </p>

          {/* URL Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Server API Endpoint URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setTestStatus('idle');
                  setErrorMessage('');
                }}
                placeholder="e.g. https://xxxx.ngrok-free.app/api"
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-mono"
              />
              <button
                onClick={() => testConnection(apiUrl)}
                disabled={testStatus === 'testing'}
                className="px-3 py-2 text-sm font-bold text-white rounded bg-gray-600 hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                Test
              </button>
            </div>
          </div>

          {/* Status Display */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-lg border flex gap-2 text-xs font-semibold ${
              testStatus === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : testStatus === 'testing'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testStatus === 'success' && <Wifi className="w-4 h-4 shrink-0 text-green-600" />}
              {testStatus === 'failed' && <WifiOff className="w-4 h-4 shrink-0 text-red-600" />}
              {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-600" />}
              
              <div className="space-y-1">
                <span className="block font-bold">
                  {testStatus === 'success' && '🟢 Connection Succeeded! Saved.'}
                  {testStatus === 'testing' && '⏳ Connecting to Server...'}
                  {testStatus === 'failed' && '🔴 Connection Failed'}
                </span>
                {errorMessage && <p className="text-gray-600 font-medium">{errorMessage}</p>}
              </div>
            </div>
          )}

          {/* Setup Walkthrough */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Connecting from Live Website (GitHub)
            </h3>
            
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              When serving over secure HTTPS (GitHub Pages), browsers block direct HTTP localhost calls. Bypassing it requires a secure tunnel:
            </p>

            <div className="space-y-2">
              <div className="text-xs font-medium bg-white p-2 rounded border border-gray-200">
                <span className="block font-bold text-blue-600">Option 1: localtunnel (Easiest)</span>
                <p className="text-gray-500 mt-1">Open a terminal in your project directory and run:</p>
                <code className="block bg-gray-50 p-1 rounded font-mono text-[10px] mt-1 text-gray-700 select-all">
                  npx localtunnel --port 5000
                </code>
                <p className="text-[10px] text-gray-400 mt-1">Copy the <code className="font-mono">https://...</code> URL, paste it above, and click Test.</p>
              </div>

              <div className="text-xs font-medium bg-white p-2 rounded border border-gray-200">
                <span className="block font-bold text-sky-600">Option 2: ngrok Tunnel</span>
                <p className="text-gray-500 mt-1">Run in your command prompt:</p>
                <code className="block bg-gray-50 p-1 rounded font-mono text-[10px] mt-1 text-gray-700 select-all">
                  ngrok http 5000
                </code>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleReset}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
            >
              Reset to Default (Localhost)
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsDbConfigOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-white rounded hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: '#0284C7' }}
              >
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

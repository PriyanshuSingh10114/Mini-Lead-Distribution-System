"use client";

import { useState } from "react";

export default function TestToolsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const handleResetQuotas = async () => {
    setLoading(true);
    addLog("Sending Webhook: Reset Quotas...");
    try {
      const res = await fetch("/api/test/reset-quotas", { method: "POST" });
      const data = await res.json();
      addLog(`Response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleGenerateConcurrentLeads = async () => {
    setLoading(true);
    addLog("Generating 10 Concurrent Leads...");
    try {
      const res = await fetch("/api/test/generate-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10, concurrent: true }),
      });
      const data = await res.json();
      
      const successCount = data.results.filter((r: any) => r.status === 'fulfilled' && r.value.success).length;
      const failCount = data.results.length - successCount;

      addLog(`Completed. ${successCount} successful, ${failCount} failed.`);
      addLog(`Details: ${JSON.stringify(data.results.map((r: any) => r.value?.message || r.reason))}`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleGenerateSequentialLeads = async () => {
    setLoading(true);
    addLog("Generating 10 Sequential Leads...");
    try {
      const res = await fetch("/api/test/generate-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10, concurrent: false }),
      });
      const data = await res.json();
      
      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.length - successCount;

      addLog(`Completed. ${successCount} successful, ${failCount} failed.`);
      addLog(`Details: ${JSON.stringify(data.results.map((r: any) => r.message))}`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Testing Utilities</h1>
      <p className="text-gray-600">
        Use these tools to verify concurrency, webhooks, and round-robin allocation behavior.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleResetQuotas}
          disabled={loading}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center disabled:opacity-50"
        >
          <div className="font-semibold text-blue-600 mb-1">Reset Quotas (Webhook)</div>
          <div className="text-xs text-gray-500">Simulates subscription renewal event. Tests Idempotency.</div>
        </button>

        <button
          onClick={handleGenerateSequentialLeads}
          disabled={loading}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center disabled:opacity-50"
        >
          <div className="font-semibold text-purple-600 mb-1">Generate 10 Leads</div>
          <div className="text-xs text-gray-500">Submits 10 leads sequentially.</div>
        </button>

        <button
          onClick={handleGenerateConcurrentLeads}
          disabled={loading}
          className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center disabled:opacity-50"
        >
          <div className="font-semibold text-red-600 mb-1">Concurrent Stress Test</div>
          <div className="text-xs text-gray-500">Submits 10 leads via Promise.all(). Tests Transaction isolation.</div>
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg shadow-inner p-4 mt-8">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-gray-200 font-mono text-sm">Execution Logs</h2>
          <button onClick={handleClearLogs} className="text-gray-400 hover:text-white text-xs">Clear</button>
        </div>
        <div className="h-64 overflow-y-auto font-mono text-xs text-green-400 space-y-2">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">Waiting for events...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="break-words border-b border-gray-800 pb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

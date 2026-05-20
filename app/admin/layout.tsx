'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_secret');
    if (stored) {
      verifySecret(stored).then((valid) => {
        if (valid) {
          setAuthed(true);
          setSecret(stored);
        }
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
  }, []);

  async function verifySecret(s: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/nurture-dashboard', {
        headers: { Authorization: `Bearer ${s}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const valid = await verifySecret(secret);
    if (valid) {
      sessionStorage.setItem('admin_secret', secret);
      setAuthed(true);
    } else {
      setError('Invalid admin secret.');
    }
  }, [secret]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-lg border border-gray-800 w-full max-w-sm">
          <h1 className="text-xl font-bold text-white mb-4">Admin Access</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 mb-3"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-bold text-lg">LarkinTech Admin</span>
          <a href="/admin" className="text-gray-300 hover:text-white text-sm transition-colors">Dashboard</a>
          <a href="/admin/leads" className="text-gray-300 hover:text-white text-sm transition-colors">Leads</a>
          <a href="/admin/messages" className="text-gray-300 hover:text-white text-sm transition-colors">Messages</a>
          <a href="/admin/config" className="text-gray-300 hover:text-white text-sm transition-colors">Config</a>
          <a href="/admin/audit" className="text-gray-300 hover:text-white text-sm transition-colors">Audit</a>
          <button
            onClick={() => { sessionStorage.removeItem('admin_secret'); setAuthed(false); }}
            className="ml-auto text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
      <AdminContext.Provider value={secret}>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </AdminContext.Provider>
    </div>
  );
}

import { createContext, useContext } from 'react';

const AdminContext = createContext<string>('');

export function useAdminSecret(): string {
  return useContext(AdminContext);
}

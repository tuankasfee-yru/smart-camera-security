'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    document.cookie = `dashboard_auth=${password}; path=/; max-age=86400`;
    router.push('/');
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">🔐 Login</h1>
        <p className="mb-6 text-sm text-zinc-500">ใส่รหัสผ่านเพื่อเข้า Dashboard</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน"
          className="mb-4 w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          autoFocus
        />
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}

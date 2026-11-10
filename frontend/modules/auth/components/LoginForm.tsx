'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/shared/components/ui';
import { useAuthActions } from '../hooks';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, loading, error } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleLogin({ email, password });
      window.location.href = '/dashboard';
    } catch {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full mx-auto p-6 bg-white rounded-xl shadow-md border border-slate-100">
      <h2 className="text-xl font-bold text-center text-slate-900">Sign in to AqarFlow</h2>
      {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}
      <Input
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="agent@agency.com"
      />
      <Input
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
};

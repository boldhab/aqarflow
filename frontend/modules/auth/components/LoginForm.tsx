'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/shared/components/ui';
import { useAuth } from '@/shared/hooks';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const getSafeRedirectUrl = (redirect: string | null): string => {
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      const redirect = searchParams?.get('redirect') ?? null;
      const targetUrl = getSafeRedirectUrl(redirect);
      router.push(targetUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-sm w-full mx-auto p-6 bg-white rounded-xl shadow-md border border-slate-100"
    >
      <h2 className="text-xl font-bold text-center text-slate-900">Sign in to AqarFlow</h2>
      {error && (
        <div
          role="alert"
          className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200"
        >
          {error}
        </div>
      )}
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="agent@aqarflow.com"
        disabled={loading}
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        disabled={loading}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
};

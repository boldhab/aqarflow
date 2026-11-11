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
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-xl shadow-lg shadow-brand-500/20 mb-2">
          A
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to AqarFlow
        </h1>
        <p className="text-sm text-slate-500">
          Enter your agency credentials to access the workspace
        </p>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-8 space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="p-3.5 text-xs text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5"
          >
            <svg
              className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="agent@aqarflow.com"
          disabled={loading}
          autoComplete="email"
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
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full font-bold shadow-md hover:shadow-lg transition-all"
          size="lg"
          disabled={loading}
          isLoading={loading}
        >
          {loading ? 'Signing in...' : 'Sign In to Workspace'}
        </Button>

        <div className="pt-2 text-center text-xs text-slate-400">
          AqarFlow Real Estate Platform &copy; {new Date().getFullYear()}
        </div>
      </form>
    </div>
  );
};

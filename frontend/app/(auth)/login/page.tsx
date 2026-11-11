import React, { Suspense } from 'react';
import { LoginForm } from '@/modules/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-card border border-slate-200 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-brand-600" />
            <p className="text-slate-500 text-sm">Loading sign-in...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

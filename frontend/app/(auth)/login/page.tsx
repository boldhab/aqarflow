import React, { Suspense } from 'react';
import { LoginForm } from '@/modules/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Suspense fallback={<div className="text-slate-500 text-sm">Loading sign-in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

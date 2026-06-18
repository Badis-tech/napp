'use client';

import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-center mb-8">Welcome to NAPP</h1>
          <AuthForm mode="login" />
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Demo credentials: Use your registered email and password
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

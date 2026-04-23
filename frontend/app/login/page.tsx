"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-3xl font-bold">BenchworksAI</h1>
        <p className="text-gray-400">Outbound Campaign Operations</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full rounded-lg bg-white px-4 py-3 font-medium text-gray-900 hover:bg-gray-100 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}

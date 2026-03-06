"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type LoginActionState } from "../actions/auth-actions";
import { useAuthStore } from "../store/auth-store";

const initialState: LoginActionState = {
  success: false,
  error: "",
  user: null,
};

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.success && state.user) {
      // Keep store in sync right after login so dashboard can render immediately.
      setUser(state.user);
      router.push("/dashboard");
    }
  }, [router, setUser, state.success, state.user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Use any email/password to get a mock JWT.</p>

        {/* Using server action directly from the form to keep auth calls centralized. */}
        <form className="mt-6 space-y-4" action={formAction}>
          <div>
            <label className="mb-1 block text-sm text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="demo@multibank.local"
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue="password123"
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              required
            />
          </div>

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

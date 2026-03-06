"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUserAction, logoutAction } from "../../actions/auth-actions";
import { useAuthStore } from "../../store/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      // I always hydrate auth from server first so refresh stays authenticated.
      const result = await fetchCurrentUserAction();

      if (result.user) {
        setUser(result.user);
        setLoading(false);
        return;
      }

      clearUser();
      if (result.error && result.error !== "Unauthorized") {
        setError(result.error);
      } else {
        // If not authorized, bounce back to login right away.
        router.replace("/");
      }
      setLoading(false);
    };

    verifySession();
  }, [clearUser, router, setUser]);

  const onLogout = async () => {
    // Logout is server-driven so token cookie is removed at the source.
    await logoutAction();
    clearUser();
    router.replace("/");
  };

  if (loading) {
    return <main className="p-8">Loading dashboard...</main>;
  }

  if (error) {
    return <main className="p-8 text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <button
            type="button"
            onClick={onLogout}
            className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Authenticated as {user?.name} ({user?.email})
        </p>

        <div className="mt-8 rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
          Dashboard here...
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4001";

type User = {
  id: string;
  email: string;
  name: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const response = await fetch(`${AUTH_API_URL}/auth/currentuser`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          localStorage.removeItem("access_token");
          router.replace("/");
          return;
        }

        setUser(data.user);
      } catch {
        setError("Unable to validate session");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  const onLogout = () => {
    localStorage.removeItem("access_token");
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

"use server";

import { cookies } from "next/headers";
import { AxiosError } from "axios";
import { authHttp } from "../lib/http/http";

const ACCESS_TOKEN_COOKIE = "access_token";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginActionState = {
  success: boolean;
  error: string;
  user: AuthUser | null;
};

function getAxiosErrorMessage(error: unknown, fallback: string) {
  // I normalize API errors here so UI messages stay consistent.
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as { error?: string } | undefined;
    return apiError?.error || fallback;
  }

  return fallback;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required", user: null };
  }

  try {
    // Keep login mocked but shaped like real auth contract.
    const response = await authHttp.post("/auth/login", {
      email,
      password,
    });

    const cookieStore = await cookies();
    // Store JWT in httpOnly cookie so client code never touches raw token.
    cookieStore.set(ACCESS_TOKEN_COOKIE, response.data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60,
    });

    return {
      success: true,
      error: "",
      user: response.data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: getAxiosErrorMessage(error, "Unable to reach auth service"),
      user: null,
    };
  }
}

export async function fetchCurrentUserAction(): Promise<{ user: AuthUser | null; error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    // Fast-fail when there is no session token.
    return { user: null, error: "Unauthorized" };
  }

  try {
    const response = await authHttp.get("/auth/currentuser", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { user: response.data.user, error: "" };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      // If token is stale/invalid, clear it immediately to avoid loops.
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      return { user: null, error: "Unauthorized" };
    }

    return { user: null, error: getAxiosErrorMessage(error, "Unable to validate session") };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

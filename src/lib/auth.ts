import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { env } from "@/env";

const JWT_SECRET = env.JWT_SECRET;
const SESSION_DURATION = 24 * 60 * 60; // 24 hodin v sekundách

export interface SessionData {
  adminId: string;
  username: string;
  iat: number;
  exp: number;
}

export async function createSession(adminId: string, username: string) {
  const payload = {
    adminId,
    username,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  });

  // Nastavit cookie
  const cookieStore = await cookies();

  // Zkusíme více způsobů nastavení cookie
  cookieStore.set("admin-session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  // Backup - zkusíme také bez httpOnly pro debug
  cookieStore.set("admin-session-debug", token, {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set("admin-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

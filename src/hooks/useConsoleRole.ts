"use client";

import { useEffect, useState } from "react";
import { UserRole, USER_ROLE } from "@/src/types/enums";

const STORAGE_KEY = "console_user_role";
const ADMIN_ROLES: UserRole[] = ["owner", "admin", "auditor"];

export function useConsoleRole(): {
  role: UserRole;
  isAdmin: boolean;
  isAuditor: boolean;
} {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "viewer";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (USER_ROLE as readonly string[]).includes(stored)) {
      return stored as UserRole;
    }
    return "viewer";
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (USER_ROLE as readonly string[]).includes(stored)) {
      setRole(stored as UserRole);
    }
  }, []);

  const isAdmin = ADMIN_ROLES.includes(role);
  const isAuditor = role === "auditor" || role === "owner" || role === "admin";

  return { role, isAdmin, isAuditor };
}

export function confirmAction(message: string): boolean {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}

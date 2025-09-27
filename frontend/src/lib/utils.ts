import { type ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
  return null;
}

export function buildBackendUrl(pathname: string): string {
  const base = import.meta.env.VITE_BACKEND_URL || "";
  const baseTrimmed = base.replace(/\/$/, "");
  const pathNormalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseTrimmed}${pathNormalized}` || pathNormalized;
}

export const LOGIN_PATH: string =
  (import.meta.env.VITE_LOGIN_PATH as string) || "/accounts/login/";

export function buildLoginUrl(): string {
  return buildBackendUrl(LOGIN_PATH);
}
